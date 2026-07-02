
import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.confidence_ann import ConfidenceANN


def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "confidence_training_data.csv")
    if not os.path.exists(csv_path):
        print(f"Training data not found at {csv_path}")
        return
        
    feature_cols = [f'feature_{i}' for i in range(20)]
    col_names = feature_cols + ['label']
    df = pd.read_csv(csv_path, header=None, names=col_names)
    
    feature_cols = [f'feature_{i}' for i in range(20)]
    X = df[feature_cols].values
    y = df['label'].values
    
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    X_train_tensor = torch.tensor(X_train_scaled, dtype=torch.float32)
    y_train_tensor = torch.tensor(y_train, dtype=torch.long)
    X_val_tensor = torch.tensor(X_val_scaled, dtype=torch.float32)
    y_val_tensor = torch.tensor(y_val, dtype=torch.long)
    
    model = ConfidenceANN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    epochs = 100
    batch_size = 32
    best_val_acc = 0.0
    
    for epoch in range(epochs):
        model.train()
        permutation = torch.randperm(X_train_tensor.size()[0])
        
        for i in range(0, X_train_tensor.size()[0], batch_size):
            optimizer.zero_grad()
            
            indices = permutation[i:i+batch_size]
            batch_x, batch_y = X_train_tensor[indices].to(device), y_train_tensor[indices].to(device)
            
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            
            loss.backward()
            optimizer.step()
            
        model.eval()
        with torch.no_grad():
            val_outputs = model(X_val_tensor.to(device))
            _, val_preds = torch.max(val_outputs, 1)
            val_acc = (val_preds == y_val_tensor.to(device)).float().mean().item()
            
        log_str = f"Confidence ANN - Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}, Val Acc: {val_acc:.4f}"
        print(log_str)
        with open('training_log.txt', 'a', encoding='utf-8') as f:
            f.write(log_str + "\n")
        
        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            save_path = os.path.join(os.path.dirname(__file__), "..", "weights", "confidence_ann.pt")
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            torch.save(model.state_dict(), save_path)
            
    print(f"Training complete. Best val accuracy: {best_val_acc:.4f}")
    with open('training_log.txt', 'a', encoding='utf-8') as f:
        f.write(f"Confidence ANN Training complete. Best val accuracy: {best_val_acc:.4f}\n")


if __name__ == "__main__":
    main()
