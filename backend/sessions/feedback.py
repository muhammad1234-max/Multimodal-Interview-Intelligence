"""
Server-side feedback generator — a direct port of the generateFeedback()
function from src/routes/results.tsx so the logic lives in one place (here)
and is stored alongside the rest of the analysis results.

The frontend no longer needs to recompute this; it simply reads what was stored.
"""
from .models import FeedbackModel, ExplanationsModel, MetricExplanation


def generate_feedback(
    final_score: float,
    relevance: float,
    sentiment: float,
    confidence_label: str,
    emotion_probs: dict[str, float],
    speech_rate: float | None = None,
) -> FeedbackModel:
    """
    Compute strengths, weaknesses, and actionable suggestions from raw
    pipeline outputs. Mirrors generateFeedback() in results.tsx exactly.
    """
    strengths: list[str] = []
    weaknesses: list[str] = []
    suggestions: list[str] = []

    # ── Relevance ─────────────────────────────────────────────────────────────
    if relevance >= 0.70:
        strengths.append("Answer was on-topic and addressed the question well.")
    else:
        weaknesses.append("Answer could be more focused on the question asked.")

    # ── Sentiment / tone ──────────────────────────────────────────────────────
    if sentiment >= 0.65:
        strengths.append("Positive and confident tone in your response.")
    else:
        weaknesses.append("Tone came across as hesitant or neutral.")
        suggestions.append("Practice speaking with more enthusiasm and conviction.")

    # ── Vocal confidence ──────────────────────────────────────────────────────
    if confidence_label == "High":
        strengths.append("Strong vocal confidence detected across the interview.")
    elif confidence_label == "Medium":
        suggestions.append(
            "Build on your confidence — try rehearsing aloud before interviews."
        )
    else:
        weaknesses.append(
            "Low vocal confidence detected — focus on steady pacing and clear enunciation."
        )

    # ── Facial emotion ────────────────────────────────────────────────────────
    happy = emotion_probs.get("happy", 0.0)
    anxious = emotion_probs.get("anxious", 0.0)

    if happy > 0.4:
        strengths.append("Friendly and approachable facial expressions.")
    if anxious > 0.35:
        weaknesses.append("Some nervousness visible in your facial expressions.")

    # ── Speech rate ───────────────────────────────────────────────────────────
    if speech_rate is not None:
        if speech_rate > 4.5:
            weaknesses.append(
                "Speech rate was a bit fast — slow down slightly for clarity."
            )
        elif speech_rate < 1.5:
            weaknesses.append(
                "Speech was quite slow — try maintaining a brisker pace."
            )
        else:
            strengths.append("Speech pace was clear and well-measured.")

    # ── Score-based suggestions ───────────────────────────────────────────────
    if final_score < 50:
        suggestions.append(
            "Practice the STAR method (Situation, Task, Action, Result) "
            "for structured answers."
        )
    if final_score < 70:
        suggestions.append(
            "Record yourself answering common interview questions and review "
            "the playback."
        )
    if relevance < 0.60:
        suggestions.append(
            "Before answering, take a moment to identify the key skills the "
            "question is testing."
        )
    if happy < 0.3:
        suggestions.append(
            "Smile naturally — it builds rapport and conveys confidence."
        )

    return FeedbackModel(
        strengths=strengths,
        weaknesses=weaknesses,
        suggestions=suggestions,
    )


