
import whisper
import librosa
import numpy as np
import tempfile
import os
from typing import Dict, Tuple


def extract_audio_features(audio_path: str, sample_rate: int = 16000) -> Dict:
    y, sr = librosa.load(audio_path, sr=sample_rate)
    duration = librosa.get_duration(y=y, sr=sr)
    
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfccs, axis=1)
    
    pitch = librosa.yin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=sr)
    pitch_variance = np.var(pitch)
    
    energy = np.mean(librosa.feature.rms(y=y))
    
    syllable_count = len([x for x in librosa.onset.onset_detect(y=y, sr=sr)])
    speech_rate = syllable_count / duration if duration > 0 else 0
    
    return {
        'mfcc_mean': mfcc_mean.tolist(),
        'pitch_variance': float(pitch_variance),
        'energy': float(energy),
        'speech_rate': float(speech_rate),
        'duration': float(duration)
    }


def transcribe_audio(audio_path: str, model_size: str = "tiny") -> str:
    model = whisper.load_model(model_size)
    result = model.transcribe(audio_path)
    return result['text'].strip()


def process_audio(video_path: str, model_size: str = "tiny") -> Tuple[str, Dict]:
    temp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    temp_wav.close()
    
    try:
        import subprocess
        import shutil
        import glob

        # Resolve ffmpeg: check PATH first, then known winget/manual install locations
        ffmpeg_cmd = shutil.which('ffmpeg')
        if not ffmpeg_cmd:
            _candidates = [
                os.path.expandvars(
                    r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-*\bin\ffmpeg.exe"
                ),
                r"C:\ffmpeg\bin\ffmpeg.exe",
                r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
                r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe",
                os.path.abspath('ffmpeg.exe'),
                os.path.abspath('backend/ffmpeg.exe'),
            ]
            for _pattern in _candidates:
                _matches = glob.glob(_pattern)
                if _matches and os.path.exists(_matches[0]):
                    ffmpeg_cmd = _matches[0]
                    break
        if not ffmpeg_cmd:
            raise FileNotFoundError(
                "ffmpeg not found. Please install it via: winget install Gyan.FFmpeg"
            )

        subprocess.run(
            [ffmpeg_cmd, '-y', '-i', video_path, '-vn',
             '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', temp_wav.name],
            capture_output=True, check=True
        )
        
        transcription = transcribe_audio(temp_wav.name, model_size)
        features = extract_audio_features(temp_wav.name)
        
        return transcription, features
    finally:
        if os.path.exists(temp_wav.name):
            os.unlink(temp_wav.name)
