
import torch
import torch.nn as nn
import torch.nn.functional as F


class InterviewScoringANN(nn.Module):
    def __init__(self, input_size: int = 20):
        super(InterviewScoringANN, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 1)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x
    
    def predict(self, x: torch.Tensor) -> float:
        self.eval()
        with torch.no_grad():
            output = self.forward(x)
        return output.item()
