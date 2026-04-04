"""
================================================================================
 DroneAI Academy — AI Engineer Track
 Lesson 1: Architectural Mastery — Vision Transformers & Multi-Modal Models
================================================================================

HOW TO USE THIS SCRIPT
-----------------------
This is your complete study companion for Lesson 1. Run it top-to-bottom once
to fully understand and execute every concept. Each section maps 1-to-1 to the
step-by-step guide in the platform.

Run each section independently during study:
    python lesson1_complete.py

Prerequisites:
    pip install torch torchvision transformers datasets Pillow requests numpy

GPU strongly recommended. CPU fallback is handled automatically.

Author: DroneAI Academy — AI Engineer Curriculum
================================================================================
"""

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 0 — CONCEPTUAL FOUNDATIONS  (Read before running any code)
# ─────────────────────────────────────────────────────────────────────────────
"""
▶ WHAT ARE VISION TRANSFORMERS (ViT)?

Traditional Convolutional Neural Networks (CNNs) process images through a
series of sliding windows (convolutions) that look at small, local regions of
the image at a time. This creates a strong INDUCTIVE BIAS toward local spatial
patterns — great for finding edges and textures near each other, but poor at
connecting distant regions early in the network.

Vision Transformers take a completely different approach:

1. PATCH TOKENIZATION
   The input image (e.g. 224×224 pixels) is divided into a grid of fixed-size
   non-overlapping patches (e.g. 16×16 px). For a 224×224 image with 16×16
   patches, this gives (224/16)² = 196 patches.

2. LINEAR PROJECTION (Patch Embedding)
   Each 16×16×3 patch (768 raw values) is projected through a trainable linear
   layer into a D-dimensional embedding vector (typically D=768). This is
   mathematically equivalent to — and implemented as — a Conv2d with
   kernel_size=stride=patch_size. This saves a LOT of compute over manual
   unrolling.

3. POSITIONAL ENCODING
   Transformers have no concept of sequence order. To preserve spatial
   awareness (patch at position [3,5] should know it is near [3,6]), we ADD
   learnable positional embedding vectors to each token. These are learned
   during training, not fixed like sinusoidal encodings in NLP Transformers.

4. [CLS] TOKEN
   A special learnable "classification token" is prepended to the 196 patch
   tokens. After passing through all Transformer blocks, only this [CLS] token
   is fed to the classification head. It acts as a global summary of the entire
   image — all other patches attend to it via self-attention.

5. MULTI-HEAD SELF-ATTENTION (MHSA)
   Every token in the sequence attends to every other token in parallel.
   The mechanism computes three matrices from each token vector:
       Query (Q): "What am I looking for?"
       Key   (K): "What do I contain?"
       Value (V): "What information do I offer?"
   The attention weight between token i and token j is:
       score(i,j) = softmax( Q_i · K_j / √d_k )
   The output for token i is then: Σ_j score(i,j) · V_j

   Run multiple "heads" in parallel (each with a different learned Q/K/V
   projection). Concatenate and linearly project the result.

6. MLP (Feed-Forward Network)
   After attention, each token is independently passed through a two-layer MLP:
       Linear → GELU → Linear
   The hidden size is typically 4× the embedding dim (mlp_ratio=4.0).

7. LAYER NORM + RESIDUAL CONNECTIONS
   Before each sub-layer (attention and MLP), Layer Normalization is applied.
   After each sub-layer, the input is added back (residual connection). This
   prevents vanishing/exploding gradients in deep networks.

▶ WHY DOES THIS MATTER FOR DRONES?

When flying at 400 feet, a person of interest (e.g. a lost hiker) may occupy
only 12×12 pixels in a 4K frame. A CNN needs many pooling layers before it
sees the big picture — by then it has lost fine-grained detail. A ViT sees
global context from layer 1: the [CLS] token attends simultaneously to the
small cluster of pixels AND the surrounding forest canopy, dramatically
reducing false positives.

▶ WHAT IS CLIP?

CLIP (Contrastive Language–Image Pre-training, Radford et al. 2021, OpenAI)
trains two separate encoder towers:
   - An image encoder  (ViT or ResNet backbone)
   - A text  encoder  (GPT-style Transformer)

Both towers project their inputs into a SHARED dense vector space (e.g. 512-D).
Training objective: given a batch of N (image, caption) pairs, maximize cosine
similarity on the N diagonal pairs while minimizing it on the N²-N off-diagonal
pairs. This is the InfoNCE / NT-Xent contrastive loss.

After training on 400M image-text pairs from the internet, CLIP can:
   - Perform ZERO-SHOT image classification: encode all class names as text,
     find the nearest neighbor to the image embedding.
   - Enable semantic search: "find thermal anomalies in the eastern sector"
     without any class-specific fine-tuning or retraining.

This is transformative for drones: an operator can describe a target in natural
language, and the drone's vision system performs live semantic matching against
its camera feed — no need to retrain for every new mission profile.

▶ DEPLOYMENT ON EDGE HARDWARE (Jetson Orin)

Large ViT models cannot run in real-time on embedded hardware in their raw
PyTorch form. The path to edge deployment:

1. Export the trained model to ONNX (Open Neural Network Exchange format):
       torch.onnx.export(model, dummy_input, "vit.onnx", ...)
   ONNX strips Python-level overhead and represents the model as a pure
   computational graph.

2. Compile the ONNX graph with TensorRT (NVIDIA's inference optimizer):
       trt_engine = trt.Builder.build_engine(onnx_network, config)
   TensorRT fuses consecutive operators (e.g. Conv+BN+ReLU → single kernel),
   performs layer-level precision calibration (FP32 → FP16 → INT8), and
   selects the fastest CUDA kernel for each operation on the target GPU.

3. Run inference via the TensorRT engine:
       context.execute_async_v2(bindings, stream)
   Latency can drop from 80ms → 8ms on the same hardware — a 10× speed-up.

══════════════════════════════════════════════════════════════════════════════
KEY CONCEPTS TO INTERNALIZE (these are tested in the quiz):
  ✔ ViT advantage: GLOBAL context from layer 1 (not local like CNN)
  ✔ Patch embedding converts 16×16 image patches → D-dim token embeddings
  ✔ [CLS] token is prepended; only it is passed to the classification head
  ✔ Positional encoding preserves SPATIAL location of patches
  ✔ MHSA: num_heads splits embed_dim → each head learns different attention
  ✔ GELU activation used in the MLP (not ReLU — smoother gradient flow)
  ✔ LayerNorm before each sub-layer (Pre-LN architecture, more stable)
  ✔ CLIP = Contrastive Language-Image Pre-training
  ✔ CLIP enables zero-shot via image↔text embedding cosine similarity
  ✔ InfoNCE loss trains CLIP; needs very large batches (32,768+)
  ✔ CLIPProcessor: preprocesses BOTH image and text for the model
  ✔ torch.no_grad() is MANDATORY on edge hardware — no gradient memory waste
  ✔ mlp_ratio: hidden_dim = embed_dim × mlp_ratio (default 4.0)
  ✔ embed_dim: dimensionality of token embeddings (not patch pixel size)
══════════════════════════════════════════════════════════════════════════════
"""

