# Lesson 3: Multi-Head Self-Attention for Images

## Learning Objectives
- Implement multi-head self-attention (MHSA) from scratch
- Understand how attention discovers relationships between image patches
- Analyze attention maps to interpret model behavior for drone imagery

## Self-Attention: The Core Mechanism

Self-attention allows each patch to compute a weighted sum of all other patches, where the weights are data-dependent. This is what gives ViTs their power — every patch can "see" every other patch in a single layer.

### Single-Head Attention

```python
import torch
import torch.nn as nn
import math

class SingleHeadAttention(nn.Module):
    def __init__(self, embed_dim=768):
        super().__init__()
        self.embed_dim = embed_dim
        
        self.W_q = nn.Linear(embed_dim, embed_dim)
        self.W_k = nn.Linear(embed_dim, embed_dim)
        self.W_v = nn.Linear(embed_dim, embed_dim)
        
    def forward(self, x):
        # x: (batch, seq_len, embed_dim) = (B, 197, 768)
        Q = self.W_q(x)  # Queries: "What am I looking for?"
        K = self.W_k(x)  # Keys: "What do I contain?"
        V = self.W_v(x)  # Values: "What information do I provide?"
        
        # Compute attention scores
        scale = math.sqrt(self.embed_dim)
        attn_scores = torch.matmul(Q, K.transpose(-2, -1)) / scale  # (B, 197, 197)
        
        # Softmax to get attention weights (probabilities)
        attn_weights = torch.softmax(attn_scores, dim=-1)  # (B, 197, 197)
        
        # Weighted sum of values
        output = torch.matmul(attn_weights, V)  # (B, 197, 768)
        
        return output, attn_weights
```

### Multi-Head Attention

Multiple attention heads allow the model to attend to different types of relationships simultaneously:
- **Head 1** might focus on color similarity
- **Head 2** might focus on spatial proximity
- **Head 3** might focus on texture patterns
- **Head 4** might focus on object boundaries

```python
class MultiHeadSelfAttention(nn.Module):
    def __init__(self, embed_dim=768, num_heads=12, dropout=0.0):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads  # 64
        
        assert embed_dim % num_heads == 0, "embed_dim must be divisible by num_heads"
        
        # Combined QKV projection for efficiency
        self.qkv = nn.Linear(embed_dim, 3 * embed_dim)
        self.proj = nn.Linear(embed_dim, embed_dim)
        self.attn_dropout = nn.Dropout(dropout)
        self.proj_dropout = nn.Dropout(dropout)
        
    def forward(self, x):
        B, N, C = x.shape  # (batch, 197, 768)
        
        # Compute Q, K, V in one go
        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)  # (3, B, heads, N, head_dim)
        Q, K, V = qkv.unbind(0)             # Each: (B, heads, 197, 64)
        
        # Scaled dot-product attention
        scale = math.sqrt(self.head_dim)
        attn = torch.matmul(Q, K.transpose(-2, -1)) / scale  # (B, heads, 197, 197)
        attn = torch.softmax(attn, dim=-1)
        attn = self.attn_dropout(attn)
        
        # Apply attention to values
        out = torch.matmul(attn, V)           # (B, heads, 197, 64)
        out = out.transpose(1, 2).reshape(B, N, C)  # (B, 197, 768)
        
        # Output projection
        out = self.proj(out)
        out = self.proj_dropout(out)
        
        return out, attn
```

## Attention in Drone Imagery: Practical Analysis

### What Does Attention Look Like?

For a drone image surveying a forest fire zone:

```
Patch at smoke location attends to:
├── Adjacent smoke patches (local context)        → weight: 0.15
├── Thermal hotspot below the smoke (cause)       → weight: 0.25
├── Wind-blown debris patches (direction)         → weight: 0.10
├── Clear sky patches (contrast reference)        → weight: 0.05
└── Tree canopy patches (fuel source)             → weight: 0.12
```

### Attention Map Extraction & Visualization

