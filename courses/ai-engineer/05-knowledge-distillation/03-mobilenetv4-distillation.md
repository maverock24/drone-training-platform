# Lesson 3: Practical Distillation for Edge Drone Models

## Learning Objectives
- Build a complete distillation pipeline: train teacher → distill → deploy
- Fine-tune distillation hyperparameters effectively
- Combine distillation with quantization for maximum compression

## Complete Distillation Pipeline

```python
class DroneDistillationPipeline:
    """End-to-end pipeline: Train teacher → Distill to student → Optimize → Deploy."""
    
    def __init__(self, num_classes, train_loader, val_loader, device='cuda'):
        self.num_classes = num_classes
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
    
    def step1_train_teacher(self, epochs=100):
        """Train the largest model we can afford."""
        import timm
        teacher = timm.create_model('vit_base_patch16_224', pretrained=True,
                                     num_classes=self.num_classes).to(self.device)
        
        optimizer = torch.optim.AdamW(teacher.parameters(), lr=1e-4, weight_decay=0.05)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, epochs)
        
        best_acc = 0
        for epoch in range(epochs):
            teacher.train()
            for images, labels in self.train_loader:
                images, labels = images.to(self.device), labels.to(self.device)
                loss = F.cross_entropy(teacher(images), labels)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
            scheduler.step()
            
            acc = self._evaluate(teacher)
            if acc > best_acc:
                best_acc = acc
                torch.save(teacher.state_dict(), 'teacher_best.pth')
                print(f"Teacher Epoch {epoch}: {acc:.2%}")
        
        teacher.load_state_dict(torch.load('teacher_best.pth'))
        return teacher
    
    def step2_distill(self, teacher, epochs=100, temperature=4.0, alpha=0.7):
        """Distill teacher knowledge into edge-deployable student."""
        import timm
        student = timm.create_model('mobilenetv4_conv_small', pretrained=True,
                                     num_classes=self.num_classes).to(self.device)
        
        teacher.eval()
        optimizer = torch.optim.AdamW(student.parameters(), lr=1e-3, weight_decay=0.01)
        distill_fn = DistillationLoss(temperature=temperature, alpha=alpha)
        
        best_acc = 0
        for epoch in range(epochs):
            student.train()
            for images, labels in self.train_loader:
                images, labels = images.to(self.device), labels.to(self.device)
                
                with torch.no_grad():
                    teacher_logits = teacher(images)
                
                student_logits = student(images)
                loss = distill_fn(student_logits, teacher_logits, labels)
                
                optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(student.parameters(), 1.0)
                optimizer.step()
            
            acc = self._evaluate(student)
            if acc > best_acc:
                best_acc = acc
                torch.save(student.state_dict(), 'student_distilled.pth')
                print(f"Student Epoch {epoch}: {acc:.2%}")
        
        student.load_state_dict(torch.load('student_distilled.pth'))
        return student
    
    def step3_quantize_and_export(self, student, precision='int8'):
        """Quantize and export for edge deployment."""
        student.eval()
        dummy = torch.randn(1, 3, 224, 224).to(self.device)
        
        # Export to ONNX
        torch.onnx.export(student, dummy, 'student.onnx', opset_version=18,
                         input_names=['image'], output_names=['prediction'])
        
        print(f"Distilled + Quantized model ready for deployment")
        print(f"Original teacher: ~340 MB (FP32)")
        print(f"Final student: ~4 MB ({precision})")
        return 'student.onnx'
    
    def _evaluate(self, model):
        model.eval()
        correct = total = 0
        with torch.no_grad():
            for images, labels in self.val_loader:
                images, labels = images.to(self.device), labels.to(self.device)
                correct += (model(images).argmax(1) == labels).sum().item()
                total += labels.size(0)
        return correct / total

# Run the complete pipeline
pipeline = DroneDistillationPipeline(num_classes=2, train_loader=train_loader,
                                      val_loader=val_loader)
teacher = pipeline.step1_train_teacher(epochs=50)
student = pipeline.step2_distill(teacher, epochs=100)
onnx_path = pipeline.step3_quantize_and_export(student, precision='int8')
```

## Distillation + Quantization: The 1-2 Punch

```
ViT-Large Teacher (307M params, 1.2 GB FP32)
    │ Knowledge Distillation
    ▼
MobileNetV4 Student (3.8M params, 15 MB FP32) — 93.5% acc (vs 96.2%)
    │ INT8 Quantization
    ▼
MobileNetV4 INT8 (3.8M params, 4 MB) — 93.1% acc, 120 FPS on Jetson

Compression: 300× smaller, 24× faster, only 3% accuracy drop
```

## Hands-On Lab

### Capstone: Deploy a Distilled Model
1. Train a ViT-Base teacher on drone fire detection
2. Distill into MobileNetV4-Small
3. Quantize the student to INT8
4. Export to TensorRT for Jetson
5. Benchmark: accuracy, latency, model size, power consumption

**Success criteria:**
- Student accuracy within 3% of teacher
- >60 FPS on Jetson Orin NX
- Model size < 10 MB
- Inference latency < 20ms

## Key Takeaways

1. The distillation→quantization pipeline achieves 100-300× compression
2. Distillation recovers accuracy lost from using a small architecture
3. Quantization further compresses without significant quality loss
4. Temperature and alpha tuning are worth the effort (1-2% accuracy impact)
5. This pipeline is the standard approach for edge drone deployment in 2026

## Course Complete → Next Course: Sparsity & Pruning
