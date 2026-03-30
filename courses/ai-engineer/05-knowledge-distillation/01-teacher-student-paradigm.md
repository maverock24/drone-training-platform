# Lesson 1: The Teacher-Student Paradigm

## Learning Objectives
- Understand knowledge distillation as model compression
- Implement standard KD with temperature scaling
- Design teacher-student pairs for drone vision tasks

## What is Knowledge Distillation?

Knowledge distillation transfers "dark knowledge" from a large, accurate Teacher model to a small, fast Student model. The student learns not just the correct answers, but the teacher's *reasoning* — expressed through soft probability distributions.

### Why Not Just Train a Small Model?

A small model trained directly on hard labels (one-hot) learns: "This is fire (100%) and nothing else."

A small model distilled from a teacher learns: "This is fire (85%), smoke is likely (10%), and there's some chance it's a cloud (5%)." These inter-class relationships contain critical information.

## Standard Knowledge Distillation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class DistillationLoss(nn.Module):
    """Combined distillation + classification loss.
    
    L = α * KL(soft_student || soft_teacher) + (1-α) * CE(student, labels)
    """
    
    def __init__(self, temperature=4.0, alpha=0.7):
        super().__init__()
        self.temperature = temperature
        self.alpha = alpha
    
    def forward(self, student_logits, teacher_logits, labels):
        # Soft targets from teacher (with temperature)
        soft_teacher = F.softmax(teacher_logits / self.temperature, dim=-1)
        soft_student = F.log_softmax(student_logits / self.temperature, dim=-1)
        
        # KL Divergence loss (soft targets)
        # Multiply by T² to balance gradient magnitudes
        distill_loss = F.kl_div(
            soft_student, soft_teacher, reduction='batchmean'
        ) * (self.temperature ** 2)
        
        # Standard cross-entropy loss (hard targets)
        ce_loss = F.cross_entropy(student_logits, labels)
        
        # Combined loss
        return self.alpha * distill_loss + (1 - self.alpha) * ce_loss
```

### The Temperature Parameter

Temperature τ controls the "softness" of probability distributions:

```
Teacher output (logits):     [5.2,  1.8,  0.3, -0.5]

τ = 1 (standard softmax):   [0.91, 0.06, 0.02, 0.01]  ← Very peaked
τ = 4 (soft):                [0.44, 0.27, 0.17, 0.12]  ← Inter-class info visible
τ = 10 (very soft):          [0.30, 0.26, 0.23, 0.21]  ← Too uniform
```

**τ = 3-5 is the sweet spot for most tasks.**

## Drone Distillation: ViT-Large → MobileNetV4

```python
import timm

# Teacher: Large, accurate model (runs in cloud or during training)
teacher = timm.create_model('vit_large_patch16_224', pretrained=True, num_classes=10)
teacher.eval()
for param in teacher.parameters():
    param.requires_grad = False  # Freeze teacher

# Student: Small, fast model (deploys on drone)
student = timm.create_model('mobilenetv4_conv_small', pretrained=True, num_classes=10)

# Training with distillation
distill_loss_fn = DistillationLoss(temperature=4.0, alpha=0.7)
optimizer = torch.optim.AdamW(student.parameters(), lr=5e-4, weight_decay=0.01)

for epoch in range(100):
    student.train()
    for images, labels in train_loader:
        images, labels = images.cuda(), labels.cuda()
        
        # Get teacher predictions (no gradient needed)
        with torch.no_grad():
            teacher_logits = teacher(images)
        
        # Get student predictions
        student_logits = student(images)
        
        # Distillation loss
        loss = distill_loss_fn(student_logits, teacher_logits, labels)
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
```

### Expected Results for Drone Tasks

| Model | Params | GFLOPs | Fire Detection Acc | FPS (Jetson) |
|-------|--------|--------|-------------------|-------------|
| ViT-Large (Teacher) | 307M | 61.6 | 96.2% | 5 |
| MobileNetV4 (Direct) | 3.8M | 0.3 | 89.1% | 120 |
| MobileNetV4 (Distilled) | 3.8M | 0.3 | **93.5%** | 120 |

Distillation closes the gap by **62%** (89.1→93.5 of the 89.1→96.2 delta) while keeping full speed.

## Hands-On Lab

### Exercise 1: Basic Distillation
1. Train a ViT-Base teacher on the FLAME fire dataset (target: >94%)
2. Distill into MobileNetV4-Small
3. Compare: student trained directly vs distilled student
4. Plot the soft probability distributions from teacher vs student

### Exercise 2: Temperature Sweep  
1. Distill with temperatures: 1, 2, 4, 8, 16
2. Plot temperature vs student accuracy
3. Visualize the soft probability distributions at each temperature

## Key Takeaways

1. Distillation transfers inter-class relationships, not just correct labels
2. Temperature 3-5 usually gives the best soft target distributions
3. α = 0.7 (70% distill, 30% hard labels) is a strong starting point
4. Distillation can recover 50-70% of the accuracy gap between teacher and student
5. The student maintains full inference speed — distillation is a training-time technique

## Next Lesson → KL Divergence and Advanced Distillation
