# Lesson 1: Precision Formats in Deep Learning

## Learning Objectives
- Understand FP32, FP16, BF16, FP8, and INT formats
- Identify when to use each precision level
- Measure the accuracy/speed/memory tradeoffs

## Why Precision Matters for Drones

Edge devices have strict constraints:
- **Memory**: Jetson Orin NX has 16GB shared between CPU and GPU
- **Power**: Every watt counts for flight time
- **Latency**: Object detection must run at 30+ FPS for obstacle avoidance

Reducing precision directly addresses all three.

## Number Format Reference

```
FP32:  1 sign + 8 exponent + 23 mantissa = 32 bits  │ Range: ±3.4e38
FP16:  1 sign + 5 exponent + 10 mantissa = 16 bits  │ Range: ±65504
BF16:  1 sign + 8 exponent +  7 mantissa = 16 bits  │ Range: ±3.4e38
FP8:   1 sign + 4 exponent +  3 mantissa =  8 bits  │ Range: ±448 (E4M3)
       1 sign + 5 exponent +  2 mantissa =  8 bits  │ Range: ±57344 (E5M2)
INT8:  8 bits, integer only                          │ Range: -128 to 127
INT4:  4 bits, integer only                          │ Range: -8 to 7
```

### Memory Impact

| Format | Model (86M params) | Bandwidth | Speedup |
|--------|-------------------|-----------|---------|
| FP32 | 344 MB | 1.0× | 1.0× |
| FP16 | 172 MB | 2.0× | ~2× |
| BF16 | 172 MB | 2.0× | ~2× |
| FP8 | 86 MB | 4.0× | ~3× |
| INT8 | 86 MB | 4.0× | ~3-4× |
| INT4 | 43 MB | 8.0× | ~4-6× |

## Mixed Precision Training

Standard approach: keep a FP32 master copy, do computations in FP16/BF16.

```python
import torch
from torch.cuda.amp import autocast, GradScaler

model = ViT().cuda()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
scaler = GradScaler()

for images, labels in train_loader:
    images, labels = images.cuda(), labels.cuda()
    
    optimizer.zero_grad()
    
    with autocast(dtype=torch.bfloat16):
        outputs = model(images)
        loss = criterion(outputs, labels)
    
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

### BF16 vs FP16

```
FP16 issues:
- Limited range (max 65504) → gradient overflow during training
- Requires loss scaling (GradScaler) to handle small gradients

BF16 advantages:
- Same range as FP32 (8-bit exponent) → no overflow issues
- No loss scaling needed
- Slightly less precision (7 vs 10 mantissa bits) — negligible for most tasks

Recommendation for 2026: Use BF16 for training, FP8/INT8 for inference.
```

## Hands-On Lab

### Exercise 1: Precision Benchmark
1. Load a pretrained ViT model
2. Run inference in FP32, FP16, BF16 on 1000 drone images
3. Measure: latency, GPU memory, accuracy (vs FP32 baseline)
4. Create a comparison table

### Exercise 2: Mixed Precision Training
1. Train a ViT-Small on a drone dataset in FP32 (baseline) 
2. Train with AMP (BF16 mixed precision)
3. Compare: convergence speed, final accuracy, training time, peak memory

## Key Takeaways

1. FP32 → FP16/BF16 gives ~2× speedup with negligible quality loss
2. BF16 is safer than FP16 (no overflow without loss scaling)
3. FP8 is the 2026 standard for inference on modern NVIDIA GPUs
4. INT8/INT4 offer maximum compression for edge deployment
5. Mixed precision training is a free lunch — always use it

## Next Lesson → FP8 Quantization