```python
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import timm

def visualize_attention(image_path, model_name='vit_base_patch16_224'):
    """Extract and visualize attention maps from a pretrained ViT."""
    
    # Load model
    model = timm.create_model(model_name, pretrained=True)
    model.eval()
    
    # Prepare image
    from timm.data import resolve_data_config, create_transform
    config = resolve_data_config({}, model=model)
    transform = create_transform(**config)
    
    img = Image.open(image_path).convert('RGB')
    tensor = transform(img).unsqueeze(0)
    
    # Hook to capture attention weights
    attention_maps = []
    
    def hook_fn(module, input, output):
        # timm ViT returns attention weights when we register hooks
        attention_maps.append(output)
    
    # Register hooks on attention layers
    hooks = []
    for block in model.blocks:
        hook = block.attn.register_forward_hook(hook_fn)
        hooks.append(hook)
    
    # Forward pass
    with torch.no_grad():
        _ = model(tensor)
    
    # Clean up hooks
    for hook in hooks:
        hook.remove()
    
    return attention_maps

def plot_cls_attention(attn_weights, grid_size=14):
    """Plot what the [CLS] token attends to in each head."""
    # attn shape: (1, num_heads, 197, 197)
    # CLS attention to patches: attn[0, :, 0, 1:]
    
    cls_attn = attn_weights[0, :, 0, 1:]  # (num_heads, 196)
    cls_attn = cls_attn.reshape(-1, grid_size, grid_size)
    
    fig, axes = plt.subplots(3, 4, figsize=(16, 12))
    for idx, ax in enumerate(axes.flat):
        if idx < cls_attn.shape[0]:
            ax.imshow(cls_attn[idx].cpu().numpy(), cmap='hot')
            ax.set_title(f'Head {idx}')
            ax.axis('off')
    
    plt.suptitle('[CLS] Token Attention per Head')
    plt.tight_layout()
    plt.savefig('attention_maps.png', dpi=150)
    plt.show()
```

## The Transformer Encoder Block

Self-attention is wrapped in a full encoder block with residual connections and an MLP:

```python
class TransformerBlock(nn.Module):
    def __init__(self, embed_dim=768, num_heads=12, mlp_ratio=4.0, dropout=0.0):
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = MultiHeadSelfAttention(embed_dim, num_heads, dropout)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, int(embed_dim * mlp_ratio)),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(int(embed_dim * mlp_ratio), embed_dim),
            nn.Dropout(dropout),
        )
    
    def forward(self, x):
        # Pre-norm architecture (standard in modern ViTs)
        attn_out, attn_weights = self.attn(self.norm1(x))
        x = x + attn_out           # Residual connection
        x = x + self.mlp(self.norm2(x))  # Residual connection
        return x, attn_weights
```

### Why Pre-Norm?

```
Standard (Post-Norm):  x → Attention → Add & Norm → MLP → Add & Norm
Modern (Pre-Norm):     x → Norm → Attention → Add → Norm → MLP → Add

Pre-Norm converges faster and is more stable for deep networks (12+ layers).
```

## Computational Complexity

Self-attention has O(N²) complexity where N = number of patches:

| Image Size | Patch Size | Patches (N) | Attention Matrix | Memory |
|-----------|------------|-------------|------------------|--------|
| 224×224 | 16×16 | 196 | 196×196 | ~0.3 MB |
| 512×512 | 16×16 | 1,024 | 1024×1024 | ~8 MB |
| 1024×1024 | 16×16 | 4,096 | 4096×4096 | ~128 MB |
| 2048×2048 | 16×16 | 16,384 | 16384×16384 | ~2 GB |

For high-resolution drone imagery (4K+), standard ViT is impractical. Solutions:
- **Swin Transformer**: Window-based attention (O(N) complexity)
- **Linear attention**: Approximate attention in O(N) time
- **Patch merging**: Reduce N at deeper layers

## Hands-On Lab

### Exercise 1: Build from Scratch
Implement a complete `VisionTransformer` class combining:
- `PatchEmbedding` (from Lesson 2)
- 6× `TransformerBlock`
- Classification head

Test on CIFAR-10 aerail view dataset.

### Exercise 2: Attention Head Analysis
Using a drone image dataset:
1. Train a ViT-Small for 10 epochs on a binary fire/no-fire task
2. Extract attention weights from all 6 heads in the last layer
3. Identify which heads specialize in: edges, colors, textures, spatial relationships
4. Document your findings with visualizations

### Exercise 3: Efficiency Comparison
Benchmark memory usage and inference time for:
- ViT-Base at 224×224, 384×384, and 512×512
- Plot the quadratic scaling curve
- Implement windowed attention and compare

## Key Takeaways

1. Multi-head attention computes parallel attention patterns, each capturing different relationships
2. The QKV projection can be combined into a single linear layer for efficiency
3. Pre-norm architecture is standard for modern ViTs
4. Self-attention has O(N²) complexity — problematic for high-res drone imagery
5. Attention maps are interpretable — you can see what the model focuses on

## Next Lesson → Building a ViT for Drone Imagery
