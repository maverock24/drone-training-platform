# Lesson 1: CLIP Architecture & Contrastive Learning

## Learning Objectives
- Understand contrastive learning for aligning image and text representations
- Implement a CLIP-style encoder from scratch
- Apply multi-modal fusion to drone imagery queries

## What is Multi-Modal Fusion?

Multi-modal fusion combines information from different data types (modalities) into a unified representation. For drone AI, the key modalities are:

- **Visual**: RGB images, thermal images, multispectral
- **Text**: Mission descriptions, location labels, reports
- **Spatial**: GPS coordinates, altitude, heading
- **Temporal**: Timestamps, flight duration, time series

CLIP (Contrastive Language-Image Pretraining) pioneered aligning images and text in a shared embedding space, enabling natural language queries over visual data.

## CLIP Architecture

```
Image Encoder (ViT)          Text Encoder (Transformer)
     ↓                              ↓
"aerial photo of             "a power line with
 power line damage"           damaged insulators"
     ↓                              ↓
Image Embedding (512-d)      Text Embedding (512-d)
     ↓                              ↓
     └──── Cosine Similarity ────┘
              = 0.92 (match!)
```

### Contrastive Learning Objective

Given a batch of N (image, text) pairs:
- The diagonal entries (correct pairs) should have HIGH similarity
- Off-diagonal entries (incorrect pairs) should have LOW similarity

$$\mathcal{L} = -\frac{1}{2N}\sum_{i=1}^{N}\left[\log\frac{\exp(sim(I_i, T_i)/\tau)}{\sum_{j=1}^{N}\exp(sim(I_i, T_j)/\tau)} + \log\frac{\exp(sim(T_i, I_i)/\tau)}{\sum_{j=1}^{N}\exp(sim(T_j, I_j)/\tau)}\right]$$

Where τ is a learnable temperature parameter.

### Implementation from Scratch

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import timm

class DroneCLIP(nn.Module):
    """CLIP-style model for aligning drone images with text descriptions."""
    
    def __init__(self, embed_dim=512, vision_model='vit_base_patch16_224'):
        super().__init__()
        
        # Image Encoder: ViT
        self.vision_encoder = timm.create_model(vision_model, pretrained=True)
        vision_dim = self.vision_encoder.head.in_features
        self.vision_encoder.head = nn.Identity()  # Remove classification head
        self.vision_proj = nn.Linear(vision_dim, embed_dim)
        
        # Text Encoder: Transformer
        self.text_encoder = TextEncoder(
            vocab_size=50000,
            embed_dim=512,
            num_heads=8,
            num_layers=6,
            max_length=128,
        )
        self.text_proj = nn.Linear(512, embed_dim)
        
        # Learnable temperature
        self.logit_scale = nn.Parameter(torch.ones([]) * 2.6592)  # ln(1/0.07)
    
    def encode_image(self, images):
        features = self.vision_encoder(images)
        features = self.vision_proj(features)
        return F.normalize(features, dim=-1)
    
    def encode_text(self, tokens):
        features = self.text_encoder(tokens)
        features = self.text_proj(features)
        return F.normalize(features, dim=-1)
    
    def forward(self, images, tokens):
        image_features = self.encode_image(images)
        text_features = self.encode_text(tokens)
        
        # Compute similarity matrix
        logit_scale = self.logit_scale.exp()
        logits = logit_scale * image_features @ text_features.T
        
        return logits


class CLIPLoss(nn.Module):
    """Symmetric contrastive loss."""
    
    def forward(self, logits):
        # logits: (batch, batch)
        batch_size = logits.shape[0]
        labels = torch.arange(batch_size, device=logits.device)
        
        # Image → Text loss
        loss_i2t = F.cross_entropy(logits, labels)
        # Text → Image loss
        loss_t2i = F.cross_entropy(logits.T, labels)
        
        return (loss_i2t + loss_t2i) / 2


