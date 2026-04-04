import torch
import torch.nn as nn
from torchvision.models import vit_b_16

def get_model():
    model = vit_b_16(pretrained=True)
    model.heads = nn.Linear(768, 2) # Smoke vs No Smoke
    return model

if __name__ == '__main__':
    model = get_model()
    print("Model initialized. Ready for DistributedDataParallel training.")
