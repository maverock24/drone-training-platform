# Lesson 3: Practical Pruning Pipelines for Drone Deployment

## Learning Objectives
- Combine pruning + distillation + quantization into one pipeline
- Use NVIDIA's 2:4 structured sparsity for hardware acceleration
- Deploy optimally compressed models on edge devices

## The Ultimate Compression Pipeline

```
Teacher ViT-Large (307M, 1.2 GB)
    │
    ├── Step 1: Distill → Student MobileNet (3.8M, 15 MB)     — 80× smaller
    ├── Step 2: Prune 40% → Pruned Student (2.3M, 9 MB)       — 1.7× smaller  
    ├── Step 3: Fine-tune → Recover accuracy                    — +1-2% accuracy
    ├── Step 4: Quantize INT8 → (2.3M, 2.3 MB)                — 4× smaller
    └── Step 5: TensorRT compile → Final deployment model

Total compression: ~520× smaller, ~30× faster
Accuracy: 96.2% → 92.8% (only -3.4%)
```

## NVIDIA 2:4 Structured Sparsity

NVIDIA Ampere+ GPUs have hardware support for 2:4 sparsity: in every group of 4 weights, exactly 2 must be zero. This gives 50% sparsity with near-zero overhead.

```python
import torch
from torch.ao.pruning import WeightNormSparsifier

def apply_2_4_sparsity(model):
    """Apply NVIDIA 2:4 structured sparsity pattern.
    
    For every 4 consecutive weights, the 2 smallest are zeroed.
    Hardware-accelerated on A100, H100, Jetson Orin.
    """
    sparsifier = WeightNormSparsifier(
        sparsity_level=0.5,
        sparse_block_shape=(1, 4),  # 2:4 pattern
        zeros_per_block=2,
    )
    
    # Apply to all linear layers
    sparse_config = [
        {"tensor_fqn": f"{name}.weight"}
        for name, module in model.named_modules()
        if isinstance(module, torch.nn.Linear)
    ]
    
    sparsifier.prepare(model, sparse_config)
    sparsifier.step()
    sparsifier.squash_mask()
    
    return model

# Verify sparsity pattern
def verify_2_4_pattern(tensor):
    """Check that the 2:4 pattern is maintained."""
    flat = tensor.reshape(-1)
    for i in range(0, len(flat), 4):
        group = flat[i:i+4]
        zeros = (group == 0).sum()
        assert zeros == 2, f"Pattern violation at index {i}: {zeros} zeros"
    print("2:4 sparsity pattern verified!")
```

## Complete Compression Pipeline Code

```python
class DroneModelCompressor:
    """Full pipeline: Distillation + Pruning + Quantization."""
    
    def __init__(self, teacher, train_loader, val_loader, device='cuda'):
        self.teacher = teacher.eval().to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
        self.results = {}
    
    def run_pipeline(self, num_classes=2):
        import timm
        
        # Step 1: Distill
        print("=" * 50)
        print("Step 1: Knowledge Distillation")
        student = timm.create_model('mobilenetv4_conv_small', pretrained=True,
                                     num_classes=num_classes).to(self.device)
        student = self._distill(student, epochs=50)
        self.results['distilled'] = self._benchmark(student)
        
        # Step 2: Prune
        print("=" * 50)
        print("Step 2: Structured Pruning (40%)")
        student = self._structured_prune(student, sparsity=0.4)
        self.results['pruned_before_ft'] = self._benchmark(student)
        
        # Step 3: Fine-tune after pruning
        print("=" * 50)
        print("Step 3: Fine-tuning after pruning")
        student = self._fine_tune(student, epochs=20)
        self.results['pruned_after_ft'] = self._benchmark(student)
        
        # Step 4: Quantize
        print("=" * 50)
        print("Step 4: INT8 Quantization")
        student_int8 = self._quantize(student)
        self.results['quantized'] = self._benchmark(student_int8)
        
        # Print summary
        self._print_summary()
        
        return student_int8
    
    def _distill(self, student, epochs=50, temperature=4.0, alpha=0.7):
        optimizer = torch.optim.AdamW(student.parameters(), lr=5e-4, weight_decay=0.01)
        distill_fn = DistillationLoss(temperature=temperature, alpha=alpha)
        
        for epoch in range(epochs):
            student.train()
            for images, labels in self.train_loader:
                images, labels = images.to(self.device), labels.to(self.device)
                with torch.no_grad():
                    t_logits = self.teacher(images)
                s_logits = student(images)
                loss = distill_fn(s_logits, t_logits, labels)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
        return student
    
    def _structured_prune(self, model, sparsity=0.4):
        import torch.nn.utils.prune as prune
        for name, module in model.named_modules():
            if isinstance(module, torch.nn.Conv2d) and module.out_channels > 16:
                prune.ln_structured(module, 'weight', amount=sparsity, n=1, dim=0)
                prune.remove(module, 'weight')
        return model
    
    def _fine_tune(self, model, epochs=20):
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
        for epoch in range(epochs):
            model.train()
            for images, labels in self.train_loader:
                images, labels = images.to(self.device), labels.to(self.device)
                loss = F.cross_entropy(model(images), labels)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
        return model
    
    def _quantize(self, model):
        model.eval().cpu()
        model_int8 = torch.quantization.quantize_dynamic(
            model, {torch.nn.Linear, torch.nn.Conv2d}, dtype=torch.qint8
        )
        return model_int8
    
    def _benchmark(self, model):
        model.eval()
        acc = evaluate(model, self.val_loader, self.device)
        params = sum(p.numel() for p in model.parameters())
        size_mb = sum(p.nelement() * p.element_size() for p in model.parameters()) / 1e6
        return {"accuracy": acc, "params": params, "size_mb": size_mb}
    
    def _print_summary(self):
        print("\n" + "=" * 70)
        print("COMPRESSION PIPELINE RESULTS")
        print("=" * 70)
        print(f"{'Stage':<25} {'Accuracy':>10} {'Params':>12} {'Size (MB)':>10}")
        print("-" * 70)
        for stage, metrics in self.results.items():
            print(f"{stage:<25} {metrics['accuracy']:>9.2%} "
                  f"{metrics['params']:>12,} {metrics['size_mb']:>9.1f}")
```

## Hands-On Lab

### Capstone: Full Compression Pipeline
1. Train a ViT-Base teacher on drone fire detection
2. Run the `DroneModelCompressor` pipeline
3. Deploy the final model on ONNX Runtime
4. Create a comparison report with:
   - Accuracy at each stage
   - Model size at each stage
   - Inference FPS at each stage
   - Power consumption estimate

**Deliver:** A compressed model that runs at >60 FPS on edge hardware with >90% accuracy on fire detection.

## Key Takeaways

1. Distillation + Pruning + Quantization stack multiplicatively (up to 500× compression)
2. NVIDIA 2:4 sparsity provides 50% sparsity with hardware acceleration
3. Fine-tune between pruning and quantization for best results
4. Always measure actual speedup, not just theoretical compression
5. This pipeline is the standard for deploying drone AI in production

## AI Engineer Track Complete!
You've mastered: ViTs, PEFT/LoRA, Multi-Modal Fusion, Quantization, Distillation, and Pruning. Continue to the MLOps Engineer track to learn how to deploy and maintain these models at scale.
