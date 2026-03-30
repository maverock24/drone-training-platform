# Lesson 4: Building a Complete ViT for Drone Imagery

## Learning Objectives
- Assemble a complete Vision Transformer end-to-end
- Train ViT on aerial/drone datasets with proper augmentation
- Evaluate and compare with CNN baselines on drone-specific tasks

## The Complete Vision Transformer

```python
import torch
import torch.nn as nn
import math

class VisionTransformer(nn.Module):
    """Complete ViT implementation for drone image classification."""
    
    def __init__(
        self,
        img_size=224,
        patch_size=16,
        in_channels=3,
        num_classes=10,
        embed_dim=768,
        depth=12,
        num_heads=12,
        mlp_ratio=4.0,
        dropout=0.1,
    ):
        super().__init__()
        self.num_patches = (img_size // patch_size) ** 2
        
        # Patch Embedding
        self.patch_embed = nn.Conv2d(
            in_channels, embed_dim, kernel_size=patch_size, stride=patch_size
        )
        
        # Learnable tokens and position embeddings
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim) * 0.02)
        self.pos_embed = nn.Parameter(
            torch.randn(1, self.num_patches + 1, embed_dim) * 0.02
        )
        self.pos_drop = nn.Dropout(dropout)
        
        # Transformer Encoder
        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads, mlp_ratio, dropout)
            for _ in range(depth)
        ])
        
        # Classification Head
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Sequential(
            nn.Linear(embed_dim, embed_dim),
            nn.Tanh(),
            nn.Linear(embed_dim, num_classes),
        )
        
        self._init_weights()
    
    def _init_weights(self):
        # Proper initialization is critical for ViT convergence
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.trunc_normal_(m.weight, std=0.02)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
            elif isinstance(m, nn.LayerNorm):
                nn.init.ones_(m.weight)
                nn.init.zeros_(m.bias)
    
    def forward(self, x):
        B = x.shape[0]
        
        # Patch embedding: (B, 3, 224, 224) → (B, 196, 768)
        x = self.patch_embed(x).flatten(2).transpose(1, 2)
        
        # Prepend CLS token
        cls = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls, x], dim=1)  # (B, 197, 768)
        
        # Add positional embedding
        x = self.pos_drop(x + self.pos_embed)
        
        # Pass through transformer blocks
        for block in self.blocks:
            x, _ = block(x)
        
        # Classification from CLS token
        x = self.norm(x[:, 0])  # Take CLS token output
        x = self.head(x)
        
        return x

# Model configurations matching standard ViT variants
def vit_small(num_classes=10):
    return VisionTransformer(
        embed_dim=384, depth=12, num_heads=6, num_classes=num_classes
    )

def vit_base(num_classes=10):
    return VisionTransformer(
        embed_dim=768, depth=12, num_heads=12, num_classes=num_classes
    )

def vit_tiny(num_classes=10):
    """Lightweight variant for edge deployment testing."""
    return VisionTransformer(
        embed_dim=192, depth=12, num_heads=3, num_classes=num_classes
    )
```

## Training on Drone Datasets

### Data Augmentation for Aerial Imagery

Standard augmentations don't work well for drone images. Aerial images have unique properties:
- Rotation invariance (drone can face any direction)
- Scale variation (altitude changes)
- Unusual lighting (sun angle, shadows)

```python
from torchvision import transforms
import albumentations as A
from albumentations.pytorch import ToTensorV2

class DroneAugmentation:
    """Augmentation pipeline designed for aerial/drone imagery."""
    
    def __init__(self, img_size=224, is_training=True):
        if is_training:
            self.transform = A.Compose([
                # Spatial augmentations (critical for aerial images)
                A.RandomResizedCrop(img_size, img_size, scale=(0.5, 1.0)),
                A.Rotate(limit=180, p=0.5),  # Full rotation — drones have no "up"
                A.HorizontalFlip(p=0.5),
                A.VerticalFlip(p=0.5),  # Valid for top-down views
                
                # Color augmentations (lighting variation)
                A.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1),
                A.RandomShadow(p=0.3),  # Simulate cloud/building shadows
                
                # Drone-specific
                A.GaussNoise(var_limit=(10, 50), p=0.3),  # Sensor noise
                A.MotionBlur(blur_limit=5, p=0.2),  # Movement blur
                
                # Normalize and convert
                A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
                ToTensorV2(),
            ])
        else:
            self.transform = A.Compose([
                A.Resize(img_size, img_size),
                A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
                ToTensorV2(),
            ])
    
    def __call__(self, image):
        return self.transform(image=image)['image']
```

