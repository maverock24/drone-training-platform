# Lesson 1: Weight Pruning Fundamentals

## Learning Objectives
- Understand structured vs unstructured pruning
- Implement magnitude-based pruning from scratch
- Measure sparsity-accuracy tradeoffs for drone models

## Why Pruning?

Research consistently shows that trained neural networks are over-parameterized — many weights contribute negligibly to the output. Pruning removes these weights to create sparse models.

### Types of Pruning

```
Structured Pruning             Unstructured Pruning
├── Remove entire neurons      ├── Remove individual weights
├── Remove attention heads     ├── Creates sparse weight matrices
├── Remove channels            ├── Needs sparse hardware/software
├── Clean speedup on any HW    ├── Higher compression possible
└── Moderate compression       └── Needs special support
```

## Magnitude-Based Unstructured Pruning

The simplest approach: remove weights with the smallest absolute values.

```python
import torch
import torch.nn.utils.prune as prune

def apply_magnitude_pruning(model, sparsity=0.4):
    """Remove weights with smallest magnitude across all linear layers.
    
    Args:
        sparsity: Fraction of weights to remove (0.4 = 40% sparse)
    """
    parameters_to_prune = []
    for name, module in model.named_modules():
        if isinstance(module, (torch.nn.Linear, torch.nn.Conv2d)):
            parameters_to_prune.append((module, 'weight'))
    
    # Global pruning: find the 40th percentile across ALL layers
    prune.global_unstructured(
        parameters_to_prune,
        pruning_method=prune.L1Unstructured,
        amount=sparsity,
    )
    
    # Count zeros
    total = 0
    pruned = 0
    for module, param_name in parameters_to_prune:
        mask = getattr(module, param_name + '_mask', None)
        if mask is not None:
            total += mask.numel()
            pruned += (mask == 0).sum().item()
    
    print(f"Sparsity: {pruned/total:.1%} ({pruned:,} / {total:,} weights removed)")
    return model


def make_pruning_permanent(model):
    """Remove pruning reparameterization, making sparse weights permanent."""
    for module in model.modules():
        if isinstance(module, (torch.nn.Linear, torch.nn.Conv2d)):
            try:
                prune.remove(module, 'weight')
            except ValueError:
                pass
    return model
```

## Iterative Pruning with Fine-Tuning

Pruning all at once is aggressive. Better: prune gradually and retrain between steps.

```python
def iterative_pruning(model, train_loader, val_loader, 
                       target_sparsity=0.5, steps=5, retrain_epochs=10):
    """Gradually prune to target sparsity with interleaved fine-tuning."""
    
    per_step_sparsity = 1 - (1 - target_sparsity) ** (1 / steps)
    current_sparsity = 0
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
    
    for step in range(steps):
        # Prune
        current_sparsity = 1 - (1 - per_step_sparsity) ** (step + 1)
        apply_magnitude_pruning(model, sparsity=current_sparsity)
        
        # Evaluate immediately after pruning
        acc_before = evaluate(model, val_loader)
        
        # Fine-tune to recover accuracy
        for epoch in range(retrain_epochs):
            model.train()
            for images, labels in train_loader:
                images, labels = images.cuda(), labels.cuda()
                loss = F.cross_entropy(model(images), labels)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
        
        acc_after = evaluate(model, val_loader)
        print(f"Step {step+1}: Sparsity={current_sparsity:.1%}, "
              f"Acc before retrain={acc_before:.2%}, after={acc_after:.2%}")
    
    return model
```

## Sparsity vs Accuracy: Typical Results

| Sparsity | ViT-Base Accuracy | MobileNet Accuracy | Notes |
|----------|------------------|-------------------|-------|
| 0% | 94.5% | 91.2% | Baseline (dense) |
| 20% | 94.4% | 91.0% | Negligible loss |
| 40% | 94.1% | 90.5% | Sweet spot |
| 60% | 93.2% | 89.0% | Noticeable drop |
| 80% | 90.1% | 84.5% | Significant loss |
| 90% | 85.3% | 78.2% | Too aggressive |

**Sweet spot: 30-50% sparsity with <1% accuracy loss.**

## Hands-On Lab

### Exercise 1: Pruning Exploration
1. Train a ViT-Small to convergence on drone imagery
2. Apply one-shot magnitude pruning at 10%, 20%, 30%, 40%, 50%
3. Plot sparsity vs accuracy (before and after 5 epochs of fine-tuning)
4. Find the maximum sparsity with <1% accuracy loss

### Exercise 2: Iterative vs One-Shot
Compare on the same model:
- One-shot 50% pruning + 20 epochs fine-tuning
- 5-step iterative pruning to 50% with 4 epochs between steps
- Which recovers more accuracy?

## Key Takeaways

1. Most networks can be pruned 30-50% with negligible accuracy loss
2. Global pruning (across layers) outperforms per-layer pruning
3. Iterative pruning with fine-tuning recovers more accuracy than one-shot
4. Magnitude-based pruning is simple but effective
5. Sparse models need hardware/software support to realize actual speedups

## Next Lesson → Unstructured Pruning for Production
