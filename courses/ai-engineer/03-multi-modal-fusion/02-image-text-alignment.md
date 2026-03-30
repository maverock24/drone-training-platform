# Lesson 2: Image-Text Alignment for Drone Queries

## Learning Objectives
- Fine-tune CLIP for domain-specific drone terminology
- Build hard negative mining for better alignment
- Implement cross-attention fusion for richer multi-modal understanding

## Domain Adaptation: Why Off-the-Shelf CLIP Falls Short

CLIP was trained on internet image-text pairs. It understands "a photo of a dog" but struggles with:
- "Thermal anomaly indicating subsurface pipe leak at 42cm depth"
- "NDVI value 0.3 indicating moderate crop stress in wheat field"
- "Point cloud showing 2.3° deflection in monopole tower structure"

We need to adapt CLIP to drone-specific vocabulary while retaining general knowledge.

### Fine-Tuning Strategy

```python
from open_clip import create_model_and_transforms, get_tokenizer

# Load pretrained CLIP
model, preprocess_train, preprocess_val = create_model_and_transforms(
    'ViT-B-16', pretrained='laion2b_s34b_b88k'
)
tokenizer = get_tokenizer('ViT-B-16')

# Fine-tune with domain data — use lower learning rate to preserve general knowledge
optimizer = torch.optim.AdamW([
    {"params": model.visual.parameters(), "lr": 1e-6},   # Vision: very slow
    {"params": model.transformer.parameters(), "lr": 1e-5},  # Text: slow
    {"params": [model.logit_scale], "lr": 1e-4},          # Temperature: faster
], weight_decay=0.1)
```

## Hard Negative Mining

The key to good contrastive learning is **hard negatives** — examples that look similar but have different meanings:

```python
class HardNegativeMiner:
    """Mine hard negatives for more effective contrastive training."""
    
    def __init__(self, model, all_texts, all_images):
        self.model = model
        self.text_bank = all_texts
        self.image_bank = all_images
        self._precompute_features()
    
    def _precompute_features(self):
        with torch.no_grad():
            self.text_features = self.model.encode_text(self.text_bank)
            self.image_features = self.model.encode_image(self.image_bank)
    
    def get_hard_negatives(self, image_feat, true_text_idx, k=5):
        """Find texts that are similar but NOT the correct match."""
        sims = image_feat @ self.text_features.T
        sims[true_text_idx] = -float('inf')  # Exclude true match
        _, hard_neg_indices = sims.topk(k)
        return hard_neg_indices

# Drone-specific hard negatives examples:
hard_negative_pairs = [
    # Easy to confuse: "intact" vs "damaged"
    ("intact power line insulator", "damaged power line insulator"),
    # Easy to confuse: "active fire" vs "controlled burn"
    ("active wildfire spreading north", "controlled agricultural burn"),
    # Easy to confuse: similar but different crop issues
    ("nitrogen deficiency in corn field", "potassium deficiency in corn field"),
]
```

## Cross-Attention Fusion

For richer understanding, go beyond simple dot-product similarity with cross-attention:

```python
class CrossAttentionFusion(nn.Module):
    """Fuse image and text features using cross-attention.
    
    Unlike CLIP's dot product, this allows fine-grained interaction
    between image patches and text tokens.
    """
    
    def __init__(self, embed_dim=512, num_heads=8, num_layers=4):
        super().__init__()
        self.cross_attn_layers = nn.ModuleList([
            CrossAttentionLayer(embed_dim, num_heads)
            for _ in range(num_layers)
        ])
        self.output_proj = nn.Linear(embed_dim, embed_dim)
    
    def forward(self, image_tokens, text_tokens):
        """
        image_tokens: (B, num_patches, dim) — from ViT encoder
        text_tokens: (B, text_len, dim) — from text encoder
        """
        x = image_tokens
        for layer in self.cross_attn_layers:
            x = layer(x, text_tokens)  # Image attends to text
        
        # Pool to single vector
        fused = x.mean(dim=1)
        return self.output_proj(fused)


class CrossAttentionLayer(nn.Module):
    def __init__(self, embed_dim, num_heads):
        super().__init__()
        self.cross_attn = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, embed_dim * 4),
            nn.GELU(),
            nn.Linear(embed_dim * 4, embed_dim),
        )
    
    def forward(self, image_tokens, text_tokens):
        # Cross attention: image queries, text keys/values
        attn_out, _ = self.cross_attn(
            query=self.norm1(image_tokens),
            key=text_tokens,
            value=text_tokens,
        )
        x = image_tokens + attn_out
        x = x + self.mlp(self.norm2(x))
        return x
```

### Application: Grounded Drone Query Answering

```python
class GroundedDroneQuery(nn.Module):
    """Answer natural language questions about drone images
    with spatial grounding (pointing to relevant image regions)."""
    
    def __init__(self):
        super().__init__()
        self.image_encoder = timm.create_model('vit_base_patch16_224', pretrained=True)
        self.text_encoder = TextEncoder(vocab_size=50000, embed_dim=768,
                                        num_heads=12, num_layers=6, max_length=64)
        self.fusion = CrossAttentionFusion(embed_dim=768, num_heads=12, num_layers=4)
        self.answer_head = nn.Linear(768, 1000)  # Answer vocabulary
        self.grounding_head = nn.Linear(768, 196)  # Attention over 14x14 patches
    
    def forward(self, image, question_tokens):
        # Encode image patches (keep spatial tokens, not just CLS)
        image_tokens = self.image_encoder.forward_features(image)  # (B, 197, 768)
        image_patches = image_tokens[:, 1:]  # Remove CLS: (B, 196, 768)
        
        # Encode question
        text_tokens = self.text_encoder(question_tokens)  # (B, text_len, 768)
        
        # Fuse modalities
        fused = self.fusion(image_patches, text_tokens)  # (B, 768)
        
        # Generate answer + spatial grounding
        answer_logits = self.answer_head(fused)
        grounding_map = self.grounding_head(fused).reshape(-1, 14, 14)
        
        return answer_logits, grounding_map

# Example usage:
# Q: "Where is the damaged section of the roof?"
# A: "Northeast corner" + heatmap highlighting NE patches
```

## Hands-On Lab

### Exercise 1: Domain-Adapted CLIP
1. Collect 1000 drone image-caption pairs (or use generated captions)
2. Fine-tune OpenCLIP on your drone data for 10 epochs
3. Compare retrieval performance: base CLIP vs fine-tuned on drone queries

### Exercise 2: Grounded Visual Question Answering
1. Implement the `GroundedDroneQuery` model
2. Create a dataset of (image, question, answer, bounding_box) tuples
3. Train and visualize the grounding maps overlaid on drone images

## Key Takeaways

1. Domain adaptation of CLIP dramatically improves drone-specific retrieval
2. Hard negative mining is essential for fine-grained distinctions
3. Cross-attention fusion enables richer interaction than dot-product similarity
4. Spatial grounding adds interpretability — showing where the model is looking
5. Lower learning rates for pretrained components prevent catastrophic forgetting