class TextEncoder(nn.Module):
    """Simple transformer text encoder."""
    
    def __init__(self, vocab_size, embed_dim, num_heads, num_layers, max_length):
        super().__init__()
        self.token_embed = nn.Embedding(vocab_size, embed_dim)
        self.pos_embed = nn.Parameter(torch.randn(1, max_length, embed_dim) * 0.01)
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim, nhead=num_heads, dim_feedforward=embed_dim * 4,
            batch_first=True, activation='gelu'
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.ln_final = nn.LayerNorm(embed_dim)
    
    def forward(self, tokens):
        x = self.token_embed(tokens) + self.pos_embed[:, :tokens.shape[1]]
        x = self.encoder(x)
        # Use [EOS] token position (last non-padding token)
        x = self.ln_final(x[:, -1])  # Simplified: take last token
        return x
```

## Drone-Specific Applications

### Natural Language Image Retrieval

```python
def search_drone_images(query, image_database, model, tokenizer, top_k=5):
    """Search drone images using natural language.
    
    Example queries:
    - "damaged roof with missing shingles"
    - "vehicle on fire near highway"
    - "flooding in residential area"
    - "solar panel with hotspot defect"
    """
    # Encode query
    tokens = tokenizer(query, return_tensors="pt", padding=True).to("cuda")
    text_feat = model.encode_text(tokens["input_ids"])
    
    # Compare against all images
    similarities = []
    for img_path, img_feat in image_database.items():
        sim = F.cosine_similarity(text_feat, img_feat.unsqueeze(0))
        similarities.append((img_path, sim.item()))
    
    # Return top-k matches
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_k]

# Usage
results = search_drone_images(
    query="power line with vegetation encroachment",
    image_database=precomputed_features,
    model=drone_clip,
    tokenizer=tokenizer,
)
```

### Zero-Shot Classification

```python
def zero_shot_classify(image, class_descriptions, model, processor):
    """Classify drone images without training on specific classes.
    
    class_descriptions: List of text descriptions for each class
    Example: ["intact solar panel", "cracked solar panel", "dirty solar panel"]
    """
    # Encode all class descriptions
    text_tokens = processor(class_descriptions, return_tensors="pt", padding=True)
    text_features = model.encode_text(text_tokens["input_ids"].to("cuda"))
    
    # Encode image
    image_tensor = processor(images=image, return_tensors="pt")["pixel_values"]
    image_features = model.encode_image(image_tensor.to("cuda"))
    
    # Compute probabilities
    similarity = (image_features @ text_features.T).softmax(dim=-1)
    
    return {desc: prob.item() for desc, prob in zip(class_descriptions, similarity[0])}
```

## Building a Drone Image-Text Dataset

```python
# Dataset structure for training DroneCLIP
drone_pairs = [
    {
        "image": "thermal/img_0001.jpg",
        "text": "thermal image showing heat leak from building rooftop, temperature delta 8 degrees celsius"
    },
    {
        "image": "rgb/img_0234.jpg",
        "text": "aerial view of highway intersection with heavy traffic congestion, 4 lanes visible"
    },
    {
        "image": "rgb/img_0891.jpg",
        "text": "agricultural field with center pivot irrigation, showing crop stress in northeast quadrant"
    },
    {
        "image": "lidar_render/scan_045.jpg",
        "text": "3D point cloud rendering of damaged bridge, visible crack in central support column"
    },
]
```

## Hands-On Lab

### Exercise 1: Build DroneCLIP
1. Implement the `DroneCLIP` model using the code above
2. Create a synthetic dataset of 500 image-text pairs using drone imagery
3. Train for 20 epochs and evaluate retrieval accuracy

### Exercise 2: Zero-Shot Classification
1. Using a pretrained CLIP model from OpenAI
2. Design text prompts for 10 drone inspection categories
3. Evaluate zero-shot accuracy on a test set
4. Compare with a supervised classifier trained on the same categories

### Exercise 3: Multi-Modal Search Interface
Build a simple web interface where users can:
1. Upload a drone image → get text description
2. Type a text query → retrieve matching drone images
3. Combine: "images like this one but with fire"

## Key Takeaways

1. CLIP aligns images and text in a shared embedding space via contrastive learning
2. The temperature parameter controls the sharpness of the similarity distribution
3. Zero-shot classification eliminates the need for labeled training data
4. Natural language search over drone images enables intuitive retrieval
5. The approach generalizes to thermal, multispectral, and LiDAR-rendered imagery

## Next Lesson → Image-Text Alignment for Drone Queries
