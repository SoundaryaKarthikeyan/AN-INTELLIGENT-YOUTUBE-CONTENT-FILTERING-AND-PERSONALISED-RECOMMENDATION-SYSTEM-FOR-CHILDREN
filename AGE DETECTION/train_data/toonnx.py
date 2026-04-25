import torch
from model import get_model
from torchvision import datasets

device = torch.device("cpu")

# IMPORTANT: use train folder for class count
train_dataset = datasets.ImageFolder("../dataset/train")
num_classes = len(train_dataset.classes)

model = get_model(num_classes)
model.load_state_dict(torch.load("../model/age_model_99class.pth", map_location=device))
model.eval()

dummy_input = torch.randn(1, 3, 224, 224)

torch.onnx.export(
    model,
    dummy_input,
    "age_model.onnx",
    input_names=["input"],
    output_names=["output"],
    opset_version=11
)

print("ONNX model exported successfully.")