
import torch
import torch.nn as nn
import torch.nn.functional as F


class InterviewScoringANN(nn.Module):
    """
    Regression ANN that predicts an interview score in [0, 1].
    Callers multiply the output by 100 to get the [0, 100] display range.

    Architecture fix (2025-07):
    ────────────────────────────
    The original fc3 output had no activation, allowing raw values to grow
    without bound when feature scales deviated from training distribution.
    A sigmoid activation on the output layer mathematically constrains the
    output to (0, 1), making overflow impossible regardless of input scale.
    """

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
        # Sigmoid bounds the output to (0, 1). Multiply by 100 at the call site.
        x = torch.sigmoid(self.fc3(x))
        return x
    
    def predict(self, x: torch.Tensor) -> float:
        """Returns a score in [0, 100]."""
        self.eval()
        with torch.no_grad():
            output = self.forward(x)
        # Scale sigmoid output [0,1] → [0, 100]
        return output.item() * 100.0