import sys

print("=" * 70)
print("  DroneAI Academy — Lesson 1: Vision Transformers & CLIP")
print("=" * 70)
print()


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Environment Setup & GPU Validation
# ─────────────────────────────────────────────────────────────────────────────

print("━" * 70)
print("STEP 1: Setting up your Python environment and validating GPU")
print("━" * 70)
print("""
CONCEPT: Before any ML work, establish a reproducible, version-pinned
environment. In production drone software, version drift is catastrophic —
an unexpected PyTorch API change can silently corrupt sensor fusion outputs.

Install command (run ONCE before this script):
  pip install torch==2.3.0 torchvision transformers==4.40.0 \\
              datasets matplotlib numpy Pillow requests

We use torch.profiler to baseline memory and compute budgets. This is
non-negotiable on edge hardware where VRAM is a hard constraint.
""")

import torch
import torch.nn as nn
import torch.nn.functional as F

# Detect available device — graceful CPU fallback for development
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    gpu_name = torch.cuda.get_device_name(0)
    vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"  ✅  GPU detected: {gpu_name} ({vram_gb:.1f} GB VRAM)")
    print(f"  ✅  CUDA version: {torch.version.cuda}")
else:
    print("  ⚠️   No GPU found — running on CPU. Performance will be limited.")
    print("       On edge hardware (Jetson Orin), CUDA is always required.")

print(f"  ✅  PyTorch version: {torch.__version__}")
print(f"  ✅  Running on: {device}")
print()
print("  PRODUCTION NOTE:")
print("  Use strict version pins (==) in requirements.txt. On drone")
print("  embedded systems, never use >=. An accidental minor version bump")
print("  can change a CUDA kernel dispatch path and break real-time latency.")
print()


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Build a Vision Transformer (ViT) from Scratch
# ─────────────────────────────────────────────────────────────────────────────

print("━" * 70)
print("STEP 2: Implementing a Vision Transformer (ViT) from scratch")
print("━" * 70)
print("""
CONCEPT: We implement every ViT component by hand so you understand every
tensor transformation. In production you would import timm.create_model() or
use a HuggingFace checkpoint — but knowing the internals lets you debug
silent shape mismatches on the Jetson's compact memory footprint.

Key engineering decisions in this implementation:
  - PatchEmbedding uses Conv2d (kernel=stride=patch_size) instead of manual
    unrolling — this is 3–5× faster due to CUDA-optimized conv kernels.
  - Q, K, V are computed in a single fused linear layer (qkv) for cache
    coherency. Separate Q/K/V projections triple memory bandwidth usage.
  - Residual connections are OUTSIDE the layer norm (Pre-LN) — empirically
    more stable for training deep networks without warmup.
  - The final classification uses ONLY x[:, 0] — the [CLS] token output.
    All 196 patch tokens are discarded at inference time.
""")


