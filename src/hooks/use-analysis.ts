// Simple persistence for analysis results

export interface AudioFeatures {
  mfcc_mean: number[];
  pitch_variance: number;
  energy: number;
  speech_rate: number;
  duration: number;
}

export interface ApiResults {
  transcription: string;
  relevance: number;
  sentiment: number;
  emotion_probs: Record<string, number>;
  confidence_class: number;
  confidence_label: string;
  final_score: number;
  audio_features?: AudioFeatures;
  weights_loaded: boolean;
}

interface AnalysisState {
  results: ApiResults | null;
  isProcessing: boolean;
  setResults: (results: ApiResults | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

let memoryResults: ApiResults | null = null;

export const setAnalysisResults = (results: ApiResults | null) => {
  memoryResults = results;
};

export const clearAnalysisResults = () => {
  memoryResults = null;
};

export const getAnalysisResults = (): ApiResults | null => {
  return memoryResults;
};
