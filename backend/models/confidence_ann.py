
import torch
import torch.nn as nn
import torch.nn.functional as F


class ConfidenceANN(nn.Module):
    def __init__(self, input_size: int = 20, num_classes: int = 3):
        super(ConfidenceANN, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, num_classes)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x
    
    def predict(self, x: torch.Tensor) -> int:
        self.eval()
        with torch.no_grad():
            outputs = self.forward(x)
            _, predicted = torch.max(outputs, 1)
        return predicted.item()
