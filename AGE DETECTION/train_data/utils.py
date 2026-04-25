import torch

def evaluate(model, loader, device):
    model.eval()
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            _, predicted = torch.max(outputs, 1)

            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    return 100 * correct / total


def predict_exact_age(output):
    _, predicted = torch.max(output, 1)
    return predicted.item() + 1  # convert class index to real age


def age_to_bucket(age):
    if age <= 12:
        return "0-12"
    elif age <= 19:
        return "13-19"
    elif age <= 35:
        return "20-35"
    elif age <= 50:
        return "36-50"
    else:
        return "50+"