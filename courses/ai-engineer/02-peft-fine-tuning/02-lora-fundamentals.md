# Lesson 2: LoRA Fundamentals

## Learning Objectives
- Implement LoRA from scratch to understand the mechanism
- Apply LoRA to transformer attention layers
- Configure rank, alpha, and target modules for optimal results

## Low-Rank Adaptation (LoRA)

LoRA decomposes weight updates into two small matrices, dramatically reducing trainable parameters.

### Core Idea

Instead of updating a weight matrix W directly:

$$h = Wx \quad \rightarrow \quad h = Wx + \frac{\alpha}{r} BAx$$

Where:
- W ∈ ℝ^(d×k) — frozen pretrained weights
- B ∈ ℝ^(d×r) — trainable, initialized to zeros
- A ∈ ℝ^(r×k) — trainable, initialized with Kaiming uniform
- r — rank (typically 4, 8, 16, or 64)
- α — scaling factor (typically 2×r)

### LoRA from Scratch

```python
import torch
import torch.nn as nn
import math

class LoRALayer(nn.Module):
    """A single LoRA adapter that wraps a frozen linear layer."""
    
    def __init__(self, original_layer, rank=8, alpha=16, dropout=0.05):
        super().__init__()
        self.original = original_layer
        self.rank = rank
        self.alpha = alpha
        self.scaling = alpha / rank
        
        in_features = original_layer.in_features
        out_features = original_layer.out_features
        
        # Freeze original weights
        self.original.weight.requires_grad = False
        if self.original.bias is not None:
            self.original.bias.requires_grad = False
        
        # LoRA matrices
        self.lora_A = nn.Parameter(torch.empty(rank, in_features))
        self.lora_B = nn.Parameter(torch.zeros(out_features, rank))
        self.lora_dropout = nn.Dropout(dropout) if dropout > 0 else nn.Identity()
        
        # Initialize A with Kaiming, B with zeros
        # This ensures ΔW = BA = 0 at initialization → no change to pretrained behavior
        nn.init.kaiming_uniform_(self.lora_A, a=math.sqrt(5))
    
    def forward(self, x):
        # Original frozen path
        original_out = self.original(x)
        
        # LoRA path: x → dropout → A → B → scale
        lora_out = self.lora_dropout(x)
        lora_out = lora_out @ self.lora_A.T  # (batch, rank)
        lora_out = lora_out @ self.lora_B.T  # (batch, out_features)
        lora_out = lora_out * self.scaling
        
        return original_out + lora_out
    
    def merge(self):
        """Merge LoRA weights into original layer for zero-overhead inference."""
        self.original.weight.data += (self.lora_B @ self.lora_A) * self.scaling
        return self.original
    
    @property
    def trainable_params(self):
        return self.rank * (self.lora_A.shape[1] + self.lora_B.shape[0])
```

### Applying LoRA to a ViT

```python
def apply_lora_to_vit(model, rank=8, alpha=16, target_modules=None):
    """Apply LoRA adapters to specified modules in a ViT.
    
    Args:
        model: A pretrained ViT model
        rank: LoRA rank
        alpha: LoRA scaling factor  
        target_modules: List of module name patterns to apply LoRA to
                       Default: attention Q, K, V projections
    """
    if target_modules is None:
        target_modules = ['qkv', 'proj']  # Attention layers
    
    total_trainable = 0
    total_params = sum(p.numel() for p in model.parameters())
    
    for name, module in model.named_modules():
        if any(t in name for t in target_modules):
            if isinstance(module, nn.Linear):
                # Replace with LoRA-wrapped version
                parent_name = '.'.join(name.split('.')[:-1])
                child_name = name.split('.')[-1]
                parent = dict(model.named_modules())[parent_name]
                
                lora_layer = LoRALayer(module, rank=rank, alpha=alpha)
                setattr(parent, child_name, lora_layer)
                total_trainable += lora_layer.trainable_params
    
    # Freeze all other parameters
    for name, param in model.named_parameters():
        if 'lora_' not in name:
            param.requires_grad = False
    
    print(f"Total parameters: {total_params:,}")
    print(f"Trainable parameters: {total_trainable:,}")
    print(f"Trainable %: {total_trainable/total_params*100:.2f}%")
    
    return model

# Example usage
import timm
model = timm.create_model('vit_base_patch16_224', pretrained=True, num_classes=2)
model = apply_lora_to_vit(model, rank=8, alpha=16)
# Output: Total: 86M, Trainable: ~295K (0.34%)
```

