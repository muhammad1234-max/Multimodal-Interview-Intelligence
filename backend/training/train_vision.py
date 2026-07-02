import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import cv2
import numpy as np
import sys

# Add parent directory to path to import vision.py
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from pipeline.vision import EmotionCNN

class FERDataset(Dataset):
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.samples = []
        
        # Mapping FER folders to our 4 target classes: 0: happy, 1: sad, 2: neutral, 3: anxious
        self.label_map = {
            'happy': 0,
            'sad': 1,
            'neutral': 2,
            'fear': 3,
            'angry': 3,     # Grouping negative high-arousal into anxious
            'disgust': 3,
            'surprise': 3
        }
        
        print("Scanning image directory...")
        for emotion_folder in os.listdir(data_dir):
            if emotion_folder not in self.label_map:
                continue
                
            folder_path = os.path.join(data_dir, emotion_folder)
            if not os.path.isdir(folder_path):
                continue
                
            target_label = self.label_map[emotion_folder]
            
            # Limit samples per class to speed up training on CPU
            files = os.listdir(folder_path)[:500] 
            for file in files:
                if file.endswith('.jpg') or file.endswith('.png'):
                    self.samples.append((os.path.join(folder_path, file), target_label))
                    
        print(f"Loaded {len(self.samples)} images for training.")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        # Read grayscale
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            # Fallback to zero tensor if read fails
            return torch.zeros((1, 48, 48), dtype=torch.float32), torch.tensor(label, dtype=torch.long)
            
        img = cv2.resize(img, (48, 48))
        img = img / 255.0
        # Add channel dimension
        tensor_img = torch.tensor(img, dtype=torch.float32).unsqueeze(0)
        return tensor_img, torch.tensor(label, dtype=torch.long)

def train():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training Vision CNN on device: {device}")
    
    # Path to the FER dataset (misnamed textdata)
    data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'textdata', 'train')
    
    dataset = FERDataset(data_dir)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    model = EmotionCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    epochs = 5
    with open('training_log.txt', 'a') as f:
        f.write("\n=== Vision CNN Training ===\n")
        
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for i, (inputs, labels) in enumerate(dataloader):
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        accuracy = 100 * correct / total
        avg_loss = running_loss / len(dataloader)
        
        log_str = f"Vision CNN - Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}, Acc: {accuracy:.2f}%"
        print(log_str)
        with open('training_log.txt', 'a') as f:
            f.write(log_str + "\n")
            
    # Save the model
    weights_dir = os.path.join(os.path.dirname(__file__), '..', 'weights')
    os.makedirs(weights_dir, exist_ok=True)
    save_path = os.path.join(weights_dir, 'emotion_cnn.pt')
    torch.save(model.state_dict(), save_path)
    print(f"Vision CNN saved to {save_path}")
    
    with open('training_log.txt', 'a') as f:
        f.write("Vision CNN training complete.\n")

if __name__ == "__main__":
    train()
