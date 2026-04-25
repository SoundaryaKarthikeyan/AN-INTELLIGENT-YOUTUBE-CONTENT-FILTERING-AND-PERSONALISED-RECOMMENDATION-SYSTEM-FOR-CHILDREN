import torch
import random
from torchvision import datasets, transforms
from model import get_model

# ------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# ---------------------
train_dataset = datasets.ImageFolder(
    root="../dataset/train"
)

num_classes = len(train_dataset.classes)
print("Detected number of classes (from train):", num_classes)

# ----------------
model = get_model(num_classes)
model = model.to(device)

# ---------
model.load_state_dict(
 torch.load("../age_model_99class.pth", map_location=torch.device('cpu'))
)
model.eval()

print("Model loaded successfully.\n")

# -------------------
val_dataset = datasets.ImageFolder(
    root="../dataset/train",
    transform=transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])
)

img, label = random.choice(val_dataset)

img_tensor = img.unsqueeze(0).to(device)

with torch.no_grad():
    output = model(img_tensor)

predicted_index = output.argmax(1).item()

predicted_age = int(train_dataset.classes[predicted_index])
true_age = int(val_dataset.classes[label])

print("True age:", true_age)
print("Predicted age:", predicted_age)
print("Absolute error:", abs(true_age - predicted_age))