def generate_explanations(
    final_score: float | None,
    relevance: float | None,
    sentiment: float | None,
    confidence_label: str | None,
    emotion_probs: dict[str, float] | None,
    speech_rate: float | None = None,
) -> ExplanationsModel:
    """
    Generate human-readable explanations for all AI metrics, handling None gracefully.
    """
    
    # ── Speech ─────────────────────────────────────────────────────────────
    speech_exp = None
    if speech_rate is not None:
        if speech_rate > 4.5:
            speech_exp = MetricExplanation(
                score_label="Fast",
                explanation="We measured your speaking rate in syllables per second. A clear, steady pace ensures your interviewer can easily follow your logic.",
                recommendation="Slow down slightly during technical explanations."
            )
        elif speech_rate < 1.5:
            speech_exp = MetricExplanation(
                score_label="Slow",
                explanation="We measured your speaking rate in syllables per second. A brisk, engaged pace keeps the listener's attention.",
                recommendation="Try to maintain a slightly brisker pace while answering."
            )
        else:
            speech_exp = MetricExplanation(
                score_label="Good",
                explanation="We measured your speaking rate in syllables per second. You spoke at a comfortable, natural pace.",
                recommendation="Maintain this steady delivery in future interviews."
            )
    else:
        speech_exp = MetricExplanation(score_label="N/A", explanation="Analysis incomplete.", recommendation="Check model status.")

    # ── Confidence ──────────────────────────────────────────────────────────
    conf_exp = None
    if confidence_label:
        if confidence_label == "High":
            conf_exp = MetricExplanation(
                score_label="High",
                explanation="Our dual ANN models analyzed the tonal and acoustic qualities of your voice to predict perceived confidence.",
                recommendation="Excellent. Keep using clear, strong projection."
            )
        elif confidence_label == "Medium":
            conf_exp = MetricExplanation(
                score_label="Medium",
                explanation="Our models analyzed the tonal qualities of your voice. You sounded relatively confident but with some hesitation.",
                recommendation="Rehearse aloud to build muscle memory and increase vocal certainty."
            )
        else:
            conf_exp = MetricExplanation(
                score_label="Low",
                explanation="Our acoustic analysis detected markers often associated with nervousness or hesitation.",
                recommendation="Focus on steady breathing and speaking with conviction."
            )
    else:
        conf_exp = MetricExplanation(score_label="N/A", explanation="Analysis incomplete.", recommendation="Check model status.")

    # ── Emotion ─────────────────────────────────────────────────────────────
    emotion_exp = None
    if emotion_probs:
        happy = emotion_probs.get("happy", 0.0)
        anxious = emotion_probs.get("anxious", 0.0)
        dominant = max(emotion_probs.items(), key=lambda x: x[1])[0] if emotion_probs else "neutral"
        
        if happy > 0.4:
            emotion_exp = MetricExplanation(
                score_label="Approachable",
                explanation="We used facial landmark tracking to identify your dominant visual expressions. Friendly expressions build rapport.",
                recommendation="Keep smiling naturally to project warmth."
            )
        elif anxious > 0.35 or dominant == "anxious":
            emotion_exp = MetricExplanation(
                score_label="Tense",
                explanation="We tracked micro-expressions across your face. Some tension or nervousness was visible.",
                recommendation="Relax your facial muscles and try to maintain a neutral or pleasant expression."
            )
        else:
            emotion_exp = MetricExplanation(
                score_label="Neutral",
                explanation="Your facial expressions remained relatively composed and neutral throughout the response.",
                recommendation="A neutral expression is fine, but adding a slight smile can make you appear more engaged."
            )
    else:
        emotion_exp = MetricExplanation(score_label="N/A", explanation="Analysis incomplete.", recommendation="Check model status.")

    # ── Relevance ───────────────────────────────────────────────────────────
    relevance_exp = None
    if relevance is not None:
        if relevance >= 0.70:
            relevance_exp = MetricExplanation(
                score_label="Strong",
                explanation="We used semantic NLP embeddings to measure how completely your transcript answered the core question.",
                recommendation="Great job staying on topic."
            )
        elif relevance >= 0.40:
            relevance_exp = MetricExplanation(
                score_label="Partial",
                explanation="Your answer shared some semantic overlap with the question but may have drifted off-topic.",
                recommendation="Structure your answers with the STAR method to stay focused."
            )
        else:
            relevance_exp = MetricExplanation(
                score_label="Weak",
                explanation="Your transcript had very low semantic alignment with the question.",
                recommendation="Ensure you directly address the prompt before providing background details."
            )
    else:
        relevance_exp = MetricExplanation(score_label="N/A", explanation="Analysis incomplete.", recommendation="Check model status.")

    # ── Sentiment ───────────────────────────────────────────────────────────
    sentiment_exp = None
    if sentiment is not None:
        if sentiment >= 0.65:
            sentiment_exp = MetricExplanation(
                score_label="Positive",
                explanation="We analyzed the linguistic sentiment of your transcript. Positive language demonstrates enthusiasm.",
                recommendation="Continue using active, positive phrasing."
            )
        elif sentiment >= 0.35:
            sentiment_exp = MetricExplanation(
                score_label="Neutral",
                explanation="Your choice of words was relatively neutral and objective.",
                recommendation="Try to inject slightly more enthusiasm when describing your accomplishments."
            )
        else:
            sentiment_exp = MetricExplanation(
                score_label="Negative",
                explanation="Your transcript contained negative or highly critical phrasing.",
                recommendation="Reframe challenges as learning opportunities rather than focusing on the negatives."
            )
    else:
        sentiment_exp = MetricExplanation(score_label="N/A", explanation="Analysis incomplete.", recommendation="Check model status.")

    # ── Overall ─────────────────────────────────────────────────────────────
    overall_exp = None
    if final_score is not None:
        if final_score >= 80:
            overall_exp = MetricExplanation(
                score_label="Excellent",
                explanation="This is your comprehensive multimodal score fusing speech, vision, text, and acoustic confidence.",
                recommendation="Outstanding performance. You are ready for the real interview."
            )
        elif final_score >= 60:
            overall_exp = MetricExplanation(
                score_label="Average",
                explanation="Your multimodal fusion score indicates a solid performance with some room for improvement.",
                recommendation="Review the specific metrics below to target your weak points."
            )
        else:
            overall_exp = MetricExplanation(
                score_label="Needs Work",
                explanation="Your multimodal fusion score reflects struggles across multiple domains (e.g., relevance, confidence).",
                recommendation="Take time to practice fundamentals before your next recording."
            )
    else:
        overall_exp = MetricExplanation(score_label="N/A", explanation="Analysis incomplete.", recommendation="Check model status.")

    return ExplanationsModel(
        speech=speech_exp,
        confidence=conf_exp,
        emotion=emotion_exp,
        relevance=relevance_exp,
        sentiment=sentiment_exp,
        overall=overall_exp,
    )
