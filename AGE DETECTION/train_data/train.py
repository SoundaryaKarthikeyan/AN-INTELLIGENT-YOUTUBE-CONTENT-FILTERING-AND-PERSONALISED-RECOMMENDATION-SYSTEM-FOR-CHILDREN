import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

from model import get_model
from utils import evaluate

# =====================
# CONFIG
# =====================

TRAIN_DIR = "/content/dataset/train"
VAL_DIR = "/content/dataset/val"

BATCH_SIZE = 32
EPOCHS = 50
LR = 0.0001

# =====================

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# Transforms
transform_train = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
])

transform_val = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# Dataset using ImageFolder
train_dataset = datasets.ImageFolder(root=TRAIN_DIR, transform=transform_train)
val_dataset = datasets.ImageFolder(root=VAL_DIR, transform=transform_val)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

num_classes = len(train_dataset.classes)
print("Number of classes:", num_classes)

# Model
model = get_model(num_classes)
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LR)

# =====================
# TRAINING LOOP
# =====================

for epoch in range(EPOCHS):

    model.train()
    total_loss = 0

    for images, labels in train_loader:
        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    val_acc = evaluate(model, val_loader, device)

    print(f"Epoch [{epoch+1}/{EPOCHS}]")
    print(f"Train Loss: {total_loss:.4f}")
    print(f"Validation Accuracy: {val_acc:.2f}%")
    print("---------------")

# Save model
torch.save(model.state_dict(), "age_model_99class.pth")
print("Model saved successfully.")