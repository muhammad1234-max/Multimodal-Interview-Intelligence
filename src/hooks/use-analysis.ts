// Simple persistence for analysis results

export interface AudioFeatures {
  mfcc_mean: number[];
  pitch_variance: number;
  energy: number;
  speech_rate: number;
  duration: number;
}

export interface Feedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface ApiResults {
  transcription?: string;
  relevance?: number;
  sentiment?: number;
  emotion_probs?: Record<string, number>;
  confidence_class?: number;
  confidence_label?: string;
  confidence_probability?: number;
  final_score?: number;
  audio_features?: AudioFeatures;
  weights_loaded: boolean;
  model_status?: Record<
    string,
    { status: string; reason: string | null; inference_time_ms?: number; version?: string }
  >;
  /** MongoDB session ID returned by the server after a successful save */
  session_id?: string | null;
  developer_payload?: any;
  /** Server-generated feedback stored in MongoDB, passed through to avoid recomputing */
  feedback?: Feedback;
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
