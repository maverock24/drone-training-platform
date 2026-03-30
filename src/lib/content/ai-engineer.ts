import { LessonContent } from "./types";

export const aiEngineerContent: LessonContent[] = [
  // ─── LESSON 1: Vision Transformers (ViT) ───
  {
    lessonId: "vit",
    trackId: "ai-engineer",
    moduleId: "arch-mastery",
    objectives: [
      "Understand the ViT architecture and how it differs from CNNs for image recognition",
      "Implement Patch Embedding and Multi-Head Self-Attention from scratch in PyTorch",
      "Fine-tune a pre-trained ViT on drone aerial imagery classification tasks",
      "Evaluate ViT performance vs CNN baselines on small-object detection in aerial scenes",
      "Apply positional encoding strategies suited for high-resolution drone imagery",
    ],
    prerequisites: [
      "Solid understanding of deep learning fundamentals (loss functions, backpropagation, SGD)",
      "Experience with PyTorch (tensor operations, nn.Module, DataLoader)",
      "Familiarity with convolutional neural networks (ResNet, EfficientNet)",
    ],
    sections: [
      {
        id: "vit-intro",
        title: "Why Vision Transformers for Drone AI?",
        type: "theory",
        content:
          "Convolutional Neural Networks have dominated computer vision for over a decade, but they carry an inherent limitation: locality bias. A convolution kernel only sees a small patch of the image at a time, building up global understanding through layers of stacking. For drone imagery — where context spans thousands of pixels and objects of interest (vehicles, people, fire plumes) can appear at any scale — this locality bias becomes a bottleneck.\n\nVision Transformers (ViT), introduced by Dosovitskiy et al. in 2020, fundamentally changed this by applying the Transformer architecture (originally designed for NLP) directly to images. Instead of sliding convolutional filters, ViT splits an image into fixed-size patches, linearly embeds each patch, and processes the sequence of patch embeddings through standard Transformer encoder blocks. Every patch can attend to every other patch from the very first layer, giving the model global receptive field from the start.\n\nFor drone applications, this is transformative. Consider a search-and-rescue scenario: a person on the ground might be just 8×8 pixels in a 4K aerial frame, but the surrounding context (terrain, roads, vegetation) provides critical cues. ViT can capture these long-range dependencies in a single attention operation, whereas a CNN would need dozens of layers to propagate that information.\n\nIn 2026, ViT variants (DINOv2, SigLIP, ViT-G) are the backbone of choice for most state-of-the-art vision systems. NVIDIA's Jetson Orin and Thor platforms include hardware-level optimizations for Transformer attention operations, making ViTs practical even at the edge. This lesson will take you from theory to implementation, building a ViT from scratch before fine-tuning pre-trained models on real aerial datasets.",
      },
      {
        id: "vit-patch-embed",
        title: "Patch Embedding: Turning Images into Sequences",
        type: "theory",
        content:
          "The fundamental insight of ViT is treating an image as a sequence of tokens, just like words in a sentence. This is achieved through Patch Embedding — the process of splitting an image into non-overlapping patches and projecting each patch into a fixed-dimensional embedding space.\n\nGiven an image of size H×W×C (height, width, channels), we divide it into a grid of patches, each of size P×P. This produces N = (H×W) / P² patches. Each patch is a P×P×C tensor that gets flattened into a vector of dimension P²·C, then linearly projected to the model's hidden dimension D using a learnable weight matrix.\n\nFor example, with a 224×224×3 image and patch size 16: N = (224×224) / (16×16) = 196 patches. Each patch is flattened from 16×16×3 = 768 values, then projected to D=768 (for ViT-Base). The result is a sequence of 196 tokens, each of dimension 768.\n\nA special [CLS] token is prepended to this sequence (just like BERT), giving us 197 tokens total. This [CLS] token aggregates information from all patches through self-attention and serves as the image representation for classification.\n\nPositional embeddings are added to each token to encode spatial information, since Transformers have no inherent notion of order. Standard ViT uses learnable 1D positional embeddings, but for aerial imagery, 2D-aware positional encodings (sinusoidal or RoPE-2D) can significantly improve performance by preserving the spatial grid structure.\n\nThe elegant trick: the linear projection can be implemented as a 2D convolution with kernel_size=P and stride=P. This is computationally identical but much faster on modern GPUs, as it leverages optimized conv2d CUDA kernels.",
      },
      {
        id: "vit-attention",
        title: "Multi-Head Self-Attention Mechanics",
        type: "theory",
        content:
          "Self-Attention is the core operation that gives Transformers their power. For each token in the sequence, it computes how much every other token should contribute to updating that token's representation. This is done through three learned projections: Queries (Q), Keys (K), and Values (V).\n\nGiven input X of shape (N, D), we project to Q = XW_Q, K = XW_K, V = XW_V where each weight matrix is (D, D_k). The attention scores are computed as: Attention(Q, K, V) = softmax(QK^T / √D_k) · V. The scaling factor √D_k prevents the dot products from growing too large, which would push softmax into regions with tiny gradients.\n\nMulti-Head Attention extends this by running H parallel attention operations with different learned projections, each of dimension D_k = D/H. The outputs are concatenated and linearly projected back to dimension D. This allows different heads to learn different types of relationships — one head might focus on color similarity, another on spatial proximity, another on shape matching.\n\nFor drone imagery, different attention heads often specialize naturally: some heads learn to attend to nearby patches (mimicking local convolutions), while others develop long-range patterns that connect objects with their contextual background. This emergent behavior is one reason ViTs outperform CNNs on complex aerial scenes.\n\nThe Transformer Encoder block wraps this attention with Layer Normalization and a Feed-Forward Network (FFN) — typically two linear layers with a GELU activation in between. The FFN expands the dimension by 4× (768 → 3072 → 768 for ViT-Base), allowing the model to learn complex non-linear transformations. Residual connections around both the attention and FFN blocks ensure stable training of deep networks (12+ layers).",
      },
      {
        id: "vit-implementation",
        title: "Implementing ViT from Scratch",
        type: "code",
        content:
          "Let's implement a complete Vision Transformer in PyTorch. This implementation includes the patch embedding layer, multi-head self-attention, transformer encoder blocks, and the classification head. The architecture follows the ViT-Base configuration but is parameterized so you can experiment with different sizes.\n\nPay close attention to the PatchEmbedding class — note how we use nn.Conv2d as an efficient implementation of the patch projection. The MultiHeadSelfAttention class shows the full QKV projection and attention computation. The TransformerBlock combines MHSA with the feed-forward network and layer normalization in the Pre-LN configuration (LayerNorm before attention/FFN, which is more stable for training).",
        language: "python",
        code: `import torch
import torch.nn as nn
import torch.nn.functional as F

class PatchEmbedding(nn.Module):
    """Split image into patches and project to embedding dimension."""
    def __init__(self, img_size=224, patch_size=16, in_channels=3, embed_dim=768):
        super().__init__()
        self.num_patches = (img_size // patch_size) ** 2
        # Conv2d with kernel=patch_size, stride=patch_size = non-overlapping patch projection
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)

    def forward(self, x):  # x: (B, C, H, W)
        x = self.proj(x)   # (B, embed_dim, H/P, W/P)
        x = x.flatten(2)   # (B, embed_dim, num_patches)
        x = x.transpose(1, 2)  # (B, num_patches, embed_dim)
        return x

class MultiHeadSelfAttention(nn.Module):
    def __init__(self, embed_dim=768, num_heads=12, dropout=0.0):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.scale = self.head_dim ** -0.5
        self.qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.proj = nn.Linear(embed_dim, embed_dim)
        self.attn_drop = nn.Dropout(dropout)

    def forward(self, x):  # x: (B, N, D)
        B, N, D = x.shape
        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)  # each: (B, heads, N, head_dim)
        attn = (q @ k.transpose(-2, -1)) * self.scale  # (B, heads, N, N)
        attn = attn.softmax(dim=-1)
        attn = self.attn_drop(attn)
        x = (attn @ v).transpose(1, 2).reshape(B, N, D)
        return self.proj(x)

class TransformerBlock(nn.Module):
    def __init__(self, embed_dim=768, num_heads=12, mlp_ratio=4.0, dropout=0.0):
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = MultiHeadSelfAttention(embed_dim, num_heads, dropout)
        self.norm2 = nn.LayerNorm(embed_dim)
        hidden_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, embed_dim),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        x = x + self.attn(self.norm1(x))  # Pre-LN + residual
        x = x + self.mlp(self.norm2(x))
        return x

class VisionTransformer(nn.Module):
    def __init__(self, img_size=224, patch_size=16, in_channels=3,
                 num_classes=10, embed_dim=768, depth=12, num_heads=12):
        super().__init__()
        self.patch_embed = PatchEmbedding(img_size, patch_size, in_channels, embed_dim)
        num_patches = self.patch_embed.num_patches
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        self.blocks = nn.Sequential(*[TransformerBlock(embed_dim, num_heads) for _ in range(depth)])
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)

    def forward(self, x):
        B = x.shape[0]
        x = self.patch_embed(x)  # (B, N, D)
        cls = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls, x], dim=1)  # prepend CLS token
        x = x + self.pos_embed
        x = self.blocks(x)
        x = self.norm(x)
        return self.head(x[:, 0])  # classify from CLS token

# Test: ViT-Base with 10 classes
model = VisionTransformer(num_classes=10, embed_dim=768, depth=12, num_heads=12)
dummy = torch.randn(2, 3, 224, 224)
out = model(dummy)
print(f"Output shape: {out.shape}")  # (2, 10)
print(f"Parameters: {sum(p.numel() for p in model.parameters()) / 1e6:.1f}M")`,
      },
      {
        id: "vit-finetuning",
        title: "Fine-tuning ViT on Drone Aerial Datasets",
        type: "code",
        content:
          "In practice, you'll rarely train a ViT from scratch (it requires 300M+ images to converge well). Instead, we leverage pre-trained weights from models trained on massive datasets (ImageNet-21k, LAION, or DINOv2 self-supervised training) and fine-tune on our drone-specific dataset.\n\nThis example shows how to fine-tune a pre-trained ViT-Base from HuggingFace on an aerial scene classification task. We replace the classification head, freeze early layers, and train with augmentations suited for overhead imagery (random rotation, since orientation is arbitrary in aerial views).",
        language: "python",
        code: `import torch
from torch.utils.data import DataLoader
from torchvision import transforms
from transformers import ViTForImageClassification, ViTImageProcessor

# ── Config ──
MODEL_NAME = "google/vit-base-patch16-224"
NUM_CLASSES = 21  # e.g., UCM aerial scene categories
LEARNING_RATE = 2e-5
EPOCHS = 10

# ── Augmentations for aerial imagery ──
# Random rotation is critical - drone images have arbitrary orientation
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    transforms.RandomRotation(360),  # full rotation for aerial
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── Load pre-trained ViT and replace classification head ──
model = ViTForImageClassification.from_pretrained(
    MODEL_NAME,
    num_labels=NUM_CLASSES,
    ignore_mismatched_sizes=True,  # allows new head
)

# Freeze early transformer blocks (keep last 4 trainable)
for param in model.vit.embeddings.parameters():
    param.requires_grad = False
for block in model.vit.encoder.layer[:8]:  # freeze blocks 0-7
    for param in block.parameters():
        param.requires_grad = False

trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total = sum(p.numel() for p in model.parameters())
print(f"Trainable: {trainable/1e6:.1f}M / {total/1e6:.1f}M ({100*trainable/total:.1f}%)")

# ── Training loop ──
optimizer = torch.optim.AdamW(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=LEARNING_RATE, weight_decay=0.01
)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# train_loader = DataLoader(your_dataset, batch_size=32, shuffle=True)
# for epoch in range(EPOCHS):
#     model.train()
#     for batch in train_loader:
#         images, labels = batch
#         images, labels = images.to(device), labels.to(device)
#         outputs = model(pixel_values=images, labels=labels)
#         loss = outputs.loss
#         loss.backward()
#         optimizer.step()
#         optimizer.zero_grad()
#     scheduler.step()
#     print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {loss.item():.4f}")`,
      },
      {
        id: "vit-exercise",
        title: "Lab: Build an Aerial Scene Classifier",
        type: "exercise",
        content:
          "In this hands-on exercise, you'll build a complete aerial scene classification system using Vision Transformers.\n\n**Task 1: Dataset Preparation**\nDownload the UC Merced Land Use dataset (21 classes, 2100 images) or the AID dataset (30 classes, 10000 images). Write a PyTorch Dataset class that loads images with proper train/val/test splits (70/15/15). Apply the aerial-specific augmentations from the previous section.\n\n**Task 2: Baseline CNN**\nTrain a ResNet-50 (pre-trained on ImageNet) on your dataset for 10 epochs. Record the validation accuracy and inference time per image. This is your baseline to beat.\n\n**Task 3: ViT Fine-tuning**\nFine-tune a ViT-Base model using the strategy shown above (freeze first 8 blocks, train last 4 + head). Train for 10 epochs with cosine annealing. Compare validation accuracy and inference time against your CNN baseline.\n\n**Task 4: Attention Visualization**\nExtract and visualize the attention maps from the last transformer block. For 5 sample images, plot the attention weights of the [CLS] token over the spatial patches. Observe which regions the model attends to — does it focus on the objects of interest?\n\n**Task 5: Analysis Report**\nWrite a brief analysis comparing ViT vs CNN on: (a) top-1 accuracy, (b) per-class accuracy for small objects, (c) inference latency, (d) attention map interpretability. When does ViT shine vs struggle compared to CNNs?",
      },
      {
        id: "vit-attention-viz",
        title: "Visualizing Attention Maps",
        type: "code",
        content:
          "One of the most powerful aspects of ViTs is interpretability through attention visualization. By examining which patches the CLS token attends to, we can understand what the model 'looks at' when making decisions. This is invaluable for debugging drone AI systems — if the model is detecting fire but attending to clouds instead of smoke, you've found a problem.",
        language: "python",
        code: `import matplotlib.pyplot as plt
import numpy as np
import torch

def get_attention_maps(model, image_tensor):
    """Extract attention maps from all layers."""
    model.eval()
    attention_maps = []

    # Register hooks to capture attention weights
    hooks = []
    for block in model.vit.encoder.layer:
        def hook_fn(module, input, output, attn_store=attention_maps):
            # output[1] contains attention weights in HuggingFace ViT
            attn_store.append(output[1].detach().cpu())
        hooks.append(block.attention.attention.register_forward_hook(hook_fn))

    with torch.no_grad():
        model(pixel_values=image_tensor.unsqueeze(0), output_attentions=True)

    for h in hooks:
        h.remove()
    return attention_maps

def visualize_cls_attention(image, attention_maps, patch_size=16):
    """Visualize what the CLS token attends to in each layer."""
    fig, axes = plt.subplots(2, 6, figsize=(24, 8))

    for idx, attn in enumerate(attention_maps):
        ax = axes[idx // 6][idx % 6]
        # CLS token attention over spatial patches (skip CLS-to-CLS)
        cls_attn = attn[0, :, 0, 1:].mean(dim=0)  # avg across heads
        num_patches = int(cls_attn.shape[0] ** 0.5)
        cls_attn = cls_attn.reshape(num_patches, num_patches).numpy()

        ax.imshow(image.permute(1, 2, 0).numpy() * 0.5 + 0.5, alpha=0.4)
        ax.imshow(
            np.array(
                plt.cm.jet(
                    (cls_attn - cls_attn.min()) / (cls_attn.max() - cls_attn.min() + 1e-8)
                )[:, :, :3]
            ).repeat(patch_size, axis=0).repeat(patch_size, axis=1),
            alpha=0.6
        )
        ax.set_title(f"Layer {idx+1}", fontsize=10)
        ax.axis("off")

    plt.suptitle("CLS Token Attention Across Layers", fontsize=14)
    plt.tight_layout()
    plt.savefig("attention_maps.png", dpi=150, bbox_inches="tight")
    plt.show()`,
      },
      {
        id: "vit-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "In this lesson, you've gone from understanding why Vision Transformers matter for drone AI to implementing one from scratch and fine-tuning pre-trained models on aerial imagery. You learned that ViT's global attention mechanism gives it an inherent advantage for aerial scenes where context spans the entire image.\n\nThe key architectural components — Patch Embedding, Multi-Head Self-Attention, and the Transformer Encoder with Pre-LN — form the foundation for nearly all modern vision models in 2026. The practical fine-tuning strategy of freezing early layers and training only the last few blocks + classification head is your go-to approach for adapting ViTs to drone-specific tasks with limited data.\n\nAttention visualization provides a powerful debugging tool that CNNs lack — you can literally see what your model is looking at, which is critical for safety-sensitive drone applications.\n\nIn the next lesson on PEFT (LoRA & QLoRA), you'll learn how to adapt even larger models with minimal compute by training only small rank-decomposition matrices instead of full weight updates.",
      },
    ],
    keyTakeaways: [
      "ViT splits images into patches and processes them as token sequences with global self-attention",
      "Patch Embedding can be efficiently implemented as a strided convolution",
      "Pre-LN Transformer blocks with residual connections enable stable training of deep ViTs",
      "Fine-tuning strategy: freeze early blocks, train last N blocks + classification head",
      "Attention maps provide interpretable debugging for safety-critical drone AI systems",
    ],
    resources: [
      { title: "An Image is Worth 16x16 Words (Original ViT Paper)", url: "https://arxiv.org/abs/2010.11929" },
      { title: "DINOv2: Learning Robust Visual Features", url: "https://arxiv.org/abs/2304.07193" },
      { title: "HuggingFace ViT Documentation", url: "https://huggingface.co/docs/transformers/model_doc/vit" },
      { title: "UC Merced Land Use Dataset", url: "http://weegee.vision.ucmerced.edu/datasets/landuse.html" },
    ],
  },

  // ─── LESSON 2: PEFT — LoRA & QLoRA ───
  {
    lessonId: "peft",
    trackId: "ai-engineer",
    moduleId: "arch-mastery",
    objectives: [
      "Understand the mathematical foundation of Low-Rank Adaptation (LoRA)",
      "Implement LoRA adapters manually on linear layers in PyTorch",
      "Use the HuggingFace PEFT library for efficient fine-tuning of large models",
      "Apply QLoRA (4-bit quantized base + LoRA) to fit large models on consumer GPUs",
      "Fine-tune a language model for drone mission command interpretation",
    ],
    prerequisites: [
      "Understanding of matrix operations and linear algebra (rank, decomposition)",
      "Experience with PyTorch model training",
      "Basic understanding of Transformer architectures (from ViT lesson or NLP background)",
    ],
    sections: [
      {
        id: "peft-why",
        title: "The Fine-tuning Bottleneck",
        type: "theory",
        content:
          "Modern foundation models contain billions of parameters — Llama 3.1 has 8B to 405B, Mistral Large has 123B. Full fine-tuning (updating every parameter) requires enormous GPU memory: a 7B parameter model in FP16 needs ~14GB just for weights, plus ~14GB for gradients, plus ~56GB for optimizer states (Adam stores 2 copies). That's 84GB+ for a single 7B model — far beyond most single GPUs.\n\nThis is a major obstacle for drone AI teams who need to adapt LLMs for specific tasks like mission command interpretation ('fly grid pattern over sector 7, altitude 50m, capture thermal every 5 seconds') or anomaly report generation from flight data. You can't afford to rent 8× A100s every time you want to adapt a model.\n\nParameter-Efficient Fine-Tuning (PEFT) solves this by training only a tiny fraction of the model's parameters — typically 0.1% to 2% — while keeping the rest frozen. The most popular PEFT method is LoRA (Low-Rank Adaptation), which adds small trainable matrices alongside the frozen pre-trained weights.\n\nThe key insight is that weight updates during fine-tuning have low intrinsic rank. When we fine-tune a 768×768 weight matrix, the actual 'useful' change can be captured by a rank-16 or rank-32 decomposition. Instead of storing a full 768×768 = 590K parameter update, we store two small matrices: 768×16 + 16×768 = 24.5K parameters. That's a 24× reduction with almost no quality loss.\n\nQLoRA goes further by quantizing the base model to 4-bit precision, reducing the frozen weights' memory footprint by 4×. Combined with LoRA adapters in FP16, this lets you fine-tune a 70B model on a single 48GB GPU — previously impossible without PEFT.",
      },
      {
        id: "peft-math",
        title: "LoRA Mathematics: Low-Rank Decomposition",
        type: "theory",
        content:
          "LoRA works by decomposing weight updates into low-rank matrices. For a pre-trained weight matrix W₀ ∈ ℝ^(d×k), instead of learning a full update ΔW ∈ ℝ^(d×k), we decompose it as ΔW = BA where B ∈ ℝ^(d×r) and A ∈ ℝ^(r×k), with rank r << min(d, k).\n\nDuring forward pass, the output becomes: h = W₀x + BAx. The original weights W₀ remain frozen (no gradient computation needed), and only B and A are trainable. Matrix A is initialized with random Gaussian values, and B is initialized to zeros, so at the start of training ΔW = BA = 0, meaning the model begins with exactly the pre-trained behavior.\n\nA scaling factor α/r is applied to the LoRA output, where α is a constant (typically set equal to r or 2×r). This controls the magnitude of the adaptation relative to the pre-trained weights. Higher α means stronger adaptation; lower α means the model stays closer to the original.\n\nIn practice, LoRA is applied to the attention projection matrices (Q, K, V, and output projection) of every Transformer layer. These are the layers where most of the 'knowledge adaptation' happens. Applying LoRA to the MLP layers is also common for more aggressive adaptation.\n\nThe rank r is the primary hyperparameter. For simple tasks (style transfer, format adaptation), r=8 suffices. For complex domain adaptation (learning drone-specific terminology and physics), r=32 to 64 is typical. The total trainable parameters with LoRA applied to Q and V projections of a 7B model at r=16 is approximately 8.4M — just 0.12% of the original model.\n\nAt inference time, the LoRA weights can be merged back into the base weights: W = W₀ + BA. This incurs zero additional latency — the model runs at the same speed as the original, with no architectural changes needed.",
      },
      {
        id: "peft-manual-impl",
        title: "Implementing LoRA from Scratch",
        type: "code",
        content:
          "Before using libraries, let's implement LoRA manually to understand exactly what happens. This implementation shows how to wrap any nn.Linear layer with a LoRA adapter, keeping the original weights frozen while training only the low-rank matrices.",
        language: "python",
        code: `import torch
import torch.nn as nn
import math

class LoRALinear(nn.Module):
    """LoRA adapter wrapping a frozen linear layer."""
    def __init__(self, original_layer: nn.Linear, rank: int = 16, alpha: float = 16.0):
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

        # LoRA matrices: A (down-projection) and B (up-projection)
        self.lora_A = nn.Parameter(torch.empty(rank, in_features))
        self.lora_B = nn.Parameter(torch.zeros(out_features, rank))

        # Initialize A with Kaiming uniform (like the original paper)
        nn.init.kaiming_uniform_(self.lora_A, a=math.sqrt(5))
        # B starts at zero → ΔW = BA = 0 at init

    def forward(self, x):
        # Original output (frozen)
        base_out = self.original(x)
        # LoRA path: x → A → B → scale
        lora_out = (x @ self.lora_A.T @ self.lora_B.T) * self.scaling
        return base_out + lora_out

    def merge_weights(self):
        """Merge LoRA weights into the original layer for zero-cost inference."""
        with torch.no_grad():
            self.original.weight += (self.lora_B @ self.lora_A) * self.scaling

def apply_lora_to_model(model, target_modules=["q_proj", "v_proj"], rank=16):
    """Apply LoRA adapters to specified modules in a model."""
    for name, module in model.named_modules():
        if any(target in name for target in target_modules):
            if isinstance(module, nn.Linear):
                parent_name = ".".join(name.split(".")[:-1])
                child_name = name.split(".")[-1]
                parent = dict(model.named_modules())[parent_name]
                lora_layer = LoRALinear(module, rank=rank)
                setattr(parent, child_name, lora_layer)

    # Count trainable params
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"LoRA applied: {trainable:,} trainable / {total:,} total ({100*trainable/total:.2f}%)")`,
      },
      {
        id: "peft-hf-qlora",
        title: "QLoRA with HuggingFace PEFT",
        type: "code",
        content:
          "In production, use the HuggingFace PEFT library which handles all the complexity. QLoRA combines 4-bit quantization of the base model (via bitsandbytes) with LoRA adapters in FP16/BF16 for training. This drastically reduces memory: a 7B model drops from ~14GB to ~3.5GB for the frozen weights, while the LoRA adapters add just ~50MB.\n\nThis example shows fine-tuning a model for drone mission command interpretation — translating natural language commands into structured flight parameters.",
        language: "python",
        code: `from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset
import torch

# ── 4-bit Quantization Config (QLoRA) ──
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",           # normalized float 4-bit
    bnb_4bit_compute_dtype=torch.bfloat16, # compute in BF16
    bnb_4bit_use_double_quant=True,       # quantize the quantization constants
)

# ── Load model in 4-bit ──
model_name = "mistralai/Mistral-7B-v0.3"
model = AutoModelForCausalLM.from_pretrained(
    model_name, quantization_config=bnb_config, device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# ── Prepare for k-bit training ──
model = prepare_model_for_kbit_training(model)

# ── LoRA Config ──
lora_config = LoraConfig(
    r=32,                     # rank — higher for domain adaptation
    lora_alpha=64,            # scaling factor
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# → trainable params: 83,886,080 || all params: 3,740,999,680 || trainable%: 2.24

# ── Sample drone command dataset ──
drone_commands = [
    {"input": "Survey the north field at 30 meters",
     "output": '{"type":"survey","pattern":"lawnmower","altitude_m":30,"area":"north_field"}'},
    {"input": "Circle the water tower twice at 50m altitude, take photos every 3 seconds",
     "output": '{"type":"orbit","target":"water_tower","altitude_m":50,"laps":2,"capture_interval_s":3}'},
    {"input": "Emergency return, low battery",
     "output": '{"type":"rtl","priority":"emergency","reason":"low_battery"}'},
]

# In production, use SFTTrainer from trl library for training
# trainer = SFTTrainer(model=model, train_dataset=dataset, ...)`,
      },
      {
        id: "peft-exercise",
        title: "Lab: Fine-tune a Drone Command Interpreter",
        type: "exercise",
        content:
          "Build a complete QLoRA fine-tuning pipeline for drone mission interpretation.\n\n**Task 1: Dataset Creation**\nCreate a dataset of 200+ drone command pairs (natural language → structured JSON). Cover these command types: survey, orbit, waypoint, RTL (return to launch), search pattern, inspection, and emergency. Include edge cases like ambiguous commands and commands with missing parameters.\n\n**Task 2: Base Model Loading**\nLoad Mistral-7B-v0.3 (or Llama-3.1-8B) in 4-bit quantization using the BitsAndBytesConfig shown above. Verify the memory usage with torch.cuda.memory_allocated().\n\n**Task 3: LoRA Configuration Sweep**\nTrain three variants with different ranks: r=8, r=32, r=64. Compare: (a) training loss convergence, (b) validation accuracy on held-out commands, (c) GPU memory usage, (d) adapter file size.\n\n**Task 4: Inference & Merging**\nAfter training, demonstrate: (a) inference with LoRA adapters loaded separately, (b) merging adapters into base weights, (c) that merged model produces identical outputs. Measure inference latency for both approaches.\n\n**Task 5: Adapter Management**\nSave multiple LoRA adapters (one for command interpretation, one for flight report generation). Show how to swap adapters at runtime without reloading the base model.",
      },
      {
        id: "peft-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "LoRA and QLoRA are essential tools for any AI engineer working with modern foundation models. You've learned that fine-tuning updates have low intrinsic rank, which LoRA exploits by decomposing weight updates into small matrices (B×A) that require a fraction of the parameters.\n\nQLoRA takes this further by quantizing the frozen base model to 4-bit, reducing memory 4× while maintaining training quality. The combination lets you fine-tune 7B-70B models on consumer GPUs — opening up large model adaptation to drone AI teams without massive compute budgets.\n\nThe practical workflow is straightforward: load quantized base model → apply LoRA config → train → either serve with adapters or merge for zero-cost inference. Multiple task-specific adapters can share a single base model, making LoRA ideal for drone systems that need different models for different mission types.\n\nNext up: Multi-modal Fusion, where you'll learn to build systems that align image and text representations — enabling natural language search over drone imagery.",
      },
    ],
    keyTakeaways: [
      "LoRA decomposes weight updates ΔW = BA with rank r << d, reducing trainable params by 10-100×",
      "B is initialized to zero so training starts from exact pre-trained behavior",
      "QLoRA combines 4-bit base quantization (NF4) with FP16 LoRA adapters",
      "At inference, LoRA weights can be merged into base weights for zero additional latency",
      "Rank r is the key hyperparameter: r=8 for simple tasks, r=32-64 for domain adaptation",
    ],
    resources: [
      { title: "LoRA: Low-Rank Adaptation of Large Language Models", url: "https://arxiv.org/abs/2106.09685" },
      { title: "QLoRA: Efficient Finetuning of Quantized LLMs", url: "https://arxiv.org/abs/2305.14314" },
      { title: "HuggingFace PEFT Library", url: "https://huggingface.co/docs/peft" },
      { title: "bitsandbytes Quantization Guide", url: "https://huggingface.co/docs/bitsandbytes" },
    ],
  },

  // ─── LESSON 3: Multi-modal Fusion ───
  {
    lessonId: "multimodal",
    trackId: "ai-engineer",
    moduleId: "arch-mastery",
    objectives: [
      "Understand contrastive learning and how CLIP aligns image-text representations",
      "Implement a dual-encoder architecture for aerial image-text matching",
      "Build a natural language drone image search system using CLIP embeddings",
      "Compare early fusion, late fusion, and cross-attention fusion strategies",
      "Apply zero-shot classification to aerial imagery using text prompts",
    ],
    prerequisites: [
      "Vision Transformers (ViT) lesson completed",
      "Understanding of embedding spaces and cosine similarity",
      "Basic NLP concepts (tokenization, text encoders)",
    ],
    sections: [
      {
        id: "mm-intro",
        title: "Multi-modal AI for Drone Systems",
        type: "theory",
        content:
          "Drones generate multi-modal data: RGB cameras, thermal sensors, LiDAR point clouds, GPS telemetry, and audio. Traditional AI systems process each modality in isolation — one model for RGB detection, another for thermal anomaly detection. But real intelligence requires fusing these modalities together, just as human pilots integrate visual, spatial, and contextual information simultaneously.\n\nMulti-modal fusion enables capabilities that no single-modality model can achieve. A drone searching for a missing person can combine RGB (clothing color), thermal (body heat signature), and text descriptions ('last seen wearing red jacket near the river') into a unified query. This is the promise of CLIP-style models: aligning different modalities into a shared embedding space where similarity search works across boundaries.\n\nCLIP (Contrastive Language-Image Pre-training), released by OpenAI, demonstrated that training a dual-encoder (one for images, one for text) on 400M image-text pairs creates an embedding space where semantically similar images and texts are close together. This enables zero-shot classification (describe a class in text, find matching images), image search by text query, and rich multi-modal reasoning.\n\nFor drone applications, this is revolutionary. Ground station operators can query the drone's captured imagery with natural language: 'show me all images containing damaged power lines' or 'find thermal anomalies near building rooftops.' Instead of training a specialized classifier for each query, CLIP-style embeddings let you search with arbitrary text — zero-shot, no retraining needed.\n\nIn this lesson, you'll build a multi-modal system from scratch, starting with the contrastive learning framework, then exploring different fusion architectures, and finally building a practical image search system for drone imagery.",
      },
      {
        id: "mm-contrastive",
        title: "Contrastive Learning & CLIP Architecture",
        type: "theory",
        content:
          "CLIP uses a dual-encoder architecture: a Vision Encoder (ViT or ResNet) processes images into embedding vectors, and a Text Encoder (Transformer) processes text into embedding vectors of the same dimension. Both encoders project into a shared D-dimensional space (512 or 768 typically).\n\nTraining uses contrastive loss on batches of (image, text) pairs. Given a batch of N pairs, we have N images and N texts. The correct pairings are on the diagonal — image_i should match text_i. For all N² possible (image, text) combinations, we compute cosine similarity. The loss pushes correct pairs' similarity up and incorrect pairs' similarity down.\n\nThe loss is a symmetric cross-entropy: for each image, the matching text should have the highest similarity among all N texts (image→text direction), and for each text, the matching image should have the highest similarity among all N images (text→image direction). The final loss is the average of both directions.\n\nMathematically: L = 0.5 × (CE(sim_matrix, labels) + CE(sim_matrix.T, labels)), where labels = [0, 1, 2, ..., N-1] (diagonal). A learnable temperature parameter τ scales the logits: sim = (image_embed · text_embed) / τ. Lower temperature makes the distribution sharper, increasing the penalty for hard negatives.\n\nThe beauty is that as the batch size increases, the model sees more negative examples per positive pair, leading to better-calibrated embeddings. Modern CLIP training uses batch sizes of 32K-65K, but for drone fine-tuning, batch sizes of 256-1024 with hard negative mining work well.\n\nAfter training, the embedding space has remarkable properties: semantically similar concepts cluster together regardless of modality. 'A house on fire' and a thermal image of a burning building map to nearby points. This emergent structure enables zero-shot capabilities without any task-specific training.",
      },
      {
        id: "mm-implementation",
        title: "Building a Dual-Encoder System",
        type: "code",
        content:
          "Let's implement a CLIP-style dual-encoder for aerial image-text matching. We use a ViT as the image encoder and a small Transformer as the text encoder, training with the symmetric contrastive loss described above.",
        language: "python",
        code: `import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoModel, AutoTokenizer

class DroneImageTextModel(nn.Module):
    """CLIP-style dual encoder for drone imagery and text descriptions."""
    def __init__(self, embed_dim=512):
        super().__init__()
        # Image encoder: pre-trained ViT
        self.image_encoder = AutoModel.from_pretrained("google/vit-base-patch16-224")
        self.image_proj = nn.Linear(768, embed_dim)

        # Text encoder: pre-trained BERT-like model
        self.text_encoder = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
        self.text_proj = nn.Linear(384, embed_dim)

        # Learnable temperature
        self.logit_scale = nn.Parameter(torch.ones([]) * 2.6592)  # ln(1/0.07)

    def encode_image(self, pixel_values):
        features = self.image_encoder(pixel_values=pixel_values).last_hidden_state[:, 0]
        return F.normalize(self.image_proj(features), dim=-1)

    def encode_text(self, input_ids, attention_mask):
        features = self.text_encoder(input_ids=input_ids, attention_mask=attention_mask)
        pooled = features.last_hidden_state[:, 0]  # CLS token
        return F.normalize(self.text_proj(pooled), dim=-1)

    def forward(self, pixel_values, input_ids, attention_mask):
        image_embeds = self.encode_image(pixel_values)
        text_embeds = self.encode_text(input_ids, attention_mask)

        # Compute similarity matrix scaled by temperature
        logit_scale = self.logit_scale.exp().clamp(max=100)
        logits = logit_scale * (image_embeds @ text_embeds.T)

        # Symmetric contrastive loss
        batch_size = logits.shape[0]
        labels = torch.arange(batch_size, device=logits.device)
        loss_i2t = F.cross_entropy(logits, labels)
        loss_t2i = F.cross_entropy(logits.T, labels)
        loss = (loss_i2t + loss_t2i) / 2

        return loss, logits

# ── Zero-shot classification ──
def zero_shot_classify(model, image, class_descriptions, tokenizer, device):
    """Classify an image using text descriptions of each class."""
    model.eval()
    with torch.no_grad():
        # Encode image
        image_embed = model.encode_image(image.unsqueeze(0).to(device))

        # Encode all class descriptions
        tokens = tokenizer(class_descriptions, padding=True, truncation=True, return_tensors="pt").to(device)
        text_embeds = model.encode_text(tokens["input_ids"], tokens["attention_mask"])

        # Cosine similarity → softmax for probabilities
        similarities = (image_embed @ text_embeds.T).squeeze(0)
        probs = similarities.softmax(dim=-1)

    return probs`,
      },
      {
        id: "mm-fusion-strategies",
        title: "Fusion Strategies: Early, Late, Cross-Attention",
        type: "theory",
        content:
          "Not all multi-modal tasks are solved with dual encoders. There are three main fusion strategies, each suited to different scenarios.\n\n**Late Fusion** (what CLIP uses): Each modality is encoded independently, and features are combined only at the final stage (dot product, concatenation). Pros: modality encoders can be pre-trained separately, inference can be done asynchronously (encode all images offline, encode text queries at runtime). Cons: limited cross-modal reasoning — the model can't learn that 'thermal hotspot' in text should attend to specific bright regions in the thermal image.\n\n**Early Fusion**: Raw inputs from different modalities are concatenated at the input level and processed by a single model. For example, stacking RGB (3 channels) + thermal (1 channel) + depth (1 channel) = 5-channel input to a modified ViT. Pros: deepest possible integration, the model can learn cross-modal patterns from the first layer. Cons: requires paired data for all modalities, can't add/remove modalities at inference time.\n\n**Cross-Attention Fusion**: Each modality is encoded separately (like late fusion), but intermediate representations are combined through cross-attention layers. The image features attend to text features and vice versa, creating a rich bidirectional interaction. This is the approach used by models like Flamingo and LLaVA. Pros: best of both worlds — independent encoding + deep cross-modal reasoning. Cons: higher computation cost, can't pre-compute embeddings for one modality.\n\nFor drone systems, the choice depends on the task. Retrieval/search → late fusion (CLIP-style). Decision making (should the drone go left/right based on visual + text instructions?) → cross-attention. Always-available sensors (RGB + thermal) → early fusion.",
      },
      {
        id: "mm-search",
        title: "Building a Drone Image Search System",
        type: "code",
        content:
          "Let's build a practical image search system where a ground station operator can query drone imagery with natural language. Images are pre-encoded and stored in a vector index. Text queries are encoded at search time, and the closest image embeddings are returned.",
        language: "python",
        code: `import numpy as np
import torch
from pathlib import Path
from PIL import Image

class DroneImageSearch:
    """Natural language search over drone imagery using CLIP embeddings."""

    def __init__(self, model, tokenizer, image_transform, device="cuda"):
        self.model = model.to(device).eval()
        self.tokenizer = tokenizer
        self.transform = image_transform
        self.device = device
        self.image_embeddings = []
        self.image_paths = []

    def index_images(self, image_dir: str, batch_size: int = 64):
        """Pre-compute and store embeddings for all images in a directory."""
        image_paths = sorted(Path(image_dir).glob("*.jpg"))
        print(f"Indexing {len(image_paths)} images...")

        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i + batch_size]
            images = torch.stack([
                self.transform(Image.open(p).convert("RGB")) for p in batch_paths
            ]).to(self.device)

            with torch.no_grad():
                embeds = self.model.encode_image(images).cpu().numpy()
            self.image_embeddings.append(embeds)
            self.image_paths.extend(batch_paths)

        self.image_embeddings = np.concatenate(self.image_embeddings, axis=0)
        print(f"Indexed {len(self.image_paths)} images, shape: {self.image_embeddings.shape}")

    def search(self, query: str, top_k: int = 5):
        """Search images by natural language query."""
        tokens = self.tokenizer(query, return_tensors="pt", padding=True, truncation=True)
        tokens = {k: v.to(self.device) for k, v in tokens.items()}

        with torch.no_grad():
            text_embed = self.model.encode_text(tokens["input_ids"], tokens["attention_mask"])
            text_embed = text_embed.cpu().numpy()

        # Cosine similarity (embeddings are already normalized)
        similarities = (self.image_embeddings @ text_embed.T).squeeze()
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append({
                "path": str(self.image_paths[idx]),
                "score": float(similarities[idx]),
            })
        return results

# Usage:
# search_engine = DroneImageSearch(model, tokenizer, transform)
# search_engine.index_images("/data/drone_captures/mission_042/")
# results = search_engine.search("damaged solar panels on rooftop")
# results = search_engine.search("vehicles on highway during rush hour")
# results = search_engine.search("thermal anomaly near power substation")`,
      },
      {
        id: "mm-exercise",
        title: "Lab: Multi-modal Drone Image Search",
        type: "exercise",
        content:
          "Build a complete multi-modal search system for drone imagery.\n\n**Task 1: Data Preparation**\nUse the RSICD (Remote Sensing Image Captioning Dataset) which contains 10,921 aerial images each with 5 text captions. Split into train (8000), val (1000), test (1921). Create a PyTorch dataset that returns (image, caption) pairs.\n\n**Task 2: Fine-tune CLIP**\nLoad OpenAI's CLIP-ViT-B/32 model and fine-tune it on your aerial dataset using the contrastive loss. Train for 20 epochs. Plot the training loss and validation retrieval metrics (R@1, R@5, R@10 for both image→text and text→image).\n\n**Task 3: Build Search Index**\nPre-compute embeddings for all test images. Implement a search function that takes a text query and returns the top-5 most similar images. Test with queries like: 'a bridge over a river', 'dense residential buildings', 'airport runway with planes'.\n\n**Task 4: Zero-shot Detection**\nWithout any additional training, use your fine-tuned CLIP to classify images into: residential, commercial, industrial, agricultural, forest, water. Report per-class accuracy compared to a supervised classifier.\n\n**Task 5: Multi-modal Dashboard**\nBuild a simple Gradio interface where users can: (a) upload a drone image and get text descriptions ranked by similarity, or (b) type a text query and see the most similar images from the database.",
      },
      {
        id: "mm-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "Multi-modal fusion is where drone AI gets truly powerful — combining vision, language, and sensor data into unified systems. You've learned the CLIP contrastive learning framework, implemented a dual-encoder architecture, and built a practical image search system.\n\nThe three fusion strategies (early, late, cross-attention) each serve different operational needs in drone systems. Late fusion gives you the flexibility of pre-computing embeddings for efficient retrieval. Early fusion maximizes cross-modal integration for always-on sensor combinations. Cross-attention balances both for reasoning-heavy tasks.\n\nZero-shot capabilities mean you can deploy a single model that handles arbitrary queries without retraining — essential for drone missions where the search targets aren't known in advance. A search-and-rescue drone doesn't need a 'person detector' — it can search for 'person in red jacket near water' directly.",
      },
    ],
    keyTakeaways: [
      "CLIP aligns image and text into a shared embedding space via symmetric contrastive loss",
      "Dual encoders enable efficient retrieval: pre-encode images offline, encode queries at runtime",
      "Three fusion strategies (early/late/cross-attention) serve different drone operational needs",
      "Zero-shot classification eliminates the need for task-specific training data",
      "Temperature parameter τ controls the sharpness of the similarity distribution",
    ],
    resources: [
      { title: "Learning Transferable Visual Models From Natural Language Supervision (CLIP)", url: "https://arxiv.org/abs/2103.00020" },
      { title: "RSICD: Remote Sensing Image Captioning Dataset", url: "https://github.com/201528014227051/RSICD_optimal" },
      { title: "OpenCLIP: Open Source CLIP Implementation", url: "https://github.com/mlfoundations/open_clip" },
      { title: "LLaVA: Visual Instruction Tuning", url: "https://arxiv.org/abs/2304.08485" },
    ],
  },

  // ─── LESSON 4: Quantization (FP8 & INT4) ───
  {
    lessonId: "quantization",
    trackId: "ai-engineer",
    moduleId: "prod-opt",
    objectives: [
      "Understand floating point number representations from FP32 down to INT4",
      "Implement Post-Training Quantization (PTQ) and Quantization-Aware Training (QAT)",
      "Use NVIDIA TensorRT and Model Optimizer for production quantization",
      "Build calibration datasets and benchmark accuracy degradation",
      "Deploy quantized models on NVIDIA Jetson Orin for real-time drone inference",
    ],
    prerequisites: [
      "Experience training deep learning models in PyTorch",
      "Understanding of model inference pipelines (input preprocessing → model → postprocessing)",
      "Basic knowledge of binary number representations",
    ],
    sections: [
      {
        id: "quant-intro",
        title: "Why Quantization Matters for Edge Drone AI",
        type: "theory",
        content:
          "A drone's onboard computer — typically an NVIDIA Jetson Orin Nano or NX — has limited power (7-25W), limited memory (8-16GB shared CPU/GPU), and must process frames in real-time (<50ms per frame for obstacle avoidance). Meanwhile, state-of-the-art models like ViT-Large have 307M parameters consuming 614MB in FP32, or 307MB in FP16. That's a significant chunk of the shared memory, leaving little room for the operating system, sensor buffers, and other models.\n\nQuantization reduces model size and increases inference speed by representing weights and activations in lower-precision numerical formats. Instead of FP32 (32-bit floating point, 4 bytes per value), we use FP16 (2 bytes), BF16 (2 bytes, better range), FP8 (1 byte — the new standard in 2026), INT8 (1 byte, integer), or INT4 (0.5 bytes, integer).\n\nThe impact is dramatic. Going from FP32 to INT8 reduces model size by 4× and increases throughput by 2-4× on hardware with INT8 tensor cores (which Jetson Orin has). Going to INT4 doubles that again. FP8, supported natively on NVIDIA Ada Lovelace and Hopper architectures, provides a middle ground: nearly the accuracy of FP16 with the speed of INT8.\n\nBut quantization isn't free — reducing precision means reducing the range and granularity of representable numbers. A model quantized naively may suffer significant accuracy degradation, especially on tail distributions (rare objects, edge cases). The art of quantization is minimizing this degradation while maximizing the speed gain.\n\nIn 2026, FP8 is the default for training and inference on data center GPUs (H100, B200), while INT8/INT4 dominate edge deployment (Jetson). Understanding when and how to apply each format is essential for any drone AI engineer.",
      },
      {
        id: "quant-formats",
        title: "Number Formats: FP32 → FP16 → FP8 → INT8 → INT4",
        type: "theory",
        content:
          "Each numerical format trades precision for efficiency. Let's understand what you gain and lose at each level.\n\n**FP32** (1 sign + 8 exponent + 23 mantissa): The training default. Range: ±3.4×10³⁸, precision: ~7 decimal digits. Every value is exact to 7 significant figures.\n\n**FP16** (1+5+10): Half the memory, half the bandwidth. Range: ±65,504, precision: ~3.3 digits. Sufficient for most inference tasks, but the limited range causes overflow during training (gradient scaling needed).\n\n**BF16** (1+8+7): Same exponent range as FP32 (±3.4×10³⁸) but only ~2.4 digits of precision. The go-to training format because it never overflows, even with large loss values. Supported on all modern NVIDIA GPUs.\n\n**FP8 E4M3** (1+4+3): NVIDIA's 2026 standard. Range: ±448, precision: ~1.7 digits. Used for forward pass computations. The limited range requires per-tensor or per-channel scaling factors.\n\n**FP8 E5M2** (1+5+2): Wider range (±57,344), less precision (~1.2 digits). Used for gradients during training where range matters more than precision.\n\n**INT8** (8-bit integer): Range: -128 to 127 (signed) or 0-255 (unsigned). Requires a scale factor and zero-point to map floating-point values to this range. Extremely fast on tensor cores.\n\n**INT4** (4-bit integer): Range: -8 to 7 (signed) or 0-15 (unsigned). Maximum compression (8× vs FP32) but significant precision loss. Works well for weights (which have known distributions) but poorly for activations (which vary per input). Groups of 32-128 weights share a single scale factor (group quantization).\n\nThe key concept is the quantization function: q = round(x / scale + zero_point), where scale maps the floating-point range to the integer range, and zero_point handles asymmetric distributions.",
      },
      {
        id: "quant-ptq",
        title: "Post-Training Quantization with TensorRT",
        type: "code",
        content:
          "Post-Training Quantization (PTQ) converts a trained FP32/FP16 model to lower precision without retraining. It requires a small calibration dataset (100-1000 samples) to determine optimal scale factors for each layer. TensorRT handles this automatically.",
        language: "python",
        code: `import torch
import tensorrt as trt
import numpy as np

# Step 1: Export PyTorch model to ONNX
def export_to_onnx(model, dummy_input, output_path="model.onnx"):
    model.eval()
    torch.onnx.export(
        model, dummy_input, output_path,
        input_names=["input"], output_names=["output"],
        dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
        opset_version=17,
    )
    print(f"Exported to {output_path}")

# Step 2: Build TensorRT engine with INT8 calibration
class DroneCalibrator(trt.IInt8EntropyCalibrator2):
    """Calibrator using real drone images for optimal quantization ranges."""
    def __init__(self, dataloader, cache_file="calibration.cache"):
        super().__init__()
        self.dataloader = iter(dataloader)
        self.cache_file = cache_file
        self.batch_size = 32
        # Allocate GPU memory for calibration batch
        self.device_input = None

    def get_batch_size(self):
        return self.batch_size

    def get_batch(self, names):
        try:
            batch = next(self.dataloader)
            if self.device_input is None:
                import pycuda.driver as cuda
                self.device_input = cuda.mem_alloc(batch.numpy().nbytes)
            import pycuda.driver as cuda
            cuda.memcpy_htod(self.device_input, batch.numpy().tobytes())
            return [int(self.device_input)]
        except StopIteration:
            return None

    def read_calibration_cache(self):
        from pathlib import Path
        if Path(self.cache_file).exists():
            return Path(self.cache_file).read_bytes()
        return None

    def write_calibration_cache(self, cache):
        with open(self.cache_file, "wb") as f:
            f.write(cache)

def build_int8_engine(onnx_path, calibrator):
    """Build a TensorRT INT8 engine from an ONNX model."""
    logger = trt.Logger(trt.Logger.WARNING)
    builder = trt.Builder(logger)
    network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
    parser = trt.OnnxParser(network, logger)

    with open(onnx_path, "rb") as f:
        parser.parse(f.read())

    config = builder.create_builder_config()
    config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 1 << 30)  # 1GB
    config.set_flag(trt.BuilderFlag.INT8)
    config.int8_calibrator = calibrator

    engine = builder.build_serialized_network(network, config)
    print(f"INT8 engine built: {len(engine) / 1e6:.1f} MB")
    return engine`,
      },
      {
        id: "quant-qat",
        title: "Quantization-Aware Training (QAT)",
        type: "code",
        content:
          "When PTQ accuracy drops too much (common with INT4 or aggressive INT8), Quantization-Aware Training (QAT) simulates quantization during training, allowing the model to adapt its weights to be more 'quantization-friendly.' The key is inserting fake-quantization nodes that round values during forward pass but pass gradients through unchanged (Straight-Through Estimator).",
        language: "python",
        code: `import torch
import torch.nn as nn
from torch.quantization import QuantStub, DeQuantStub
import torch.ao.quantization as quant

class QuantizableDetector(nn.Module):
    """Object detector with quantization stubs for QAT."""
    def __init__(self, backbone, num_classes=10):
        super().__init__()
        self.quant = QuantStub()       # marks quantization entry point
        self.backbone = backbone
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(512, num_classes),
        )
        self.dequant = DeQuantStub()   # marks dequantization exit point

    def forward(self, x):
        x = self.quant(x)
        x = self.backbone(x)
        x = self.classifier(x)
        x = self.dequant(x)
        return x

def quantization_aware_training(model, train_loader, val_loader, epochs=5):
    """Train with simulated quantization for better INT8 accuracy."""
    # 1. Specify quantization config (per-channel weight, per-tensor activation)
    model.qconfig = quant.get_default_qat_qconfig("x86")  # or "qnnpack" for ARM

    # 2. Prepare model for QAT (inserts fake-quant modules)
    quant.prepare_qat(model, inplace=True)
    print("Fake-quant modules inserted for QAT")

    # 3. Fine-tune with fake quantization
    optimizer = torch.optim.SGD(model.parameters(), lr=1e-4, momentum=0.9)

    for epoch in range(epochs):
        model.train()
        for images, targets in train_loader:
            outputs = model(images)
            loss = nn.functional.cross_entropy(outputs, targets)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        # Validate
        model.eval()
        correct = total = 0
        with torch.no_grad():
            for images, targets in val_loader:
                outputs = model(images)
                correct += (outputs.argmax(1) == targets).sum().item()
                total += targets.size(0)
        print(f"Epoch {epoch+1}: QAT accuracy = {100*correct/total:.2f}%")

    # 4. Convert to actual quantized model
    model.eval()
    quantized_model = quant.convert(model)

    # Compare sizes
    torch.save(model.state_dict(), "/tmp/fp32_model.pt")
    torch.save(quantized_model.state_dict(), "/tmp/int8_model.pt")
    import os
    fp32_size = os.path.getsize("/tmp/fp32_model.pt") / 1e6
    int8_size = os.path.getsize("/tmp/int8_model.pt") / 1e6
    print(f"Size reduction: {fp32_size:.1f}MB → {int8_size:.1f}MB ({fp32_size/int8_size:.1f}x)")

    return quantized_model`,
      },
      {
        id: "quant-exercise",
        title: "Lab: Quantize a Drone Object Detector",
        type: "exercise",
        content:
          "Build a complete quantization pipeline for a drone object detection model.\n\n**Task 1: Baseline Model**\nTrain a YOLOv8-Small model on the VisDrone dataset (drone-captured images with objects like cars, pedestrians, buses). Record mAP@50 and inference time on your GPU in FP32.\n\n**Task 2: PTQ Quantization**\nExport to ONNX and build TensorRT engines at: FP16, INT8 (with 500-image calibration set), and FP8 (if supported by your GPU). Record mAP and inference time for each.\n\n**Task 3: QAT Recovery**\nIf INT8 PTQ drops mAP by more than 2 points, apply QAT for 5 epochs. Compare the recovered accuracy vs PTQ.\n\n**Task 4: INT4 Weight-Only Quantization**\nUse GPTQ or AWQ to quantize the model weights to INT4 with group size 128. Benchmark accuracy and speed.\n\n**Task 5: Benchmark Report**\nCreate a table of all configurations: Format | Size (MB) | mAP@50 | FPS (Jetson) | Power (W). Identify the best accuracy-per-watt configuration for a battery-powered drone with 20-minute flight time.",
      },
      {
        id: "quant-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "Quantization is the bridge between state-of-the-art model accuracy and real-world drone deployment constraints. You've learned the full spectrum of numerical formats from FP32 down to INT4, and when each is appropriate.\n\nPTQ is your first stop — fast, automatic, and often sufficient. When accuracy drops, QAT recovers most of the loss by training with simulated quantization. For the most aggressive compression (INT4 weights), techniques like GPTQ use second-order information to minimize quantization error.\n\nThe 2026 standard stack for edge drone AI: train in BF16, optimize with TensorRT to INT8/FP8, deploy on Jetson. For weight-heavy LLMs, INT4 weights + FP8 activations is the sweet spot.\n\nNext: Knowledge Distillation, where you'll train small, fast models that mimic the accuracy of large models — a complementary approach to quantization for maximum edge efficiency.",
      },
    ],
    keyTakeaways: [
      "Quantization reduces model size and increases speed by using lower-precision number formats",
      "FP8 is the 2026 standard: nearly FP16 accuracy with INT8-like speed on modern NVIDIA GPUs",
      "PTQ requires only a calibration dataset; QAT requires retraining but recovers accuracy losses",
      "INT4 weight quantization (GPTQ/AWQ) enables LLM deployment on edge devices",
      "Always benchmark accuracy-per-watt, not just accuracy or speed alone, for drone applications",
    ],
    resources: [
      { title: "NVIDIA TensorRT Developer Guide", url: "https://docs.nvidia.com/deeplearning/tensorrt/developer-guide/" },
      { title: "A Survey of Quantization Methods for Neural Networks", url: "https://arxiv.org/abs/2103.13630" },
      { title: "GPTQ: Accurate Post-Training Quantization for GPT", url: "https://arxiv.org/abs/2210.17323" },
      { title: "FP8 Formats for Deep Learning (NVIDIA)", url: "https://arxiv.org/abs/2209.05433" },
    ],
  },

  // ─── LESSON 5: Knowledge Distillation ───
  {
    lessonId: "distillation",
    trackId: "ai-engineer",
    moduleId: "prod-opt",
    objectives: [
      "Understand the Teacher-Student framework for knowledge transfer",
      "Implement response-based distillation using KL Divergence loss",
      "Build feature-based distillation with intermediate layer alignment",
      "Distill a large ViT into MobileNetV4 for real-time drone inference",
      "Combine distillation with quantization for maximum edge efficiency",
    ],
    prerequisites: [
      "Vision Transformers (ViT) lesson completed",
      "Understanding of softmax temperature and probability distributions",
      "Experience with PyTorch model training and evaluation",
    ],
    sections: [
      {
        id: "distill-intro",
        title: "Why Distillation for Drone AI?",
        type: "theory",
        content:
          "You've built a massive ViT-Large model that achieves 97% accuracy on drone wildfire detection. But it runs at 5 FPS on a Jetson Orin — far too slow for real-time flight decisions that need 30+ FPS. You could quantize it (previous lesson), but what if you need even more speed?\n\nKnowledge Distillation offers a complementary approach: instead of compressing the model's weights, you train an entirely different, smaller architecture (the 'Student') to mimic the larger model's (the 'Teacher') behavior. The student model — perhaps a MobileNetV4 or EfficientNet-B0 — is architecturally designed for efficient inference, with depthwise separable convolutions, inverted residuals, and other mobile-optimized components.\n\nThe key insight is that a teacher model's soft predictions contain richer information than hard labels. When the teacher predicts [0.70, 0.25, 0.05] for [fire, smoke, cloud], those soft probabilities convey that smoke and fire look similar, while clouds are quite different. Hard labels [1, 0, 0] lose this inter-class similarity information. Training the student on these soft targets — called 'dark knowledge' — lets the student learn the teacher's full understanding, not just its final decisions.\n\nDistillation is standard practice in production drone AI. Google uses it extensively (DistilBERT, TinyViT), and NVIDIA's TAO toolkit includes built-in distillation for all supported architectures. Combined with quantization, distillation can achieve 10-50× speedup with only 1-3% accuracy drop — enabling real-time AI on the smallest drone compute modules.",
      },
      {
        id: "distill-kl",
        title: "KL Divergence and Temperature Scaling",
        type: "theory",
        content:
          "The mathematical foundation of knowledge distillation is Kullback-Leibler (KL) Divergence — a measure of how one probability distribution differs from another. We want the student's output distribution to match the teacher's distribution as closely as possible.\n\nGiven teacher logits z_t and student logits z_s, we first apply temperature-scaled softmax: p_i = exp(z_i/T) / Σ exp(z_j/T), where T is the temperature. Higher temperature (T=3 to 20) produces softer probability distributions, making the dark knowledge more pronounced. At T=1, it's standard softmax; at T→∞, all classes get equal probability.\n\nThe KL Divergence loss is: L_KD = T² × KL(softmax(z_t/T) || softmax(z_s/T)). The T² scaling compensates for the gradient magnitude reduction caused by the soft softmax — without it, the gradients would be T² times too small.\n\nThe total distillation loss combines the KL loss with the standard cross-entropy loss on hard labels: L = α × L_KD + (1-α) × L_CE, where α controls the balance. Typically α=0.7 (more weight on teacher knowledge) works well, especially when the student is much smaller than the teacher.\n\nFeature-based distillation goes beyond the final output. It aligns intermediate representations between teacher and student using MSE loss on feature maps. This is particularly effective when the student architecture differs significantly from the teacher (e.g., ViT teacher → CNN student), because the student can learn the teacher's hierarchical feature representations at multiple scales.\n\nFor drone applications, multi-scale feature alignment is especially valuable because objects of interest appear at vastly different scales in aerial imagery — a car might be 10 pixels wide while a building fills half the frame.",
      },
      {
        id: "distill-impl",
        title: "Implementing Response-based Distillation",
        type: "code",
        content:
          "Here's a complete implementation of knowledge distillation with temperature-scaled KL Divergence. The DistillationTrainer handles the dual-objective optimization: matching the teacher's soft predictions while also fitting the hard ground-truth labels.",
        language: "python",
        code: `import torch
import torch.nn as nn
import torch.nn.functional as F

class DistillationLoss(nn.Module):
    """Combined KL Divergence (soft targets) + Cross-Entropy (hard targets) loss."""
    def __init__(self, temperature=4.0, alpha=0.7):
        super().__init__()
        self.temperature = temperature
        self.alpha = alpha

    def forward(self, student_logits, teacher_logits, hard_labels):
        # Soft target loss (KL Divergence with temperature)
        soft_student = F.log_softmax(student_logits / self.temperature, dim=-1)
        soft_teacher = F.softmax(teacher_logits / self.temperature, dim=-1)
        kl_loss = F.kl_div(soft_student, soft_teacher, reduction="batchmean")
        kl_loss = kl_loss * (self.temperature ** 2)  # scale compensation

        # Hard target loss (standard cross-entropy)
        ce_loss = F.cross_entropy(student_logits, hard_labels)

        return self.alpha * kl_loss + (1 - self.alpha) * ce_loss

def train_distillation(teacher, student, train_loader, val_loader,
                       epochs=30, lr=1e-3, temperature=4.0, alpha=0.7):
    """Train student model to mimic teacher predictions."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    teacher = teacher.to(device).eval()  # teacher is always in eval mode
    student = student.to(device)

    criterion = DistillationLoss(temperature=temperature, alpha=alpha)
    optimizer = torch.optim.AdamW(student.parameters(), lr=lr, weight_decay=0.05)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    for epoch in range(epochs):
        student.train()
        total_loss = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)

            # Get teacher predictions (no gradient needed)
            with torch.no_grad():
                teacher_logits = teacher(images)

            # Get student predictions
            student_logits = student(images)

            # Combined loss
            loss = criterion(student_logits, teacher_logits, labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        scheduler.step()

        # Validate student
        student.eval()
        correct = total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                preds = student(images).argmax(dim=1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)

        acc = 100 * correct / total
        print(f"Epoch {epoch+1}/{epochs} | Loss: {total_loss/len(train_loader):.4f} | Val Acc: {acc:.2f}%")

    return student`,
      },
      {
        id: "distill-feature",
        title: "Feature-based Distillation with Hint Layers",
        type: "code",
        content:
          "Feature-based distillation aligns intermediate representations between teacher and student. Since the teacher (ViT) and student (MobileNet) have different architectures, we use adapter layers to project features into a common dimension before computing MSE loss.",
        language: "python",
        code: `import torch
import torch.nn as nn

class FeatureDistillationLoss(nn.Module):
    """Align intermediate feature maps between teacher and student."""
    def __init__(self, teacher_dims, student_dims, temperature=4.0):
        super().__init__()
        self.temperature = temperature

        # Adapter layers to match dimensions (student_dim → teacher_dim)
        self.adapters = nn.ModuleList([
            nn.Sequential(
                nn.Conv2d(s_dim, t_dim, kernel_size=1),
                nn.BatchNorm2d(t_dim),
            ) if s_dim != t_dim else nn.Identity()
            for s_dim, t_dim in zip(student_dims, teacher_dims)
        ])

        self.response_loss = nn.KLDivLoss(reduction="batchmean")

    def forward(self, student_features, teacher_features, student_logits, teacher_logits, labels):
        # Feature alignment losses
        feat_loss = 0
        for adapter, s_feat, t_feat in zip(self.adapters, student_features, teacher_features):
            s_adapted = adapter(s_feat)
            # Normalize features before comparing
            s_norm = nn.functional.normalize(s_adapted.flatten(2), dim=-1)
            t_norm = nn.functional.normalize(t_feat.flatten(2), dim=-1)
            feat_loss += nn.functional.mse_loss(s_norm, t_norm)
        feat_loss /= len(self.adapters)

        # Response-based loss
        soft_s = nn.functional.log_softmax(student_logits / self.temperature, dim=-1)
        soft_t = nn.functional.softmax(teacher_logits / self.temperature, dim=-1)
        resp_loss = self.response_loss(soft_s, soft_t) * (self.temperature ** 2)

        # Hard label loss
        ce_loss = nn.functional.cross_entropy(student_logits, labels)

        # Combined: 0.5 * feature + 0.3 * response + 0.2 * hard
        return 0.5 * feat_loss + 0.3 * resp_loss + 0.2 * ce_loss

# Usage with hooks to extract intermediate features:
def get_feature_hooks(model, layer_names):
    """Register forward hooks to capture intermediate features."""
    features = {}
    hooks = []

    def make_hook(name):
        def hook(module, input, output):
            features[name] = output
        return hook

    for name, module in model.named_modules():
        if name in layer_names:
            hooks.append(module.register_forward_hook(make_hook(name)))

    return features, hooks`,
      },
      {
        id: "distill-exercise",
        title: "Lab: Distill ViT to MobileNet for Drone Detection",
        type: "exercise",
        content:
          "Build a complete distillation pipeline that transfers knowledge from a large ViT teacher to a lightweight MobileNet student.\n\n**Task 1: Prepare Teacher**\nFine-tune ViT-Base on the VisDrone classification task to >90% accuracy. This is your teacher. Record its inference time and model size.\n\n**Task 2: Train Student from Scratch**\nTrain a MobileNetV4-Small on the same dataset without distillation. Record accuracy, speed, and size as the baseline.\n\n**Task 3: Response-based Distillation**\nTrain MobileNetV4-Small using the teacher's soft predictions (T=4, α=0.7). Compare accuracy vs the baseline trained without distillation.\n\n**Task 4: Temperature and Alpha Sweep**\nExperiment with: T ∈ {2, 4, 8, 16} and α ∈ {0.3, 0.5, 0.7, 0.9}. Plot accuracy vs parameter combinations. What's the optimal setting?\n\n**Task 5: Distillation + Quantization**\nTake your best distilled student and quantize it to INT8 using TensorRT. Report the final accuracy, model size, and inference FPS. Calculate the total speedup vs the original FP32 teacher.",
      },
      {
        id: "distill-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "Knowledge Distillation is the complement to quantization in your optimization toolkit. While quantization compresses the same architecture into lower precision, distillation transfers knowledge into a fundamentally more efficient architecture.\n\nThe temperature-scaled soft targets are the secret sauce — they convey inter-class similarities that hard labels lose. Feature-based distillation adds intermediate supervision, helping the student learn not just what to predict but how to represent visual features at multiple levels.\n\nFor drone AI, the typical pipeline is: (1) train a large teacher model for maximum accuracy, (2) distill into a mobile-optimized student, (3) quantize the student to INT8/FP8, (4) deploy on Jetson. This pipeline regularly achieves 10-50× speedup with <3% accuracy loss — the difference between 5 FPS (unusable) and 60 FPS (real-time obstacle avoidance).",
      },
    ],
    keyTakeaways: [
      "Soft predictions from a teacher contain 'dark knowledge' about inter-class relationships",
      "Temperature T controls softness: higher T reveals more class-similarity information",
      "Combined loss (α × KD + (1-α) × CE) balances teacher mimicry and ground-truth accuracy",
      "Feature distillation aligns intermediate representations for better cross-architecture transfer",
      "Distillation + Quantization is the standard pipeline for drone edge deployment",
    ],
    resources: [
      { title: "Distilling the Knowledge in a Neural Network (Hinton et al.)", url: "https://arxiv.org/abs/1503.02531" },
      { title: "TinyViT: Fast Pretraining Distillation for Small Vision Transformers", url: "https://arxiv.org/abs/2207.10666" },
      { title: "MobileNetV4: Universal Models for the Mobile Ecosystem", url: "https://arxiv.org/abs/2404.10518" },
      { title: "NVIDIA TAO Toolkit Distillation Guide", url: "https://docs.nvidia.com/tao/tao-toolkit/" },
    ],
  },

  // ─── LESSON 6: Sparsity & Pruning ───
  {
    lessonId: "pruning",
    trackId: "ai-engineer",
    moduleId: "prod-opt",
    objectives: [
      "Understand unstructured vs structured pruning and when to use each",
      "Implement magnitude-based pruning using PyTorch's pruning API",
      "Apply iterative pruning with fine-tuning for minimal accuracy loss",
      "Explore the Lottery Ticket Hypothesis and its implications",
      "Achieve 40%+ model size reduction with <1% accuracy degradation",
    ],
    prerequisites: [
      "Experience training neural networks in PyTorch",
      "Understanding of weight matrices and tensor operations",
      "Familiarity with model evaluation metrics (accuracy, mAP)",
    ],
    sections: [
      {
        id: "prune-intro",
        title: "Neural Network Sparsity: The Overparameterization Hypothesis",
        type: "theory",
        content:
          "Modern neural networks are massively overparameterized — they contain far more parameters than theoretically needed for the task. A ResNet-50 has 25.5M parameters for ImageNet-1K (1000 classes), yet information-theoretic bounds suggest the task requires far fewer. This overparameterization aids optimization during training (wider loss landscapes are easier to navigate), but it's wasteful at inference time.\n\nPruning exploits this by removing redundant parameters — setting weights to zero (or removing them entirely). Research consistently shows that 50-90% of weights in a trained network can be removed with minimal accuracy loss. This sounds extreme, but consider: many weights converge to near-zero values during training, contributing almost nothing to the output.\n\nThere are two main pruning paradigms:\n\n**Unstructured Pruning** removes individual weights anywhere in the network, creating sparse weight matrices. This maximizes the pruning ratio (up to 95% sparsity) but requires hardware/software that can accelerate sparse operations (NVIDIA Ampere+ GPUs with sparse tensor cores can achieve 2× speedup for 2:4 structured sparsity).\n\n**Structured Pruning** removes entire neurons, channels, or attention heads. This physically shrinks the model — fewer columns in weight matrices, fewer feature maps — and works with standard dense hardware. The pruning ratio is lower (typically 30-60%) but the speedup is immediate on any hardware.\n\nFor drone edge deployment, structured pruning is often preferred because Jetson's tensor cores are optimized for dense operations. However, NVIDIA's Ampere architecture on Orin NX supports 2:4 sparsity natively (2 out of every 4 values are zero), giving 2× throughput with 50% sparsity — a sweet spot that requires minimal accuracy sacrifice.",
      },
      {
        id: "prune-magnitude",
        title: "Magnitude-based Pruning in PyTorch",
        type: "code",
        content:
          "The simplest and most effective pruning strategy is magnitude-based: remove weights with the smallest absolute values. The intuition is that small weights contribute the least to the output and can be zeroed out with minimal impact. PyTorch provides a built-in pruning module that makes this straightforward.",
        language: "python",
        code: `import torch
import torch.nn as nn
import torch.nn.utils.prune as prune

def apply_global_magnitude_pruning(model, amount=0.4):
    """Prune the smallest 'amount' fraction of weights globally across all layers."""
    # Collect all prunable parameters
    parameters_to_prune = []
    for name, module in model.named_modules():
        if isinstance(module, (nn.Linear, nn.Conv2d)):
            parameters_to_prune.append((module, "weight"))

    # Global unstructured pruning — considers all weights together
    prune.global_unstructured(
        parameters_to_prune,
        pruning_method=prune.L1Unstructured,
        amount=amount,
    )

    # Report sparsity per layer
    total_zeros = total_params = 0
    for name, module in model.named_modules():
        if isinstance(module, (nn.Linear, nn.Conv2d)):
            zeros = (module.weight == 0).sum().item()
            total = module.weight.numel()
            total_zeros += zeros
            total_params += total
            print(f"{name}: {100*zeros/total:.1f}% sparse ({zeros}/{total})")

    print(f"\\nGlobal sparsity: {100*total_zeros/total_params:.1f}%")
    return model

def make_pruning_permanent(model):
    """Remove pruning reparameterization, making masks permanent."""
    for name, module in model.named_modules():
        if isinstance(module, (nn.Linear, nn.Conv2d)):
            try:
                prune.remove(module, "weight")
            except ValueError:
                pass  # not pruned
    return model

# Structured pruning: remove entire channels
def prune_channels(model, amount=0.3):
    """Remove the least important output channels from Conv2d layers."""
    for name, module in model.named_modules():
        if isinstance(module, nn.Conv2d):
            prune.ln_structured(
                module, name="weight",
                amount=amount,
                n=2,  # L2 norm
                dim=0,  # output channels
            )

# 2:4 Structured Sparsity (NVIDIA Ampere+)
def apply_2_4_sparsity(weight):
    """Apply 2:4 structured sparsity pattern for NVIDIA tensor cores."""
    w = weight.detach().clone()
    # Process each group of 4 consecutive elements
    for i in range(0, w.numel(), 4):
        group = w.view(-1)[i:i+4]
        # Keep the 2 largest, zero the 2 smallest
        _, indices = group.abs().topk(2)
        mask = torch.zeros(4, device=w.device)
        mask[indices] = 1
        w.view(-1)[i:i+4] *= mask
    return w`,
      },
      {
        id: "prune-iterative",
        title: "Iterative Pruning with Fine-tuning Recovery",
        type: "code",
        content:
          "Pruning 40% of weights in one shot often causes too much accuracy loss. The solution is iterative pruning: prune a small fraction, fine-tune to recover accuracy, prune more, fine-tune again. This gives the network time to redistribute importance to surviving weights after each pruning step.",
        language: "python",
        code: `import torch
import torch.nn as nn
import torch.nn.utils.prune as prune
import copy

def iterative_prune_and_finetune(
    model, train_loader, val_loader, target_sparsity=0.5,
    prune_steps=5, finetune_epochs=3, lr=1e-4
):
    """Iteratively prune and fine-tune to reach target sparsity with minimal accuracy loss."""
    device = next(model.parameters()).device
    criterion = nn.CrossEntropyLoss()

    # Calculate per-step pruning amount
    # After n steps of pruning fraction p, remaining = (1-p)^n = (1-target)
    per_step = 1 - (1 - target_sparsity) ** (1 / prune_steps)
    print(f"Target: {target_sparsity*100:.0f}% sparsity in {prune_steps} steps ({per_step*100:.1f}% per step)")

    best_model = copy.deepcopy(model)
    initial_acc = evaluate(model, val_loader, device)
    print(f"Initial accuracy: {initial_acc:.2f}%")

    for step in range(prune_steps):
        # Prune
        params = [(m, "weight") for _, m in model.named_modules()
                  if isinstance(m, (nn.Linear, nn.Conv2d))]
        prune.global_unstructured(params, pruning_method=prune.L1Unstructured, amount=per_step)

        sparsity = get_global_sparsity(model)
        acc_after_prune = evaluate(model, val_loader, device)
        print(f"Step {step+1}: Sparsity={sparsity:.1f}%, Acc after prune={acc_after_prune:.2f}%")

        # Fine-tune to recover
        optimizer = torch.optim.Adam(model.parameters(), lr=lr)
        for epoch in range(finetune_epochs):
            model.train()
            for images, labels in train_loader:
                images, labels = images.to(device), labels.to(device)
                loss = criterion(model(images), labels)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

        acc_after_ft = evaluate(model, val_loader, device)
        print(f"  After fine-tune: Acc={acc_after_ft:.2f}% (recovered {acc_after_ft - acc_after_prune:.2f}%)")

        if acc_after_ft > initial_acc - 1.0:  # within 1% of original
            best_model = copy.deepcopy(model)

    make_pruning_permanent(best_model)
    return best_model

def evaluate(model, val_loader, device):
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            correct += (model(images).argmax(1) == labels).sum().item()
            total += labels.size(0)
    return 100 * correct / total

def get_global_sparsity(model):
    zeros = total = 0
    for m in model.modules():
        if isinstance(m, (nn.Linear, nn.Conv2d)):
            zeros += (m.weight == 0).sum().item()
            total += m.weight.numel()
    return 100 * zeros / total`,
      },
      {
        id: "prune-lottery",
        title: "The Lottery Ticket Hypothesis",
        type: "theory",
        content:
          "The Lottery Ticket Hypothesis (Frankle & Carlin, 2019) makes a provocative claim: within a randomly initialized dense network, there exists a sparse sub-network (the 'winning ticket') that, when trained in isolation from the same initialization, can match the full network's accuracy.\n\nThe implications are profound. It means the full dense network isn't needed for its capacity — it's needed for its optimization landscape. The overparameterization helps SGD find good solutions during training, but once found, most of the parameters are redundant.\n\nThe practical procedure is: (1) train the dense model, (2) prune to find the sparse mask, (3) reset the surviving weights to their initial values, (4) retrain only the sparse sub-network. The resulting model trains to the same accuracy as the original dense model but is much smaller.\n\nFor drone AI, lottery tickets suggest an exciting workflow: train a large model once, identify the winning ticket, and deploy only the sparse sub-network. The challenge is that finding winning tickets requires iterative pruning (computationally expensive), and the hypothesis works best at moderate sparsity levels (50-80%).\n\nLate Rewinding (a practical relaxation) resets weights to their values at epoch k (typically 5-10% into training) rather than to initialization. This works at higher sparsity levels and with larger models, making it more practical for real applications.\n\nIn 2026, lottery ticket ideas have evolved into methods like 'Training-Free Pruning' that identify important sub-networks from a single forward pass of calibration data, without any iterative training. These methods are particularly attractive for drone deployment where compute budgets for optimization are limited.",
      },
      {
        id: "prune-exercise",
        title: "Lab: Build an Optimized Sparse Drone Detector",
        type: "exercise",
        content:
          "Build an end-to-end pruning pipeline for an aerial object detector.\n\n**Task 1: Dense Baseline**\nTrain a ResNet-34 classifier on the PatternNet aerial scene dataset (38 classes). Record accuracy and model size as your dense baseline.\n\n**Task 2: One-Shot Pruning**\nApply global magnitude pruning at 30%, 50%, 70%, and 90% sparsity. For each, report accuracy without any fine-tuning. At what sparsity does accuracy drop below 5% of the dense baseline?\n\n**Task 3: Iterative Pruning**\nUse the iterative pruning function to reach 50% sparsity in 5 steps with 3 epochs of fine-tuning between each step. Compare the final accuracy against one-shot pruning at 50%.\n\n**Task 4: Structured vs Unstructured**\nCompare: (a) 50% unstructured pruning, (b) 30% structured channel pruning. Measure both accuracy and actual inference speed. Which gives better speed on your target hardware?\n\n**Task 5: The Full Pipeline**\nCombine all three optimization techniques on one model: (1) distill from a ViT-Large teacher, (2) apply 50% iterative pruning, (3) quantize to INT8. Report the final accuracy, model size, and inference FPS. Calculate total compression ratio vs the original ViT-Large teacher.",
      },
      {
        id: "prune-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "Pruning completes the production optimization trifecta: Quantization (reduce precision), Distillation (reduce architecture), and Pruning (reduce parameters). Together, these three techniques can take a 300MB ViT-Large running at 5 FPS and produce a 3MB quantized, pruned, distilled model running at 60+ FPS.\n\nMagnitude-based pruning is simple and effective — small weights contribute the least. Iterative pruning with fine-tuning recovery is the gold standard for maintaining accuracy at high sparsity. The Lottery Ticket Hypothesis provides theoretical motivation and practical recipes for finding optimal sparse sub-networks.\n\nFor Jetson deployment, 2:4 structured sparsity is the practical sweet spot — 50% sparsity with guaranteed 2× speedup on NVIDIA tensor cores, requiring no special sparse runtime libraries.\n\nWith this lesson, you've completed the Production Optimization Stack. You now have the tools to take any model from research-quality accuracy to edge-deployment-ready efficiency.",
      },
    ],
    keyTakeaways: [
      "50-90% of neural network weights can be removed with minimal accuracy loss",
      "Unstructured pruning achieves higher sparsity; structured pruning gives immediate speedup on dense hardware",
      "Iterative pruning + fine-tuning outperforms one-shot pruning at the same sparsity level",
      "2:4 structured sparsity gives guaranteed 2× speedup on NVIDIA Ampere+ tensor cores",
      "Pruning + Distillation + Quantization is the full pipeline for drone edge deployment",
    ],
    resources: [
      { title: "The Lottery Ticket Hypothesis (Frankle & Carlin)", url: "https://arxiv.org/abs/1803.03635" },
      { title: "PyTorch Pruning Tutorial", url: "https://pytorch.org/tutorials/intermediate/pruning_tutorial.html" },
      { title: "Accelerating Sparse Deep Neural Networks (NVIDIA)", url: "https://arxiv.org/abs/2104.08378" },
      { title: "A Survey on Model Compression for Large Language Models", url: "https://arxiv.org/abs/2308.07633" },
    ],
  },
];
