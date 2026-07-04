import os
import glob

# Fix for Windows: disable HuggingFace tokenizers parallelism and restrict
# OpenMP threads to prevent segfaults from llvmlite/numba vs PyTorch conflict
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"

# Add ffmpeg to PATH — winget installs it here but doesn't update the
# current process's environment until a new shell is opened.
_ffmpeg_patterns = [
    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-*\bin"),
    r"C:\ffmpeg\bin",
    r"C:\Program Files\ffmpeg\bin",
]
for _pattern in _ffmpeg_patterns:
    _matches = glob.glob(_pattern)
    if _matches:
        _ffmpeg_bin = _matches[0]
        if _ffmpeg_bin not in os.environ["PATH"]:
            os.environ["PATH"] = _ffmpeg_bin + os.pathsep + os.environ["PATH"]
            print(f"[start_server] Added ffmpeg to PATH: {_ffmpeg_bin}")
        break

import uvicorn

if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, workers=1)

