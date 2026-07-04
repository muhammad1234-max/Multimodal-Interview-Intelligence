
import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.scoring_ann import InterviewScoringANN


def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "scoring_training_data.csv")
    if not os.path.exists(csv_path):
        print(f"Training data not found at {csv_path}")
        return
        
    feature_cols = [f'feature_{i}' for i in range(20)]
    col_names = feature_cols + ['score']
    df = pd.read_csv(csv_path, header=None, names=col_names)
    
    feature_cols = [col for col in df.columns if col != 'score']
    X = df[feature_cols].values
    y = df['score'].values

    # ── CRITICAL FIX: normalise labels to [0, 1] for sigmoid output ──────────
    # The ANN output layer uses sigmoid, so targets must be in [0, 1].
    y_normalized = y / 100.0
    
    X_train, X_val, y_train, y_val = train_test_split(X, y_normalized, test_size=0.2, random_state=42)
    
    # ── CRITICAL FIX: save the scaler alongside weights ────────────────────────
    # Without this, inference cannot apply the same StandardScaler transformation
    # that training used, causing a feature distribution mismatch.
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    scaler_path = os.path.join(os.path.dirname(__file__), "..", "weights", "scoring_scaler.pkl")
    os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    print(f"Scaler saved to {scaler_path}")
    
    X_train_tensor = torch.tensor(X_train_scaled, dtype=torch.float32)
    y_train_tensor = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
    X_val_tensor = torch.tensor(X_val_scaled, dtype=torch.float32)
    y_val_tensor = torch.tensor(y_val, dtype=torch.float32).unsqueeze(1)
    
    model = InterviewScoringANN(input_size=X.shape[1]).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    epochs = 100
    batch_size = 32
    best_val_loss = float('inf')
    patience = 10
    patience_counter = 0
    
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
            val_loss = criterion(val_outputs, y_val_tensor.to(device)).item()
            
        log_str = f"Scoring ANN - Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}, Val Loss: {val_loss:.4f}"
        print(log_str)
        with open('training_log.txt', 'a', encoding='utf-8') as f:
            f.write(log_str + "\n")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_path = os.path.join(os.path.dirname(__file__), "..", "weights", "scoring_ann.pt")
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            torch.save(model.state_dict(), save_path)
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                log_stop = f"Early stopping at epoch {epoch+1}"
                print(log_stop)
                with open('training_log.txt', 'a', encoding='utf-8') as f:
                    f.write(log_stop + "\n")
                break
            
    print(f"Training complete. Best val loss: {best_val_loss:.4f}")
    with open('training_log.txt', 'a', encoding='utf-8') as f:
        f.write(f"Scoring ANN Training complete. Best val loss: {best_val_loss:.4f}\n")


if __name__ == "__main__":
    main()
