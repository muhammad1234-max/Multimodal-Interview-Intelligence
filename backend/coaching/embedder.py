"""
Embedder — Generates local text embeddings using a lightweight Hugging Face model
(sentence-transformers/all-MiniLM-L6-v2) via the transformers library.

No external APIs required. Runs locally on CPU/GPU.
Lazy-loaded to prevent memory consumption on import.
"""
from typing import List
import torch

_tokenizer = None
_model = None
_device = None


def _get_resources():
    global _tokenizer, _model, _device
    if _model is None:
        from transformers import AutoTokenizer, AutoModel

        # sentence-transformers/all-MiniLM-L6-v2 produces high quality 384-dimensional embeddings
        model_name = "sentence-transformers/all-MiniLM-L6-v2"
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModel.from_pretrained(model_name)

        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _model.to(_device)
        _model.eval()

    return _tokenizer, _model, _device


def generate_embedding(text: str) -> List[float]:
    """
    Generate a 384-dimensional vector embedding for the input text.
    Uses mean pooling over token representations.
    """
    tokenizer, model, device = _get_resources()

    # Preprocess text
    inputs = tokenizer(
        text,
        padding=True,
        truncation=True,
        max_length=512,
        return_tensors="pt"
    )
    # Move to GPU if available
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        model_output = model(**inputs)

    # Perform Mean Pooling
    token_embeddings = model_output[0]  # First element contains all token embeddings
    attention_mask = inputs["attention_mask"]
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
    sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    pooled = sum_embeddings / sum_mask

    # Normalize embeddings to unit length (L2 norm)
    normalized = torch.nn.functional.normalize(pooled, p=2, dim=1)

    return normalized[0].tolist()