## Using HuggingFace PEFT Library

In practice, use the `peft` library for production LoRA:

```python
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForSequenceClassification

# For language models
lora_config = LoraConfig(
    r=16,                    # Rank
    lora_alpha=32,           # Alpha (usually 2*r)
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.SEQ_CLS,
)

model = AutoModelForSequenceClassification.from_pretrained("meta-llama/Llama-3-8B")
peft_model = get_peft_model(model, lora_config)
peft_model.print_trainable_parameters()
# trainable params: 3,407,872 || all params: 8,033,669,120 || trainable%: 0.042%
```

## Hyperparameter Guide

### Rank (r)

| Rank | Trainable Params | Quality | Use Case |
|------|-----------------|---------|----------|
| 4 | Minimal | Good for simple tasks | Binary classification |
| 8 | Low | Great for most tasks | Standard recommendation |
| 16 | Medium | Near full FT quality | Complex multi-class |
| 32 | Higher | Matches full FT | Domain shift tasks |
| 64 | High | Overkill for most | Very complex tasks |

**Rule of thumb:** Start with r=8. If validation loss plateaus, try r=16.

### Alpha (α)

The scaling factor `α/r` controls how much the LoRA update influences the output:
- **α = r**: LoRA update has weight 1.0 (conservative)
- **α = 2r**: LoRA update has weight 2.0 (standard)
- **Too high α**: Training instability
- **Too low α**: Underfitting (LoRA can't change the model enough)

### Target Modules

Which layers to apply LoRA to:

```
Transformer Block
├── Self-Attention
│   ├── Q projection  ← Apply LoRA ✓
│   ├── K projection  ← Apply LoRA ✓
│   ├── V projection  ← Apply LoRA ✓
│   └── Output proj   ← Apply LoRA ✓ (optional, helps for complex tasks)
├── MLP
│   ├── Up projection ← Apply LoRA (advanced, for maximum quality)
│   └── Down projection ← Apply LoRA (advanced)
└── LayerNorm ← Don't apply LoRA ✗
```

**For vision tasks:** Q, V projections are usually sufficient.
**For language tasks:** Q, K, V, O projections recommended.
**For maximum quality:** Add MLP projections too.

## Hands-On Lab

### Exercise 1: LoRA from Scratch
1. Implement `LoRALayer` as shown above
2. Apply it to a pretrained ViT-Small
3. Train on the FLAME fire detection dataset
4. Compare accuracy with full fine-tuning

### Exercise 2: Rank Ablation Study
1. Train the same model with ranks: 2, 4, 8, 16, 32, 64
2. Plot: rank vs accuracy, rank vs training time, rank vs memory
3. Find the "sweet spot" where increasing rank stops helping

### Exercise 3: Adapter Merging
1. Train a LoRA adapter for fire detection
2. Merge the adapter into the base model using `.merge()`
3. Verify that the merged model produces identical outputs
4. Compare inference speed: LoRA vs merged

## Key Takeaways

1. LoRA decomposes weight updates as ΔW = BA with low rank r
2. Zero initialization of B ensures no change at training start
3. The `peft` library makes production LoRA simple
4. Rank 8 with alpha 16 is a strong starting point
5. Merged LoRA has zero inference overhead

## Next Lesson → QLoRA: Fine-Tuning on Consumer GPUs
