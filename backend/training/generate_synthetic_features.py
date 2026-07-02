import os
import sys
import random
import csv
import json

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from pipeline.speech import extract_audio_features
from pipeline.nlp import NLPProcessor

def generate():
    print("Initializing synthetic feature generator...")
    data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
    
    # 1. Load Audio Paths (TESS)
    audio_dir = os.path.join(data_dir, 'audiosamplesdata')
    audio_files = []
    if os.path.exists(audio_dir):
        for f in os.listdir(audio_dir):
            if f.endswith('.wav'):
                audio_files.append(os.path.join(audio_dir, f))
    
    # 2. Load Vision (FER) - We won't run CNN, we'll simulate the output based on the folder label for speed
    vision_dir = os.path.join(data_dir, 'textdata', 'train')
    vision_samples = []
    label_map = {'happy': 0, 'sad': 1, 'neutral': 2, 'fear': 3, 'angry': 3, 'disgust': 3, 'surprise': 3}
    if os.path.exists(vision_dir):
        for emotion in os.listdir(vision_dir):
            if emotion in label_map:
                vision_samples.append(emotion) # Just store the emotion to synthesize the 4-prob vector
    
    # 3. Load Text (IMDB)
    text_csv = os.path.join(data_dir, 'picturesdata', 'IMDB Dataset.csv')
    text_samples = []
    if os.path.exists(text_csv):
        with open(text_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader) # skip header
            for idx, row in enumerate(reader):
                if idx >= 2000: # Limit to 2000 for speed
                    break
                text_samples.append({'text': row[0][:200], 'sentiment': row[1]}) # truncate text for speed
                
    if not audio_files or not vision_samples or not text_samples:
        print("Error: Could not find all required datasets.")
        return
        
    print(f"Loaded {len(audio_files)} audio, {len(vision_samples)} vision, and {len(text_samples)} text samples.")
    
    nlp_processor = NLPProcessor()
    
    num_samples = 1000 # Generate 1000 paired rows
    scoring_data = []
    confidence_data = []
    
    with open('training_log.txt', 'a', encoding='utf-8') as f:
        f.write("\n=== Generating Synthetic Multimodal Features ===\n")
    
    for i in range(num_samples):
        # Randomly select one from each
        audio = random.choice(audio_files)
        vision_emotion = random.choice(vision_samples)
        text = random.choice(text_samples)
        
        # 1. Extract Speech Features (MFCCs)
        try:
            audio_feats = extract_audio_features(audio)
            mfcc = audio_feats['mfcc_mean'][:13]
            pitch_var = audio_feats['pitch_variance']
            energy = audio_feats['energy']
            speech_rate = audio_feats['speech_rate']
        except Exception:
            mfcc = [0.0] * 13 # Fallback
            pitch_var = 0.0
            energy = 0.0
            speech_rate = 0.0
            
        # 2. Synthesize Vision Features (4-prob vector) based on actual class
        v_probs = [0.1, 0.1, 0.1, 0.1]
        target_idx = label_map[vision_emotion]
        v_probs[target_idx] = 0.7 # High probability for the actual emotion
        
        # 3. Extract NLP Features
        candidate_text = text['text']
        reference_text = "The ideal candidate has strong skills."
        relevance = nlp_processor.compute_relevance(candidate_text, reference_text)
        sentiment_score = nlp_processor.compute_sentiment(candidate_text)
        
        # Compile the 20-D Feature Vector
        # [relevance, sentiment, happy, sad, neutral, anxious, confidence_class, mfcc (13)]
        
        # Determine synthetic targets based on heuristics
        is_positive = (text['sentiment'] == 'positive')
        is_happy = (target_idx == 0)
        is_anxious = (target_idx == 3)
        
        # Confidence Class (0: low, 1: med, 2: high)
        if is_happy and is_positive:
            confidence = 2
        elif is_anxious:
            confidence = 0
        else:
            confidence = 1
            
        # Interview Score (0-100)
        score = 50.0 + (relevance * 20) + (sentiment_score * 20)
        if confidence == 2: score += 10
        elif confidence == 0: score -= 15
        score = min(100.0, max(0.0, score))
        
        # Row for ScoringANN (includes confidence as a feature)
        score_row = [relevance, sentiment_score, v_probs[0], v_probs[1], v_probs[2], v_probs[3], float(confidence)] + mfcc + [score]
        scoring_data.append(score_row)
        
        # Row for ConfidenceANN (does not include score)
        conf_row = mfcc + [pitch_var, energy, speech_rate, v_probs[0], v_probs[1], v_probs[2], v_probs[3], confidence]
        confidence_data.append(conf_row)
        
        if (i+1) % 100 == 0:
            log_str = f"Generated {i+1}/{num_samples} feature rows..."
            print(log_str)
            with open('training_log.txt', 'a', encoding='utf-8') as f:
                f.write(log_str + "\n")
                
    # Save CSVs
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(out_dir, exist_ok=True)
    
    scoring_csv = os.path.join(out_dir, 'scoring_training_data.csv')
    with open(scoring_csv, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(scoring_data)
        
    conf_csv = os.path.join(out_dir, 'confidence_training_data.csv')
    with open(conf_csv, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(confidence_data)
        
    print(f"Successfully saved synthetic datasets to {out_dir}")
    with open('training_log.txt', 'a', encoding='utf-8') as f:
        f.write("Synthetic data generation complete.\n")

if __name__ == "__main__":
    generate()
