import os
import torch
from torch.utils.data import Dataset
from PIL import Image

class AgeDataset(Dataset):
    def __init__(self, image_dir, label_dir, transform=None):
        self.image_dir = image_dir
        self.label_dir = label_dir
        self.transform = transform
        self.images = os.listdir(image_dir)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_name = self.images[idx]
        img_path = os.path.join(self.image_dir, img_name)

        # change extension if needed
        label_name = img_name.replace(".jpg", ".txt")
        label_path = os.path.join(self.label_dir, label_name)

        image = Image.open(img_path).convert("RGB")

        with open(label_path, "r") as f:
            age = int(f.read().strip())

        label = age - 1  # convert 1–99 to 0–98

        if self.transform:
            image = self.transform(image)

        return image, torch.tensor(label)