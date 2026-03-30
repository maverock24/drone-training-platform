# Lesson 2: Structured Pruning for Real Speedups

## Learning Objectives
- Implement structured pruning (head/channel removal)
- Achieve actual inference speedups (not just theoretical sparsity)
- Prune and restructure transformer attention heads

## Structured vs Unstructured: The Speed Reality

Unstructured pruning creates sparse matrices. But on most hardware, sparse ≠ fast:

```
Dense Matrix (No Pruning):        Sparse Matrix (50% Unstructured):
[1.2  0.8  0.3  0.9]             [1.2  0.0  0.3  0.0]
[0.5  1.1  0.7  0.2]     →       [0.0  1.1  0.0  0.2]
[0.9  0.4  0.6  1.0]             [0.9  0.0  0.6  0.0]

Hardware sees: same shape matrix → same computation time!
Speed benefit: ~0% on standard GPU, needs NVIDIA Sparse Tensor Cores (2:4 pattern)

Structured Pruning (Remove columns):
[1.2  0.3]                        
[0.5  0.7]         →  Actually smaller matrix → real speedup!
[0.9  0.6]
```

## Attention Head Pruning

ViTs have 12 heads — not all are equally important. Remove the least important:

```python
import torch
import torch.nn as nn

class HeadImportanceCalculator:
    """Calculate importance of each attention head for pruning decisions."""
    
    def __init__(self, model, dataloader, device='cuda'):
        self.model = model
        self.dataloader = dataloader
        self.device = device
    
    def compute_head_importance(self):
        """Measure head importance using attention entropy and gradient."""
        self.model.eval()
        num_layers = len(self.model.blocks)
        num_heads = self.model.blocks[0].attn.num_heads
        
        importance = torch.zeros(num_layers, num_heads).to(self.device)
        
        for images, labels in self.dataloader:
            images, labels = images.to(self.device), labels.to(self.device)
            
            # Forward with attention weights
            outputs = self.model(images)
            loss = nn.functional.cross_entropy(outputs, labels)
            loss.backward()
            
            # Collect gradient-based importance for each head
            for layer_idx, block in enumerate(self.model.blocks):
                if hasattr(block.attn, 'qkv'):
                    grad = block.attn.qkv.weight.grad
                    if grad is not None:
                        # Split gradient by head
                        head_dim = grad.shape[0] // (3 * num_heads)
                        for h in range(num_heads):
                            start = h * head_dim
                            end = (h + 1) * head_dim
                            head_grad = grad[start:end].abs().mean()
                            importance[layer_idx, h] += head_grad.item()
            
            self.model.zero_grad()
        
        # Normalize
        importance /= len(self.dataloader)
        return importance
    
    def get_heads_to_prune(self, importance, fraction=0.25):
        """Select the least important heads for removal."""
        flat = importance.view(-1)
        num_to_prune = int(flat.numel() * fraction)
        _, indices = flat.topk(num_to_prune, largest=False)
        
        heads_to_prune = {}
        num_heads = importance.shape[1]
        for idx in indices:
            layer = idx.item() // num_heads
            head = idx.item() % num_heads
            if layer not in heads_to_prune:
                heads_to_prune[layer] = []
            heads_to_prune[layer].append(head)
        
        return heads_to_prune


def prune_attention_heads(model, heads_to_prune):
    """Actually remove attention heads from the model."""
    for layer_idx, head_indices in heads_to_prune.items():
        block = model.blocks[layer_idx]
        attn = block.attn
        
        num_heads = attn.num_heads
        head_dim = attn.head_dim
        keep_heads = [h for h in range(num_heads) if h not in head_indices]
        
        # Rebuild QKV projection with fewer heads
        new_num_heads = len(keep_heads)
        new_embed_dim = new_num_heads * head_dim
        
        # Extract weights for kept heads
        old_qkv_weight = attn.qkv.weight.data
        new_qkv_weight = []
        
        for qkv_idx in range(3):  # Q, K, V
            for h in keep_heads:
                start = qkv_idx * num_heads * head_dim + h * head_dim
                end = start + head_dim
                new_qkv_weight.append(old_qkv_weight[start:end])
        
        new_qkv = nn.Linear(attn.qkv.in_features, 3 * new_embed_dim)
        new_qkv.weight.data = torch.cat(new_qkv_weight, dim=0)
        
        # Update output projection
        new_proj = nn.Linear(new_embed_dim, attn.proj.out_features)
        keep_indices = []
        for h in keep_heads:
            keep_indices.extend(range(h * head_dim, (h + 1) * head_dim))
        new_proj.weight.data = attn.proj.weight.data[:, keep_indices]
        new_proj.bias.data = attn.proj.bias.data
        
        # Replace in model
        attn.qkv = new_qkv
        attn.proj = new_proj
        attn.num_heads = new_num_heads
    
    return model
```

## Channel Pruning for CNNs

For the student MobileNet models:

```python
def prune_conv_channels(model, sparsity=0.3):
    """Remove least important output channels from Conv2d layers."""
    import torch.nn.utils.prune as prune
    
    for name, module in model.named_modules():
        if isinstance(module, nn.Conv2d):
            # L1-norm based channel importance
            prune.ln_structured(
                module, name='weight', amount=sparsity, n=1, dim=0
            )
    
    return model
```

## Hands-On Lab

### Exercise 1: Head Pruning Study
1. Compute head importance for a trained ViT-Base
2. Visualize importance heatmap (layers × heads)
3. Prune 25% of heads → fine-tune 10 epochs → measure accuracy + speed
4. Compare: which layers lose heads most easily?

### Exercise 2: Structured Pruning Pipeline
1. Start with a distilled MobileNetV4 student
2. Apply channel pruning at 20%, 30%, 40%
3. Measure actual FPS improvement (not theoretical)
4. Fine-tune and report final accuracy-speed tradeoff

## Key Takeaways

1. Structured pruning gives real speedups; unstructured often doesn't
2. Attention head pruning can remove 25% of heads with minimal accuracy loss
3. Head importance varies by layer — deeper layers often contribute less
4. Channel pruning in CNNs directly reduces computation
5. Always benchmark actual FPS, not just FLOPs or sparsity percentage

## Next Lesson → Practical Pruning Pipelines for Production