### Training Loop with Best Practices

```python
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts

def train_vit_drone(model, train_loader, val_loader, epochs=100, device='cuda'):
    """Training loop with ViT-specific optimizations."""
    
    # AdamW with weight decay — essential for ViT
    optimizer = optim.AdamW(
        model.parameters(),
        lr=1e-3,
        weight_decay=0.05,
        betas=(0.9, 0.999)
    )
    
    # Cosine schedule with warmup
    warmup_epochs = 10
    scheduler = CosineAnnealingWarmRestarts(optimizer, T_0=epochs - warmup_epochs)
    
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    
    best_acc = 0.0
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        
        # Linear warmup
        if epoch < warmup_epochs:
            lr = 1e-3 * (epoch + 1) / warmup_epochs
            for pg in optimizer.param_groups:
                pg['lr'] = lr
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)
            
            # Mixup augmentation (improves ViT generalization)
            if epoch > warmup_epochs:
                images, labels_a, labels_b, lam = mixup_data(images, labels)
                outputs = model(images)
                loss = lam * criterion(outputs, labels_a) + \
                       (1 - lam) * criterion(outputs, labels_b)
            else:
                outputs = model(images)
                loss = criterion(outputs, labels)
            
            optimizer.zero_grad()
            loss.backward()
            
            # Gradient clipping — prevents ViT training instability
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()
            total_loss += loss.item()
        
        if epoch >= warmup_epochs:
            scheduler.step()
        
        # Validation
        val_acc = evaluate(model, val_loader, device)
        print(f"Epoch {epoch}: Loss={total_loss/len(train_loader):.4f} Acc={val_acc:.2%}")
        
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), 'best_drone_vit.pth')
    
    return best_acc

def mixup_data(x, y, alpha=0.2):
    lam = torch.distributions.Beta(alpha, alpha).sample()
    idx = torch.randperm(x.size(0))
    mixed_x = lam * x + (1 - lam) * x[idx]
    return mixed_x, y, y[idx], lam

def evaluate(model, loader, device):
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            preds = model(images).argmax(dim=-1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
    return correct / total
```

## Available Drone Datasets

| Dataset | Task | Size | Classes |
|---------|------|------|---------|
| DOTA | Object Detection | 2,806 images | 18 categories |
| VisDrone | Detection & Tracking | 10,209 images | 10 categories |
| FLAME | Fire Segmentation | 2,003 images | 2 (fire/no-fire) |
| UAVid | Semantic Segmentation | 420 4K frames | 8 classes |
| DroneVehicle | Vehicle Detection | 56,878 images | 5 vehicle types |

## Comparison: ViT vs CNN on Drone Tasks

Typical results on VisDrone object detection:

| Model | mAP@50 | FPS (V100) | Params |
|-------|--------|-----------|--------|
| YOLOv8-L | 38.2% | 45 | 43M |
| EfficientDet-D4 | 36.8% | 25 | 21M |
| ViT-Base + Deformable DETR | 41.5% | 18 | 41M |
| Swin-T + Cascade R-CNN | 43.1% | 15 | 86M |

ViT-based models win on accuracy but require optimization for real-time use (covered in Courses 4-6).

## Hands-On Lab

### Project: Fire Detection ViT
Build an end-to-end fire detection system:

1. Download the FLAME dataset (or use synthetic data)
2. Implement the `DroneAugmentation` pipeline
3. Train `vit_small` from scratch for 50 epochs
4. Compare with a ResNet-50 baseline
5. Generate attention maps showing what the model focuses on in fire images
6. Export the trained model to ONNX format

**Evaluation criteria:**
- Accuracy > 90% on test set
- Attention maps highlight fire/smoke regions
- Training script is clean and reproducible

## Key Takeaways

1. Proper weight initialization (truncated normal) is critical for ViT convergence
2. AdamW with weight decay 0.05 + cosine schedule with warmup is the standard recipe
3. Drone-specific augmentations (full rotation, shadow simulation) significantly help
4. Mixup and label smoothing improve ViT generalization when data is limited
5. ViTs outperform CNNs on accuracy but need optimization for real-time edge deployment

## Course Complete → Next Course: Parameter-Efficient Fine-Tuning (PEFT)
