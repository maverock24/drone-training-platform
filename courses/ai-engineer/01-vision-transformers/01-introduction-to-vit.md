# Lesson 1: Introduction to Vision Transformers

## Learning Objectives
- Understand why transformers outperform CNNs for aerial and satellite imagery
- Explain the core ViT architecture and its components
- Compare ViT variants relevant to drone computer vision

## Why Vision Transformers for Drones?

Traditional Convolutional Neural Networks (CNNs) like ResNet and EfficientNet have been the backbone of drone image analysis. However, they have fundamental limitations:

1. **Limited receptive field**: CNNs build up context through stacking layers; early layers only see small patches
2. **Translation equivariance**: While useful, CNNs struggle with scale and rotation variations common in aerial imagery
3. **Poor long-range dependencies**: A power line spanning the entire image requires the network to connect distant features

Vision Transformers solve these problems by treating an image as a sequence of patches and applying self-attention — allowing every patch to "look at" every other patch simultaneously.

## The ViT Architecture

The Vision Transformer, introduced by Dosovitskiy et al. (2020), follows these steps:

```
Input Image (224×224×3)
    ↓
Split into Patches (14×14 grid of 16×16 patches = 196 patches)
    ↓
Linear Projection (Patch Embedding) → 196 × 768 vectors
    ↓
Add Positional Embeddings + [CLS] Token
    ↓
Transformer Encoder (12 layers of Multi-Head Self-Attention + MLP)
    ↓
[CLS] Token Output → Classification Head
    ↓
Prediction
```

### Key Insight: Images as Sequences

The revolutionary idea is simple: flatten 2D image patches into a 1D sequence and process them exactly like words in a sentence. Each 16×16 pixel patch becomes a "visual word."

```python
import torch
import torch.nn as nn

class PatchEmbedding(nn.Module):
    """Convert an image into a sequence of patch embeddings."""
    
    def __init__(self, img_size=224, patch_size=16, in_channels=3, embed_dim=768):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.n_patches = (img_size // patch_size) ** 2  # 196 for 224/16
        
        # A single Conv2d layer performs both patch extraction AND linear projection
        self.projection = nn.Conv2d(
            in_channels, 
            embed_dim, 
            kernel_size=patch_size, 
            stride=patch_size
        )
    
    def forward(self, x):
        # x shape: (batch, 3, 224, 224)
        x = self.projection(x)     # (batch, 768, 14, 14)
        x = x.flatten(2)           # (batch, 768, 196)
        x = x.transpose(1, 2)     # (batch, 196, 768)
        return x

# Test it
patch_embed = PatchEmbedding()
dummy_img = torch.randn(1, 3, 224, 224)
patches = patch_embed(dummy_img)
print(f"Patches shape: {patches.shape}")  # torch.Size([1, 196, 768])
```

## ViT Variants for Drone Applications

| Model | Params | Resolution | Best For |
|-------|--------|-----------|----------|
| ViT-Small | 22M | 224×224 | Edge deployment on Jetson |
| ViT-Base | 86M | 224×224 | General drone classification |
| ViT-Large | 307M | 224×224 | High-accuracy cloud inference |
| DeiT III | 22-86M | 224×224 | Data-efficient training |
| Swin Transformer | 28-197M | Variable | Multi-scale object detection |

### For Drone-Specific Tasks:

- **Object Detection** (vehicles, people, buildings): Swin Transformer with FPN
- **Semantic Segmentation** (land use mapping): SegFormer or Swin + UperNet
- **Classification** (fire/no-fire, damage assessment): ViT-Base fine-tuned
- **Real-time Edge**: DeiT-Small with optimizations (covered in Course 4)

## The Attention Mechanism Advantage

In aerial imagery, context is everything. Consider detecting a small fire:

- A CNN with a 7×7 receptive field only sees local features
- A ViT patch at the smoke location can attend to: the surrounding terrain, nearby structures, wind direction indicators, and the thermal signature — all in a single layer

```
Self-Attention Score = softmax(Q · K^T / √d_k) · V

Where:
  Q = Query (what am I looking for?)
  K = Key (what do I contain?)
  V = Value (what information do I provide?)
  d_k = dimension of keys (scaling factor)
```

## Hands-On Lab

### Exercise 1: Patch Visualization
Write a script that:
1. Loads a drone aerial image (use any top-down image)
2. Splits it into 16×16 patches
3. Visualizes the patches in a grid, numbering each one
4. Reconstructs the image from patches to verify correctness

### Exercise 2: Attention Map Visualization
Using a pretrained ViT from `timm`:
```python
import timm

model = timm.create_model('vit_base_patch16_224', pretrained=True)
```
1. Run a forward pass on a drone image
2. Extract the attention weights from the last transformer layer
3. Visualize which patches the [CLS] token attends to most
4. Compare attention patterns between ground-level and aerial images

## Key Takeaways

1. ViTs treat images as sequences of patches, enabling global context from layer 1
2. The Conv2d projection trick efficiently converts patches to embeddings
3. Self-attention allows every patch to communicate with every other patch
4. For drone applications, the ability to capture long-range dependencies is critical
5. Different ViT variants suit different deployment scenarios (edge vs. cloud)

## Next Lesson → Patch Embedding Deep Dive
