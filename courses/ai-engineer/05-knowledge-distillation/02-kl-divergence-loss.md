# Lesson 2: KL Divergence and Advanced Distillation Methods

## Learning Objectives
- Deep dive into KL divergence loss mechanics
- Implement feature-level and attention-level distillation
- Apply multi-teacher distillation for robust student models

## KL Divergence: The Mathematical Core

$$D_{KL}(P \| Q) = \sum_{i} P(i) \log \frac{P(i)}{Q(i)}$$

Where P = teacher distribution (target), Q = student distribution (learner).

Properties:
- Always ≥ 0 (equals 0 when P = Q)
- Asymmetric: KL(P||Q) ≠ KL(Q||P)
- Not a true distance metric

```python
def kl_divergence_manual(teacher_logits, student_logits, temperature=4.0):
    """Manual KL divergence computation for understanding."""
    p = F.softmax(teacher_logits / temperature, dim=-1)  # Teacher
    q = F.log_softmax(student_logits / temperature, dim=-1)  # Student (log)
    
    # KL(P || Q) = sum(P * log(P/Q)) = sum(P * (log P - log Q))
    kl = (p * (p.log() - q)).sum(dim=-1).mean()
    
    return kl * (temperature ** 2)
```

## Feature-Level Distillation

Instead of only matching output probabilities, match intermediate representations:

```python
class FeatureDistillationLoss(nn.Module):
    """Match intermediate feature maps between teacher and student."""
    
    def __init__(self, teacher_dims, student_dims):
        super().__init__()
        # Projection layers to align dimensions
        self.projectors = nn.ModuleList([
            nn.Linear(s_dim, t_dim) for t_dim, s_dim in zip(teacher_dims, student_dims)
        ])
    
    def forward(self, teacher_features, student_features):
        """
        teacher_features: List of tensors from teacher intermediate layers
        student_features: List of tensors from student intermediate layers
        """
        loss = 0
        for t_feat, s_feat, proj in zip(teacher_features, student_features, self.projectors):
            # Project student features to teacher dimension
            s_projected = proj(s_feat)
            # L2 loss between normalized features
            t_norm = F.normalize(t_feat, dim=-1)
            s_norm = F.normalize(s_projected, dim=-1)
            loss += F.mse_loss(s_norm, t_norm)
        
        return loss / len(self.projectors)


class DistillationTrainer:
    """Complete distillation trainer with output + feature + attention distillation."""
    
    def __init__(self, teacher, student, temperature=4.0, alpha=0.5, beta=0.3, gamma=0.2):
        self.teacher = teacher.eval()
        self.student = student
        self.output_loss = DistillationLoss(temperature, alpha=1.0)
        self.feature_loss = FeatureDistillationLoss(
            teacher_dims=[768, 768, 768],
            student_dims=[256, 256, 256],
        )
        self.ce_loss = nn.CrossEntropyLoss()
        self.alpha = alpha  # Output distillation weight
        self.beta = beta    # Feature distillation weight
        self.gamma = gamma  # Hard label weight
    
    def compute_loss(self, images, labels):
        # Teacher forward (with intermediate features)
        with torch.no_grad():
            t_logits, t_features = self.teacher(images, return_features=True)
        
        # Student forward (with intermediate features)
        s_logits, s_features = self.student(images, return_features=True)
        
        # Combined loss
        loss = (
            self.alpha * self.output_loss(s_logits, t_logits, labels) +
            self.beta * self.feature_loss(t_features, s_features) +
            self.gamma * self.ce_loss(s_logits, labels)
        )
        return loss

```

## Multi-Teacher Distillation

For drone applications, use multiple specialized teachers:

```python
class MultiTeacherDistillation:
    """Distill from multiple teacher models into one student.
    
    Example teachers:
    - Teacher A: ViT-Large fine-tuned on RGB fire detection
    - Teacher B: ViT-Large fine-tuned on thermal anomaly detection
    - Teacher C: Swin-T fine-tuned on object detection
    """
    
    def __init__(self, teachers, student, teacher_weights=None):
        self.teachers = [t.eval() for t in teachers]
        self.student = student
        self.weights = teacher_weights or [1.0 / len(teachers)] * len(teachers)
    
    def compute_loss(self, images, labels, temperature=4.0):
        # Get ensemble of teacher predictions
        teacher_logits_list = []
        with torch.no_grad():
            for teacher in self.teachers:
                teacher_logits_list.append(teacher(images))
        
        # Weighted average of teacher soft targets
        soft_targets = sum(
            w * F.softmax(logits / temperature, dim=-1)
            for w, logits in zip(self.weights, teacher_logits_list)
        )
        
        # Student prediction
        student_logits = self.student(images)
        student_soft = F.log_softmax(student_logits / temperature, dim=-1)
        
        # KL divergence against ensemble
        distill_loss = F.kl_div(student_soft, soft_targets, reduction='batchmean')
        distill_loss *= temperature ** 2
        
        # Hard label loss
        ce_loss = F.cross_entropy(student_logits, labels)
        
        return 0.7 * distill_loss + 0.3 * ce_loss
```

## Hands-On Lab

### Exercise 1: Feature Distillation
1. Extract features from layers 3, 6, 9, 12 of a ViT-Base teacher
2. Extract features from layers 1, 2, 3, 4 of a MobileNet student
3. Train with feature-level distillation
4. Compare accuracy: output-only vs feature-level distillation

### Exercise 2: Multi-Teacher Ensemble
1. Train 3 teachers with different augmentation strategies
2. Distill all 3 into one student
3. Compare: single teacher vs multi-teacher distillation accuracy

## Key Takeaways

1. Feature distillation provides richer supervision than output-only distillation
2. Multi-teacher distillation creates more robust students
3. Careful feature dimension alignment (via projection) is essential
4. Combine output, feature, and hard-label losses for best results
5. Higher temperature (4-8) works better for feature-level distillation
