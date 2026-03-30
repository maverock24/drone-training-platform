# Lesson 2: Patch Embedding Deep Dive

## Learning Objectives
- Implement patch embedding from scratch with positional encoding
- Understand learnable vs. fixed positional embeddings
- Build a complete ViT input pipeline for drone imagery

## Patch Embedding: The Foundation

Patch embedding is the critical first step that converts raw pixel data into the token format transformers expect. Getting this right determines how well the model "sees" the image.

### The Complete Embedding Pipeline

```
Raw Image → Patch Extraction → Linear Projection → Position Embedding → Layer Norm
```

### Step 1: Patch Extraction Methods

There are three common approaches:

**Method A: Conv2d Projection (Recommended)**
```python
# Single operation: extract AND project
self.proj = nn.Conv2d(3, embed_dim, kernel_size=patch_size, stride=patch_size)
```

**Method B: Manual Unfold + Linear**
```python
# Explicit two-step process
def manual_patch_embed(img, patch_size=16, embed_dim=768):
    B, C, H, W = img.shape
    # Unfold into patches
    patches = img.unfold(2, patch_size, patch_size).unfold(3, patch_size, patch_size)
    patches = patches.contiguous().view(B, -1, C * patch_size * patch_size)
    # Linear projection
    linear = nn.Linear(C * patch_size * patch_size, embed_dim)
    return linear(patches)
```

**Method C: Overlapping Patches (for better boundary handling)**
```python
# Overlapping patches capture cross-boundary features
self.proj = nn.Conv2d(3, embed_dim, kernel_size=patch_size, 
                       stride=patch_size - 4, padding=2)
```

### Step 2: Positional Embeddings

Without position information, the transformer treats patches as an unordered set. Positional embeddings tell the model where each patch came from.

#### Learnable 1D Positional Embeddings (Standard ViT)

```python
class ViTEmbedding(nn.Module):
    def __init__(self, img_size=224, patch_size=16, embed_dim=768):
        super().__init__()
        n_patches = (img_size // patch_size) ** 2
        
        self.patch_embed = nn.Conv2d(3, embed_dim, patch_size, patch_size)
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.randn(1, n_patches + 1, embed_dim))
        self.norm = nn.LayerNorm(embed_dim)
        
    def forward(self, x):
        B = x.shape[0]
        
        # Patch embedding
        x = self.patch_embed(x)             # (B, 768, 14, 14)
        x = x.flatten(2).transpose(1, 2)   # (B, 196, 768)
        
        # Prepend [CLS] token
        cls_tokens = self.cls_token.expand(B, -1, -1)  # (B, 1, 768)
        x = torch.cat([cls_tokens, x], dim=1)          # (B, 197, 768)
        
        # Add positional embedding
        x = x + self.pos_embed              # (B, 197, 768)
        x = self.norm(x)
        
        return x
```

#### 2D Sinusoidal Positional Embeddings (Better for variable resolution)

For drone imagery where resolution may vary between flights:

```python
import numpy as np

def get_2d_sincos_pos_embed(embed_dim, grid_size):
    """Generate 2D sinusoidal positional embeddings.
    
    Advantage: Can interpolate to different resolutions at inference time,
    crucial for drones that may capture images at varying altitudes.
    """
    grid_h = np.arange(grid_size, dtype=np.float32)
    grid_w = np.arange(grid_size, dtype=np.float32)
    grid = np.meshgrid(grid_w, grid_h)
    grid = np.stack(grid, axis=0)  # (2, grid_size, grid_size)
    grid = grid.reshape([2, 1, grid_size, grid_size])
    
    pos_embed = get_2d_sincos_pos_embed_from_grid(embed_dim, grid)
    return pos_embed

def get_2d_sincos_pos_embed_from_grid(embed_dim, grid):
    assert embed_dim % 2 == 0
    emb_h = get_1d_sincos_pos_embed(embed_dim // 2, grid[0])
    emb_w = get_1d_sincos_pos_embed(embed_dim // 2, grid[1])
    return np.concatenate([emb_h, emb_w], axis=1)

def get_1d_sincos_pos_embed(embed_dim, pos):
    omega = np.arange(embed_dim // 2, dtype=np.float32)
    omega /= embed_dim / 2.
    omega = 1. / 10000**omega
    
    pos = pos.reshape(-1)
    out = np.einsum('m,d->md', pos, omega)
    
    emb_sin = np.sin(out)
    emb_cos = np.cos(out)
    return np.concatenate([emb_sin, emb_cos], axis=1)
```

## The [CLS] Token

The `[CLS]` (classification) token is a learnable embedding prepended to the patch sequence. Its purpose:

1. **Acts as a global summary** — attends to all patches across all layers
2. **Classification output** — the final [CLS] representation feeds into the classifier
3. **Task-agnostic** — same mechanism works for classification, retrieval, etc.

```
[CLS] [Patch_1] [Patch_2] ... [Patch_196]
  ↓       ↓          ↓              ↓
Layer 1: Self-attention across all tokens
  ↓       ↓          ↓              ↓
Layer 12: Self-attention across all tokens
  ↓
[CLS] output → MLP Head → "Fire detected"
```

## Resolution Flexibility with Positional Embedding Interpolation

Drones capture images at different altitudes, resulting in different effective resolutions. ViTs handle this gracefully:

```python
def interpolate_pos_embed(model, new_img_size, patch_size=16):
    """Interpolate positional embeddings for a new image resolution.
    
    Example: Model trained at 224x224 → inference at 512x512
    """
    pos_embed = model.pos_embed  # (1, 197, 768)
    
    # Separate CLS token
    cls_embed = pos_embed[:, :1, :]
    patch_embed = pos_embed[:, 1:, :]
    
    # Original grid
    old_grid = int(patch_embed.shape[1] ** 0.5)  # 14
    new_grid = new_img_size // patch_size          # 32
    
    # Reshape and interpolate
    patch_embed = patch_embed.reshape(1, old_grid, old_grid, -1).permute(0, 3, 1, 2)
    patch_embed = torch.nn.functional.interpolate(
        patch_embed, size=(new_grid, new_grid), mode='bicubic', align_corners=False
    )
    patch_embed = patch_embed.permute(0, 2, 3, 1).reshape(1, new_grid * new_grid, -1)
    
    return torch.cat([cls_embed, patch_embed], dim=1)
```

## Hands-On Lab

### Exercise 1: Complete Embedding Module
Build a `DroneViTEmbedding` class that:
1. Accepts images of variable resolution (not just 224×224)
2. Uses 2D sinusoidal positional embeddings
3. Supports both 16×16 and 32×32 patch sizes
4. Includes a configurable number of register tokens (in addition to [CLS])

### Exercise 2: Embedding Visualization
1. Extract patch embeddings from a drone image
2. Use t-SNE to visualize the 768-dim embeddings in 2D
3. Color patches by their spatial position — verify that nearby patches cluster together
4. Compare embeddings before and after adding positional information

### Exercise 3: Resolution Transfer
1. Train a classifier at 224×224 on a drone dataset
2. At inference, interpolate positional embeddings to 448×448
3. Measure accuracy difference — it should be minimal with sinusoidal embeddings

## Key Takeaways

1. Conv2d projection is the most efficient patch embedding method
2. Positional embeddings are essential — without them, the model loses spatial awareness
3. 2D sinusoidal embeddings enable resolution flexibility at inference time
4. The [CLS] token serves as the global image representation
5. Overlapping patches can improve boundary-region detection

## Next Lesson → Multi-Head Self-Attention for Images
