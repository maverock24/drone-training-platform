# Lesson 1: Introduction to Parameter-Efficient Fine-Tuning

## Learning Objectives
- Understand why full fine-tuning is impractical for large models
- Survey the landscape of PEFT methods
- Identify when to use which PEFT approach for drone AI

## The Fine-Tuning Bottleneck

Large language models and vision models have grown enormously:

| Model | Parameters | Full Fine-Tuning GPU RAM | Training Time |
|-------|-----------|-------------------------|---------------|
| ViT-Large | 307M | 12 GB | 4 hours |
| Llama 3 8B | 8B | 80 GB | 48 hours |
| Llama 4 Scout | 17B active | 160 GB | days |
| Mistral Large | 123B | 400+ GB | weeks |

Full fine-tuning updates ALL parameters, requiring:
- Massive GPU memory (optimizer states = 2× model size with Adam)
- Long training times
- Risk of catastrophic forgetting
- One copy per task (storage intensive)

**PEFT solves this by updating <1% of parameters while achieving 95-100% of full fine-tuning performance.**

## PEFT Methods Overview

```
Parameter-Efficient Fine-Tuning
├── Additive Methods
│   ├── Adapters (insert small layers)
│   ├── Prefix Tuning (learnable input tokens)
│   └── Prompt Tuning (soft prompts)
├── Reparameterization Methods
│   ├── LoRA (low-rank weight updates)    ← Most popular
│   └── QLoRA (quantized LoRA)            ← Most practical
└── Selective Methods
    ├── BitFit (bias-only tuning)
    └── Head tuning (last layers only)
```

### Method Comparison for Drone Tasks

| Method | Trainable Params | GPU RAM | Quality | Best For |
|--------|-----------------|---------|---------|----------|
| Full Fine-Tuning | 100% | Very High | 100% | Unlimited resources |
| LoRA | 0.1-1% | Low | 97-100% | Vision + Language tasks |
| QLoRA | 0.1-1% | Very Low | 95-99% | Consumer GPUs (RTX 3090/4090) |
| Adapters | 1-5% | Medium | 96-99% | Multi-task deployment |
| Prefix Tuning | 0.1% | Low | 90-95% | Quick experimentation |
| Prompt Tuning | <0.01% | Minimal | 85-95% | Extreme efficiency |

## Why PEFT for Drone AI?

### Scenario 1: Adapting LLMs for Drone Mission Planning
You have Llama 4 (17B parameters) and need it to understand drone terminology, mission plans, and aerial image descriptions. Full fine-tuning would need 4× A100 80GB GPUs. With QLoRA, you can do it on a single RTX 4090 (24GB).

### Scenario 2: Multi-Mission ViT
A single base ViT model needs to perform:
- Fire detection (Mission A)
- Search and rescue (Mission B)
- Agricultural survey (Mission C)

With LoRA, you train separate small adapters (~5MB each) and swap them at mission start:

```python
# Mission A: Load fire detection adapter
model.load_adapter("fire_detection_lora.bin")

# Mission B: Swap to search and rescue
model.load_adapter("search_rescue_lora.bin")

# Base model (2GB) stays the same — only swap tiny adapters
```

### Scenario 3: Continuous Learning
Drones encounter new environments. With PEFT, you can quickly adapt to new conditions (snow, night, fog) without retraining from scratch, and keep a library of specialized adapters.

## Mathematical Foundation

The key insight of PEFT: **not all parameter changes during fine-tuning are equally important.** Research shows that weight update matrices during fine-tuning have low intrinsic rank — meaning the "important" changes live in a much lower-dimensional space.

If the original weight matrix W ∈ ℝ^(d×k) gets updated by ΔW:

$$W_{fine-tuned} = W_{pretrained} + \Delta W$$

Full fine-tuning: ΔW has d×k trainable parameters.

LoRA insight: ΔW ≈ BA where B ∈ ℝ^(d×r) and A ∈ ℝ^(r×k), with rank r << min(d,k).

Trainable parameters: d×r + r×k = r(d+k), which is tiny when r is small (typically 4-64).

## Hands-On Lab

### Exercise 1: Measuring Fine-Tuning Cost
1. Load `vit_base_patch16_224` from timm
2. Calculate total parameters
3. Run a forward + backward pass, measuring peak GPU memory
4. Compare with fine-tuning only the classification head

### Exercise 2: PEFT Method Survey
Research and summarize in a table:
- 3 papers on LoRA/QLoRA for vision tasks
- 2 papers on adapters for multi-task learning
- 1 paper on prompt tuning for vision

## Key Takeaways

1. PEFT updates <1% of parameters for near-full-fine-tuning quality
2. LoRA is the dominant PEFT method as of 2026
3. QLoRA enables large model fine-tuning on consumer GPUs
4. Adapter swapping enables multi-mission drone operations
5. The mathematical basis is low intrinsic dimensionality of weight updates

## Next Lesson → LoRA Fundamentals