class PatchEmbedding(nn.Module):
    """
    Converts a batch of images into a sequence of flat patch embeddings.

    Given input shape (B, C, H, W):
      → Divide into (H/P × W/P) non-overlapping P×P patches
      → Project each patch linearly to embed_dim
      → Output shape: (B, num_patches, embed_dim)

    Implementation trick: nn.Conv2d with kernel_size=stride=P is mathematically
    identical to manually extracting patches and multiplying by a weight matrix,
    but leverages CUDA's cuDNN optimized conv kernels for ~3× speed-up.

    Args:
        img_size    : Expected square image side length (pixels)
        patch_size  : Side length of each square patch (pixels)
        in_channels : Number of image channels (3 for RGB, 1 for thermal)
        embed_dim   : Output token embedding dimensionality
    """
    def __init__(self, img_size: int = 224, patch_size: int = 16,
                 in_channels: int = 3, embed_dim: int = 768):
        super().__init__()
        assert img_size % patch_size == 0, \
            f"img_size {img_size} must be divisible by patch_size {patch_size}"
        self.num_patches = (img_size // patch_size) ** 2
        # Single conv replaces: unfold → reshape → linear projection
        self.proj = nn.Conv2d(
            in_channels, embed_dim,
            kernel_size=patch_size, stride=patch_size
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, C, H, W)
        x = self.proj(x)             # → (B, embed_dim, H/P, W/P)
        x = x.flatten(2)             # → (B, embed_dim, num_patches)
        x = x.transpose(1, 2)        # → (B, num_patches, embed_dim)
        return x


class MultiHeadSelfAttention(nn.Module):
    """
    Multi-Head Self-Attention (MHSA) — the core engine of the Transformer.

    Each token (patch) attends to every other token simultaneously. Instead of
    one global attention map, we run `num_heads` attention computations in
    parallel on sub-dimensions of size head_dim = embed_dim / num_heads.

    Each head learns to attend to different aspects:
      - Head 1 might focus on edges and textures
      - Head 2 might associate small bright patches with the horizon context
      - Head 3 might correlate thermal signatures with altitude meta-tokens

    The attention score between token i and token j:
        score(i,j) = softmax( Q_i · K_j^T / √head_dim )
    This is divided by √head_dim to prevent vanishing gradients in softmax
    as dimensionality grows.

    Args:
        embed_dim : Total embedding dimensionality
        num_heads : Number of parallel attention heads
    """
    def __init__(self, embed_dim: int, num_heads: int):
        super().__init__()
        assert embed_dim % num_heads == 0, \
            f"embed_dim {embed_dim} must be divisible by num_heads {num_heads}"
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        # Scale factor: 1/√d_k prevents gradient saturation in softmax
        self.scale = self.head_dim ** -0.5

        # Fused Q, K, V projection: 3× embed_dim output, computed in one matmul
        # This maximizes GPU cache utilization vs. 3 separate nn.Linear calls
        self.qkv = nn.Linear(embed_dim, embed_dim * 3, bias=False)
        self.proj = nn.Linear(embed_dim, embed_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, N, C = x.shape  # B=batch, N=seq_len (num_patches+1), C=embed_dim

        # Compute Q, K, V in one pass → reshape into multi-head view
        qkv = (
            self.qkv(x)                                    # (B, N, 3*C)
            .reshape(B, N, 3, self.num_heads, self.head_dim)
            .permute(2, 0, 3, 1, 4)                        # (3, B, H, N, head_dim)
        )
        q, k, v = qkv.unbind(0)  # each: (B, num_heads, N, head_dim)

        # Scaled dot-product attention
        attn = (q @ k.transpose(-2, -1)) * self.scale     # (B, H, N, N)
        attn = attn.softmax(dim=-1)                        # normalize across tokens

        # Apply attention weights to values; collapse heads
        x = (attn @ v)                                     # (B, H, N, head_dim)
        x = x.transpose(1, 2).reshape(B, N, C)            # (B, N, C)
        return self.proj(x)


class TransformerBlock(nn.Module):
    """
    A single Transformer Encoder block (Pre-LN variant).

    Architecture: LayerNorm → MHSA → Residual + LayerNorm → MLP → Residual
    The Pre-LN design (norm BEFORE the sub-layer, not after) provides more
    stable gradient flow and removes the need for a careful learning-rate warmup.

    MLP uses GELU activation (not ReLU) — GELU has a smoother gradient at
    zero (no sharp kink), which improves convergence in deep networks.

    Args:
        embed_dim : Token embedding dimensionality
        num_heads : Number of attention heads
        mlp_ratio : Hidden dim multiplier for the MLP (default 4.0,
                    so hidden_dim = embed_dim × mlp_ratio = 768 × 4 = 3072)
    """
    def __init__(self, embed_dim: int, num_heads: int, mlp_ratio: float = 4.0):
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = MultiHeadSelfAttention(embed_dim, num_heads)
        self.norm2 = nn.LayerNorm(embed_dim)

        mlp_hidden = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden),
            nn.GELU(),  # Gaussian Error Linear Unit — smoother than ReLU
            nn.Linear(mlp_hidden, embed_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Pre-LN Residual: x_out = x + SubLayer(Norm(x))
        x = x + self.attn(self.norm1(x))   # Attention branch
        x = x + self.mlp(self.norm2(x))    # MLP branch
        return x


class ViT(nn.Module):
    """
    Full Vision Transformer (ViT-Base configuration by default).

    Architecture summary:
        Input image (B, 3, 224, 224)
          ↓ PatchEmbedding Conv2d
        Patch tokens (B, 196, 768)
          ↓ Prepend [CLS] token → (B, 197, 768)
          ↓ Add positional embeddings (learned, shape [1, 197, 768])
          ↓ N × TransformerBlock  (depth=12 for ViT-Base)
          ↓ LayerNorm
        Take [CLS] token only → (B, 768)
          ↓ Linear classification head
        Logits (B, num_classes)

    Args:
        img_size    : Input image size (assumes square)
        patch_size  : Patch size (16 → 196 patches for 224×224)
        in_channels : 3 for RGB, 1 for thermal, 4 for RGBI
        num_classes : Number of output classes (1000 for ImageNet)
        embed_dim   : Token embedding dimensionality (768 for ViT-Base)
        depth       : Number of stacked Transformer blocks (12 for ViT-Base)
        num_heads   : Number of attention heads (12 for ViT-Base)
    """
    def __init__(
        self,
        img_size: int = 224,
        patch_size: int = 16,
        in_channels: int = 3,
        num_classes: int = 1000,
        embed_dim: int = 768,
        depth: int = 12,
        num_heads: int = 12,
    ):
        super().__init__()
        self.patch_embed = PatchEmbedding(img_size, patch_size, in_channels, embed_dim)
        num_patches = self.patch_embed.num_patches

        # Learnable [CLS] token — global image representation after attention
        # Shape (1, 1, embed_dim): expanded to batch size in forward()
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))

        # Learnable positional embeddings — one per token (patches + cls)
        # Learned during training, allowing spatial layout to be discovered
        self.pos_embed = nn.Parameter(torch.zeros(1, 1 + num_patches, embed_dim))
        nn.init.trunc_normal_(self.pos_embed, std=0.02)  # Small init for stability
        nn.init.trunc_normal_(self.cls_token, std=0.02)

        # Stack of Transformer encoder blocks
        self.blocks = nn.Sequential(
            *[TransformerBlock(embed_dim, num_heads) for _ in range(depth)]
        )
        self.norm = nn.LayerNorm(embed_dim)

        # Classification head: only processes the [CLS] token output
        self.head = nn.Linear(embed_dim, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B = x.shape[0]

        # 1. Convert image to patch tokens
        x = self.patch_embed(x)                              # (B, 196, 768)

        # 2. Prepend [CLS] token to sequence (expand to batch size)
        cls = self.cls_token.expand(B, -1, -1)               # (B, 1, 768)
        x = torch.cat([cls, x], dim=1)                       # (B, 197, 768)

        # 3. Add positional embeddings (broadcasted over batch)
        x = x + self.pos_embed                               # (B, 197, 768)

        # 4. Apply N Transformer blocks
        x = self.blocks(x)                                   # (B, 197, 768)

        # 5. LayerNorm
        x = self.norm(x)                                     # (B, 197, 768)

        # 6. Extract [CLS] token → classification head
        # x[:, 0] is the [CLS] token — it has attended to all 196 patch tokens
        return self.head(x[:, 0])                            # (B, num_classes)


# ── Run and validate ────────────────────────────────────────────────────────

print("  Building ViT-Base (depth=12, heads=12, embed_dim=768)...")
vit_model = ViT(
    img_size=224,
    patch_size=16,
    in_channels=3,
    num_classes=10,    # 10 classes for our drone mission taxonomy
    embed_dim=768,
    depth=12,
    num_heads=12,
).to(device)

# Count parameters (ViT-Base: ~86M)
total_params = sum(p.numel() for p in vit_model.parameters())
trainable = sum(p.numel() for p in vit_model.parameters() if p.requires_grad)
print(f"  ✅  Total parameters    : {total_params:,}")
print(f"  ✅  Trainable parameters: {trainable:,}")

# Validate shapes at each stage
dummy_image = torch.randn(2, 3, 224, 224, device=device)  # batch of 2

# Patch embedding shape validation
patch_out = vit_model.patch_embed(dummy_image)
assert patch_out.shape == (2, 196, 768), \
    f"Expected (2, 196, 768), got {patch_out.shape}"
print(f"  ✅  Patch embedding output shape: {tuple(patch_out.shape)}")
print(f"       → 2 images × 196 patches × 768 embedding dims")
print(f"       → (224/16)² = 196 patches ✔")

# Full forward pass
with torch.no_grad():
    logits = vit_model(dummy_image)

assert logits.shape == (2, 10), \
    f"Expected (2, 10) logits, got {logits.shape}"
print(f"  ✅  Full forward pass output shape: {tuple(logits.shape)}")
print(f"       → 2 images × 10 class scores ✔")
print()
print("  PRODUCTION NOTES:")
print("  ✦ On Jetson Orin: export with torch.onnx.export() → compile with")
print("    TensorRT. FP16 precision gives ~10× latency improvement over FP32.")
print("  ✦ ALWAYS call vit_model.eval() before inference — this disables")
print("    dropout and sets BatchNorm to use running statistics.")
print("  ✦ torch.cuda.empty_cache() between batches prevents OOM on low-VRAM")
print("    embedded GPUs (Jetson Orin has a shared CPU/GPU memory pool).")
print()


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Zero-Shot Detection with CLIP
# ─────────────────────────────────────────────────────────────────────────────

print("━" * 70)
print("STEP 3: Zero-shot detection with CLIP")
print("━" * 70)
print("""
CONCEPT: CLIP was trained on 400M (image, text) pairs crawled from the web.
Both the image encoder and text encoder were jointly optimized so that matching
pairs end up close together in the same 512-dimensional embedding space.

Zero-shot workflow for drone missions:
  1. Pre-compute text embeddings for each candidate label ONCE (cached).
  2. For each camera frame: compute image embedding.
  3. Find the label whose text embedding has the highest cosine similarity
     with the image embedding → that is the predicted class.

This eliminates retraining entirely for new mission profiles. A SAR (Search
and Rescue) operator can type "person lying in tall grass" and the drone
immediately starts looking for that exact signature.

CRITICAL: Always use torch.no_grad() for inference:
  - Gradients require storing the full computation graph in memory.
  - On Jetson Orin with 16GB shared RAM, a single un-guarded forward pass
    through CLIP can exhaust all available memory instantly.
""")

try:
    from transformers import CLIPProcessor, CLIPModel
    import requests
    from PIL import Image
    import io

    MODEL_ID = "openai/clip-vit-base-patch32"
    print(f"  Loading CLIP: {MODEL_ID}")
    print("  (First run downloads ~600 MB to ~/.cache/huggingface/)")
    clip_model = CLIPModel.from_pretrained(MODEL_ID).to(device).eval()
    clip_processor = CLIPProcessor.from_pretrained(MODEL_ID)
    print(f"  ✅  CLIP loaded — image encoder: ViT-B/32")
    print(f"       Embedding dimension: 512")
    print(f"       Training dataset : ~400M image-text pairs (WebImageText)")

    # ── Drone-relevant semantic queries ──────────────────────────────────────
    # In production, these labels describe mission-specific targets.
    # They can be changed at runtime without any retraining.
    semantic_queries = [
        "dense forest canopy viewed from aerial drone",
        "urban cityscape with rooftops and streets",
        "open ocean shoreline with waves",
        "wildfire smoke rising from trees",
        "person lying injured in a field below",
    ]

    # Fetch a sample aerial image (or use a local file in production)
    print("\n  Fetching sample aerial image for zero-shot inference...")
    try:
        url = "https://images.unsplash.com/photo-1506905925257-2beddb45ecca?w=512"
        response = requests.get(url, timeout=10)
        aerial_frame = Image.open(io.BytesIO(response.content)).convert("RGB")
        print(f"  ✅  Image loaded: {aerial_frame.size} px")
    except Exception:
        # Fallback: create a synthetic aerial-like image (gradient)
        import numpy as np
        arr = np.random.randint(40, 120, (512, 512, 3), dtype=np.uint8)
        aerial_frame = Image.fromarray(arr)
        print("  ⚠️   Network unavailable — using synthetic test image")

    # ── CLIPProcessor: joint preprocessing ───────────────────────────────────
    # CLIPProcessor normalizes the image (mean/std from CLIP training data)
    # and tokenizes the text (BPE tokenizer, max 77 tokens).
    # It returns PyTorch tensors ready for the model.
    inputs = clip_processor(
        text=semantic_queries,
        images=aerial_frame,
        return_tensors="pt",
        padding=True,
    )
    # Move all tensors to the target device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # ── Zero-shot inference ───────────────────────────────────────────────────
    # torch.no_grad() is MANDATORY — inference never needs gradient tracking
    with torch.no_grad():
        outputs = clip_model(**inputs)
        # logits_per_image shape: (1, num_labels)
        # This is the dot product of image embedding × each text embedding,
        # scaled by the model's learned temperature parameter (log scale)
        logits = outputs.logits_per_image
        probabilities = logits.softmax(dim=1).flatten().tolist()

    print("\n  ─── Zero-Shot Inference Results ───")
    print(f"  {'Label':<50} {'Confidence':>12}")
    print(f"  {'─'*50} {'─'*12}")
    ranked = sorted(zip(semantic_queries, probabilities), key=lambda x: -x[1])
    for label, prob in ranked:
        bar = "█" * int(prob * 30)
        print(f"  {label:<50} {prob*100:>10.2f}%  {bar}")
    top_label, top_prob = ranked[0]
    print(f"\n  ✅  Prediction: \"{top_label}\" ({top_prob*100:.1f}% confidence)")
    print()
    print("  PRODUCTION NOTES:")
    print("  ✦ Cache text embeddings at startup (clip_model.get_text_features).")
    print("    Re-encoding text per frame wastes ~40% of total inference time.")
    print("  ✦ Run image encoding in a CUDA stream alongside the camera capture")
    print("    pipeline to overlap I/O and compute (zero-copy with GStreamer).")
    print("  ✦ For binary detection: compare image embedding cosine similarity")
    print("    to a threshold (e.g. >0.28) rather than softmax over all labels.")

except ImportError as e:
    print(f"  ⚠️   Skipping CLIP demo — missing library: {e}")
    print("       Install with: pip install transformers Pillow requests")
except Exception as e:
    print(f"  ⚠️   CLIP demo error: {e}")
    print("       This is non-critical — concepts above are the key learnings.")

print()


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Contrastive Training: InfoNCE Loss from Scratch
# ─────────────────────────────────────────────────────────────────────────────

print("━" * 70)
print("STEP 4: Training CLIP with Contrastive (InfoNCE) Loss")
print("━" * 70)
print("""
CONCEPT: The InfoNCE loss (also called NT-Xent in SimCLR) is what makes CLIP
work. Given a batch of N (image, text) pairs, it constructs an N×N similarity
matrix. The diagonal represents correct pairs; all other entries are negatives.

For each image i, we want:
    argmax_j sim(image_i, text_j) = i    (diagonal should be highest)

The loss is symmetric cross-entropy over this matrix:
    L = (CE_image_→_text + CE_text_→_image) / 2

Key insight: the MORE negatives in a batch, the harder the contrastive task,
and the richer the learned representation. Original CLIP used batch size
32,768 across 256 GPUs. On a single Jetson Orin with 16 GB RAM, realistic
fine-tuning batches are 64–256.

Temperature (τ):
  - Controls the sharpness of the similarity distribution
  - Too HIGH (τ=1.0): soft, uniform distribution — model learns slowly
  - Too LOW (τ=0.01): very sharp — gradient explodes on hard negatives
  - Typical sweet spot for drone data: τ=0.07 (OpenAI's CLIP default)
""")


def contrastive_loss(
    image_embeddings: torch.Tensor,
    text_embeddings: torch.Tensor,
    temperature: float = 0.07,
) -> torch.Tensor:
    """
    Symmetric InfoNCE Contrastive Loss (the CLIP training objective).

    Algorithm:
    1. L2-normalize both embedding matrices to the unit hypersphere.
       Cosine similarity then equals the dot product.
    2. Compute the full N×N similarity matrix (logits).
    3. Divide by temperature to control distribution sharpness.
    4. Cross-entropy loss for image→text direction: each image should rank
       its paired text as highest similarity.
    5. Cross-entropy loss for text→image direction: symmetric.
    6. Average the two losses.

    Args:
        image_embeddings : (N, D) — one embedding per image in the batch
        text_embeddings  : (N, D) — one embedding per caption in the batch
        temperature      : τ — sharpness parameter (default 0.07)

    Returns:
        Scalar loss tensor
    """
    N, D = image_embeddings.shape
    assert text_embeddings.shape == (N, D), \
        "image and text batch sizes must match for contrastive pairs"
    assert temperature > 0, "Temperature must be positive"

    # ── Step 1: L2-normalize to unit sphere ─────────────────────────────────
    # After normalization, dot-product == cosine similarity ∈ [-1, +1]
    img_norm = F.normalize(image_embeddings, p=2, dim=1)  # (N, D)
    txt_norm = F.normalize(text_embeddings,  p=2, dim=1)  # (N, D)

    # ── Step 2: Similarity matrix ────────────────────────────────────────────
    # logits[i, j] = cosine_sim(image_i, text_j) / temperature
    # Shape: (N, N) — a square matrix of all pairwise similarities
    logits = (img_norm @ txt_norm.T) / temperature         # (N, N)

    # ── Step 3: Ground truth — diagonal is the correct match ────────────────
    # labels[i] = i  (image i matches text i)
    labels = torch.arange(N, device=image_embeddings.device)

    # ── Step 4 & 5: Symmetric cross-entropy ──────────────────────────────────
    # image → text: for each row i, predict column i as highest
    loss_i2t = F.cross_entropy(logits,   labels)
    # text → image: for each column j, predict row j as highest
    loss_t2i = F.cross_entropy(logits.T, labels)

    return (loss_i2t + loss_t2i) / 2.0


# ── Validate loss behavior ───────────────────────────────────────────────────

print("  Testing InfoNCE loss with synthetic drone sensor embeddings...")
print()

# Case 1: Perfect alignment (identity matrix) — loss should be ~0
print("  Case 1: PERFECT MATCH (identical embeddings)")
BATCH = 32
D_EMB = 512
# Same embeddings → cosine similarity = 1 on diagonal, 0 off-diagonal
perfect_img = F.normalize(torch.randn(BATCH, D_EMB), dim=1)
perfect_txt = perfect_img.clone()  # identical = perfect matching
loss_perfect = contrastive_loss(perfect_img, perfect_txt, temperature=0.07)
print(f"  InfoNCE Loss (perfect match) : {loss_perfect.item():.6f}")
print(f"  Expected: very close to 0.0 ✔" if loss_perfect.item() < 0.01
      else f"  ⚠️  Higher than expected: {loss_perfect.item():.4f}")
print()

# Case 2: Random embeddings — loss should be high (~log(N))
print("  Case 2: RANDOM EMBEDDINGS (no alignment)")
rand_img = torch.randn(BATCH, D_EMB)
rand_txt = torch.randn(BATCH, D_EMB)
loss_random = contrastive_loss(rand_img, rand_txt, temperature=0.07)
theoretical_max = torch.tensor(BATCH, dtype=torch.float).log().item()
print(f"  InfoNCE Loss (random)        : {loss_random.item():.4f}")
print(f"  Theoretical maximum (~log N) : {theoretical_max:.4f}")
print()

# Case 3: Demonstrate temperature sensitivity
print("  Case 3: TEMPERATURE SENSITIVITY (random embeddings)")
for tau in [0.01, 0.07, 0.2, 0.5, 1.0]:
    loss_t = contrastive_loss(rand_img, rand_txt, temperature=tau)
    print(f"    τ={tau:.2f}  →  loss={loss_t.item():.4f}")
print()

# Case 4: Simulate a real training iteration
print("  Case 4: SIMULATED TRAINING ITERATION")
# In practice: image_embeddings = image_encoder(images), etc.
sim_img_emb = torch.randn(BATCH, D_EMB, requires_grad=True)
sim_txt_emb = torch.randn(BATCH, D_EMB, requires_grad=True)

# AdamW: AdamW decouples weight decay from gradient update (better for ViTs)
optimizer = torch.optim.AdamW(
    [sim_img_emb, sim_txt_emb],
    lr=1e-4,
    weight_decay=0.01,  # L2 regularization on weights
    betas=(0.9, 0.98),  # CLIP's original beta values
)

for step in range(3):
    optimizer.zero_grad()
    loss = contrastive_loss(sim_img_emb, sim_txt_emb, temperature=0.07)
    loss.backward()                  # Compute gradients via autograd
    torch.nn.utils.clip_grad_norm_( # Gradient clipping prevents explosions
        [sim_img_emb, sim_txt_emb], max_norm=1.0
    )
    optimizer.step()
    print(f"    Step {step+1}  |  Loss: {loss.item():.4f}  |  "
          f"img_grad_norm: {sim_img_emb.grad.norm().item():.4f}")

print()
print("  PRODUCTION NOTES:")
print("  ✦ Large-batch training (32K+) requires Distributed Data Parallel (DDP)")
print("    torch.nn.parallel.DistributedDataParallel wraps your model and")
print("    automatically syncs gradients across GPUs/nodes after each step.")
print("  ✦ Monitor temperature during training: it should decrease gradually.")
print("    CLIP learns temperature as a trainable log-scale parameter.")
print("  ✦ Gradient clipping (max_norm=1.0) is essential — the InfoNCE loss")
print("    can produce very large gradients when negatives are near the edge")
print("    of the decision boundary.")
print()


# ─────────────────────────────────────────────────────────────────────────────
# SECTION — QUIZ PREPARATION (All 20 questions with answers + explanations)
# ─────────────────────────────────────────────────────────────────────────────

print("━" * 70)
print("QUIZ PREP: All 20 questions — answers with full explanations")
print("━" * 70)
print()

QUIZ = [
    {
        "q": "What is the primary advantage of Vision Transformers (ViT) over CNNs?",
        "a": "ViT can capture global relationships across the entire image",
        "why": (
            "CNNs use small sliding kernels — global context only emerges after many "
            "pooling layers, by which point fine details may be lost. ViTs apply "
            "self-attention over ALL patches from layer 1, so a small pixel region and "
            "the surrounding context are jointly modeled immediately. This is critical "
            "for detecting small objects (persons, cracks) in large drone frames."
        ),
        "wrong": [
            "ViT uses less memory → FALSE: ViTs typically use MORE memory than CNNs.",
            "ViT easier on small datasets → FALSE: CNNs generalize better with <10K images.",
            "ViT requires no positional info → FALSE: positional embeddings are essential.",
        ],
    },
    {
        "q": "In a ViT, what is the purpose of patch embedding?",
        "a": "To convert image patches into token embeddings",
        "why": (
            "Transformers operate on 1D sequences of vectors. Patch embedding takes the "
            "2D grid of image patches and projects each one (via Conv2d or linear layer) "
            "into a D-dimensional embedding vector — turning the image into a sequence "
            "of tokens analogous to word tokens in NLP."
        ),
        "wrong": [
            "To reduce image resolution → FALSE: it chunks, not resizes.",
            "To add positional information → FALSE: that's positional encoding.",
            "To classify the image → FALSE: that's the classification head.",
        ],
    },
    {
        "q": "What does CLIP stand for?",
        "a": "Contrastive Language-Image Pre-training",
        "why": (
            "CLIP is OpenAI's model (Radford et al. 2021) trained with contrastive "
            "learning on 400M image-text pairs. 'Contrastive' refers to the InfoNCE loss "
            "that pulls matching pairs together and pushes non-matching pairs apart in "
            "embedding space. 'Pre-training' because the model is trained on web data "
            "before task-specific fine-tuning."
        ),
        "wrong": [],
    },
    {
        "q": "How does CLIP enable zero-shot classification?",
        "a": "By comparing image embeddings with text embeddings of class names",
        "why": (
            "CLIP maps images and text into the same embedding space. For zero-shot: "
            "(1) encode each class name as text → get text embedding. (2) encode the "
            "query image → get image embedding. (3) find the class whose text embedding "
            "has the highest cosine similarity with the image embedding. No labeled "
            "images of those classes are ever needed."
        ),
        "wrong": [
            "By training on a large dataset with class labels → FALSE: that's supervised.",
            "By using a separate classifier for each class → FALSE: one shared space.",
            "By generating new classes from text → FALSE: it retrieves, doesn't generate.",
        ],
    },
    {
        "q": "What is the shape of the output of the patch embedding layer in the provided ViT?",
        "a": "(batch, num_patches, embed_dim)",
        "why": (
            "For a 224×224 image with patch_size=16: num_patches = (224/16)² = 196. "
            "embed_dim=768 (ViT-Base). So for batch_size=2: shape is (2, 196, 768). "
            "We verified this above: `assert patch_out.shape == (2, 196, 768)`."
        ),
        "wrong": [
            "(batch, channels, height, width) → FALSE: that's the INPUT shape.",
            "(batch, embed_dim, num_patches) → FALSE: dimensions 1 and 2 are swapped.",
            "(batch, num_patches, num_patches) → FALSE: second dim is embed_dim.",
        ],
    },
    {
        "q": "What is the role of the [CLS] token in ViT?",
        "a": "It is used to compute the final classification output",
        "why": (
            "The [CLS] token is a learnable vector prepended to the patch sequence. "
            "Because self-attention is global, by the final Transformer block the [CLS] "
            "token has aggregated information from ALL 196 patch tokens. Only it is "
            "passed to the linear classification head — patch tokens are discarded."
        ),
        "wrong": [
            "Added to each patch for positional encoding → FALSE: positional embeddings do that.",
            "Helps with data augmentation → FALSE: data augmentation is preprocessing.",
            "Replaces the need for a classification head → FALSE: the head is still needed.",
        ],
    },
    {
        "q": "Which loss function is typically used to align image and text embeddings in CLIP?",
        "a": "Contrastive loss (InfoNCE)",
        "why": (
            "InfoNCE (Noise Contrastive Estimation) maximizes agreement between "
            "matching (image, text) pairs and minimizes it for all N²-N non-matching "
            "pairs in the batch. We implemented this in Step 4. Cross-entropy IS used "
            "inside InfoNCE, but applied to the similarity matrix — calling the overall "
            "loss 'cross-entropy' is imprecise."
        ),
        "wrong": [
            "Cross-entropy loss → PARTIALLY CORRECT but imprecise.",
            "Mean squared error → FALSE: MSE doesn't handle relative rankings.",
            "KL divergence → FALSE: KL measures distribution distance, not used here.",
        ],
    },
    {
        "q": "What is the advantage of multi-modal fusion in drone applications?",
        "a": "It allows the drone to understand natural language commands",
        "why": (
            "Multi-modal fusion (image + text) lets an operator describe targets in plain "
            "English ('find injured person in tall grass') without mission-specific "
            "retraining. The shared embedding space enables zero-shot semantic matching "
            "between live camera frames and natural language descriptions."
        ),
        "wrong": [
            "Reduces number of sensors → FALSE: adds complexity, not removes sensors.",
            "Increases flight time → FALSE: unrelated to flight mechanics.",
            "Eliminates need for GPS → FALSE: CLIP doesn't replace navigation.",
        ],
    },
    {
        "q": "What does the 'num_heads' parameter control in MultiHeadSelfAttention?",
        "a": "The number of attention heads to split the embedding dimension into",
        "why": (
            "embed_dim is split into num_heads subspaces, each of size head_dim = "
            "embed_dim / num_heads. For ViT-Base: 768 / 12 = 64 per head. Each head "
            "learns independent Q, K, V projections and attends to different aspects "
            "of the image (edges, color patterns, long-range structure, etc.)."
        ),
        "wrong": [
            "Number of layers in the Transformer → FALSE: that's 'depth'.",
            "Number of patches → FALSE: patches come from img_size and patch_size.",
            "Number of classes → FALSE: that's 'num_classes'.",
        ],
    },
    {
        "q": "What is the purpose of positional encoding in ViT?",
        "a": "To provide information about the spatial location of patches",
        "why": (
            "Self-attention is permutation-invariant — it treats the sequence as a set, "
            "not an ordered list. Without positional embeddings, a ViT could not tell "
            "whether patch [row=0, col=0] (top-left) and patch [row=14, col=14] "
            "(bottom-right) are adjacent or distant. Learnable positional embeddings "
            "encode the spatial index of each patch, preserving layout information."
        ),
        "wrong": [
            "To normalize the input → FALSE: LayerNorm does normalization.",
            "To increase model capacity → FALSE: capacity comes from depth and embed_dim.",
            "To add noise for regularization → FALSE: that is dropout.",
        ],
    },
    {
        "q": "Which of the following is a key difference between ViT and standard CNNs?",
        "a": "ViT processes patches as sequences using attention",
        "why": (
            "CNNs compute local feature maps using sliding convolutional kernels — "
            "they have a strong local inductive bias. ViTs treat the image as a 1D "
            "sequence of patch tokens and use self-attention to compute global "
            "pairwise relationships across all token positions simultaneously."
        ),
        "wrong": [
            "ViT uses convolutional layers for feature extraction → FALSE: patch embed IS conv, but attention is the main computation.",
            "ViT cannot handle variable-sized inputs → FALSE: it CAN with interpolated positional embeddings.",
            "ViT requires more training data but less compute → FALSE: ViTs require MORE compute.",
        ],
    },
    {
        "q": "What is the typical batch size requirement for training CLIP from scratch?",
        "a": "Large (32,768 or more)",
        "why": (
            "InfoNCE loss quality scales with the number of negatives per step. With "
            "batch=32,768, each image has 32,767 text negatives to discriminate against, "
            "creating a rich and challenging contrastive task. OpenAI trained CLIP on "
            "256 A100 GPUs using ~32K effective batch size. Smaller batches can be "
            "compensated with momentum encoders (MoCo-style)."
        ),
        "wrong": [
            "Small (8-16) → FALSE: too few negatives, poor representation learning.",
            "Medium (64-128) → FALSE: adequate for fine-tuning, not from-scratch.",
            "Any size works equally well → FALSE: demonstrated empirically incorrect.",
        ],
    },
    {
        "q": "In the provided ViT implementation, what does the 'mlp_ratio' parameter control?",
        "a": "The ratio of hidden size in MLP to embedding dimension",
        "why": (
            "mlp_ratio=4.0 means the MLP hidden dim = embed_dim × 4 = 768 × 4 = 3072. "
            "This 4× expansion then contracts back to embed_dim=768 via the second "
            "linear layer. Larger mlp_ratio increases model capacity but also memory "
            "footprint — critical to tune for edge deployment."
        ),
        "wrong": [
            "The learning rate schedule → FALSE: unrelated to MLP architecture.",
            "The number of transformer blocks → FALSE: that is 'depth'.",
            "The patch size → FALSE: that is 'patch_size'.",
        ],
    },
    {
        "q": "What does the CLIPProcessor do in Hugging Face's implementation?",
        "a": "It preprocesses images and text into the format expected by the model",
        "why": (
            "CLIPProcessor combines two processors: (1) an image processor that "
            "resizes images to 224×224, normalizes pixel values using CLIP's training "
            "statistics (mean=[0.48,0.46,0.41], std=[0.27,0.27,0.27]), and converts to "
            "tensor; (2) a tokenizer that applies CLIP's BPE tokenizer to text and pads "
            "to the model's max sequence length (77 tokens)."
        ),
        "wrong": [
            "It trains the model → FALSE: training requires separate optimizer/loop.",
            "It evaluates the model's performance → FALSE: that is metrics/eval code.",
            "It generates new text from images → FALSE: that is a generative task.",
        ],
    },
    {
        "q": "What is a common application of CLIP in drone systems?",
        "a": "Natural language query for image retrieval",
        "why": (
            "CLIP's shared embedding space lets you retrieve images matching an arbitrary "
            "text query from a drone's recorded footage without any labels. Example: "
            "search 10 hours of inspection footage for 'visible corrosion near bolt holes' "
            "— no manual labeling or custom model needed."
        ),
        "wrong": [
            "Real-time flight control → FALSE: CLIP is a perception model, not a flight controller.",
            "Battery optimization → FALSE: unrelated to vision-language models.",
            "GPS signal enhancement → FALSE: unrelated to vision models.",
        ],
    },
    {
        "q": "What is the output of the ViT forward method in the code?",
        "a": "Class logits for the entire image (from the [CLS] token)",
        "why": (
            "The final line in our ViT forward: `return self.head(x[:, 0])`. "
            "x[:, 0] selects the [CLS] token (index 0 in the sequence, pre-pended "
            "before the 196 patch tokens). After passing through all Transformer blocks "
            "and LayerNorm, it is projected to (batch, num_classes) by the linear head."
        ),
        "wrong": [
            "Class logits for each patch → FALSE: only the [CLS] token is classified.",
            "Feature maps of the last layer → FALSE: that's CNN terminology.",
            "Attention weights → FALSE: those are internal to MHSA (not returned).",
        ],
    },
    {
        "q": "Which activation function is used in the MLP of the TransformerBlock?",
        "a": "GELU",
        "why": (
            "GELU (Gaussian Error Linear Unit): gelu(x) = x · Φ(x) where Φ is the "
            "cumulative Gaussian. Unlike ReLU, GELU is smooth at x=0 (no sharp kink), "
            "which provides better gradient flow in very deep networks. All major "
            "Transformer architectures (BERT, GPT, ViT) use GELU by default."
        ),
        "wrong": [
            "ReLU → FALSE: ReLU is used in CNNs; Transformers prefer GELU.",
            "Sigmoid → FALSE: Sigmoid saturates at extremes, vanishing gradients.",
            "Tanh → FALSE: Tanh is used in RNNs, not Transformer MLPs.",
        ],
    },
    {
        "q": "What does the 'embed_dim' parameter represent in the VisionTransformer class?",
        "a": "The dimensionality of token embeddings",
        "why": (
            "embed_dim is the size of each token's representation vector throughout the "
            "Transformer (768 for ViT-Base, 1024 for ViT-Large). It is NOT the patch "
            "pixel size (that's patch_size=16). Every patch is linearly projected FROM "
            "its raw pixel values (16×16×3=768) INTO D=embed_dim dimensions. The two "
            "happen to both be 768 in ViT-Base — a coincidence."
        ),
        "wrong": [
            "The size of each patch in pixels → FALSE: that is patch_size.",
            "The number of attention heads → FALSE: that is num_heads.",
            "The number of classes → FALSE: that is num_classes.",
        ],
    },
    {
        "q": "How does multi-modal fusion improve drone safety?",
        "a": "By enabling the drone to interpret both visual and textual instructions for navigation",
        "why": (
            "A pilot can transmit live textual waypoint updates ('avoid the red barn, "
            "proceed to open field north') that the multi-modal AI can parse and fuse "
            "with its live camera feed. This removes the need for strict API-based "
            "mission reprogramming and allows human oversight during autonomous missions."
        ),
        "wrong": [
            "Allows the drone to understand spoken commands → PARTIALLY: text, not audio here.",
            "Reducing the need for obstacle avoidance → FALSE: separate safety system.",
            "Automatically generating flight paths from satellite images → FALSE: path planning is separate.",
        ],
    },
    {
        "q": "What is the purpose of the norm layers (LayerNorm) in the TransformerBlock?",
        "a": "To normalize the input to each sub-layer, improving training stability",
        "why": (
            "LayerNorm computes mean and variance over the embed_dim dimension of each "
            "token independently (NOT over the batch). Applied BEFORE each sub-layer "
            "(Pre-LN) it ensures activations are in a consistent range regardless of "
            "depth. This dramatically reduces sensitivity to learning rate and removes "
            "the need for careful warmup schedules required by Post-LN architectures."
        ),
        "wrong": [
            "To reduce the number of parameters → FALSE: adds only 2D learnable params.",
            "To add dropout → FALSE: dropout is a separate nn.Dropout module.",
            "To convert embeddings to probabilities → FALSE: that's softmax.",
        ],
    },
]


for i, item in enumerate(QUIZ, 1):
    print(f"  Q{i:>2}. {item['q']}")
    print(f"       ✅  Answer: {item['a']}")
    print(f"       📖  Why: {item['why'][:200]}{'...' if len(item['why']) > 200 else ''}")
    if item.get("wrong"):
        for w in item["wrong"][:2]:
            print(f"       ❌  {w}")
    print()


# ─────────────────────────────────────────────────────────────────────────────
# FINAL CHECKLIST
# ─────────────────────────────────────────────────────────────────────────────

print("━" * 70)
print("LESSON 1 COMPLETION CHECKLIST")
print("━" * 70)
print("""
To mark Lesson 1 complete on the platform, you need ALL of:

  STEPS (4 total):
  ☐ Step 1 — Installed PyTorch/transformers; confirmed GPU available
  ☐ Step 2 — Ran ViT forward pass; verified output shape (batch, num_classes)
  ☐ Step 3 — Ran CLIP zero-shot inference; saw ranked probability scores
  ☐ Step 4 — Ran contrastive loss; observed loss decreasing over steps

  QUIZ (20 questions, 70%+ to pass):
  ☐ Review all 20 Q&A above until you can answer without looking
  ☐ Key facts to memorize:
      - Output shape of patch_embed: (batch, num_patches, embed_dim)
      - Activation in MLP block     : GELU
      - [CLS] token purpose         : global classification vector
      - CLIP training batch size    : 32,768+
      - Loss function               : InfoNCE (contrastive, symmetric CE)
      - Why torch.no_grad()         : saves memory by disabling gradient graph
      - Temperature τ sweet spot    : ~0.07 for drone contrastive tasks

  EXECUTION PROOF:
  ☐ Paste your terminal output from running this script into the proof box
    (any output containing "✅" lines is sufficient proof)

  NOTES BOX (optional but recommended):
  ☐ Write 2–3 lines on how you would apply CLIP to a real mission scenario
    you care about (SAR, inspection, agriculture, public safety, etc.)
""")
print("=" * 70)
print("  Script complete. Good luck on the quiz!")
print("=" * 70)
