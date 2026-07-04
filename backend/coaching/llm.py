"""
LLM Client — Handles sending prompt and context to the LLM.
Returns a structured JSON-like dict matching the Phase 4 Mentor format.
Enforces RAG grounding and historical context.
Provides a resilient fallback system in case cloud completion is unavailable.
"""
import os
import json
import urllib.request
from typing import List, Dict, Any
import time

from utils.logger import get_structured_logger

logger = get_structured_logger("coaching.llm")


def get_model_name_used() -> str:
    if os.getenv("OPENAI_API_KEY"):
        return "gpt-4o-mini"
    elif os.getenv("GROQ_API_KEY"):
        return "llama-3.1-8b-instant"
    elif os.getenv("GEMINI_API_KEY"):
        return "gemini-1.5-flash"
    return "Local Fallback Generator"


def _call_cloud_llm(prompt: str, system_prompt: str) -> Dict[str, Any] | None:
    openai_key = os.getenv("OPENAI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    raw_response = None

    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openai_key}"
            }
            data = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode("utf-8"),
                headers=headers
            )
            with urllib.request.urlopen(req, timeout=25) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                raw_response = res_data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}", exc_info=True)

    elif groq_key:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {groq_key}",
                "User-Agent": "Mozilla/5.0"
            }
            data = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode("utf-8"),
                headers=headers
            )
            with urllib.request.urlopen(req, timeout=25) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                raw_response = res_data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Groq API call failed: {e}", exc_info=True)

    elif gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            data = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"Instruction: {system_prompt}\n\nContext and Metrics:\n{prompt}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json"
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode("utf-8"),
                headers=headers
            )
            with urllib.request.urlopen(req, timeout=25) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                raw_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}", exc_info=True)

    if raw_response:
        try:
            clean_res = raw_response.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()

            parsed = json.loads(clean_res)
            if "executive_summary" in parsed and "biggest_strength" in parsed:
                return parsed
            else:
                logger.warning(f"Parsed JSON missing required keys. Raw: {parsed}")
        except Exception as parse_err:
            logger.error(f"Failed to parse cloud LLM JSON: {parse_err}. Raw response: {raw_response}", exc_info=True)

    return None


def generate_fallback_coaching(metrics: Dict[str, Any]) -> Dict[str, Any]:
    score = metrics.get('final_score', 0)
    relevance = metrics.get('relevance', 0)
    confidence = metrics.get('confidence_label', "Unknown")
    
    summary = "Your interview demonstrated a baseline understanding of the topic, but lacked some structural depth. Continued practice is necessary to meet professional standards."
    outlook_status = "Needs More Practice"
    outlook_explanation = "You have the baseline knowledge, but your delivery currently lacks the refinement expected for senior roles."
    
    if score > 80: 
        summary = "You delivered a highly professional interview with excellent structure, clear technical understanding, and confident delivery."
        outlook_status = "Strong Candidate"
        outlook_explanation = "Your performance strongly signals that you are ready for final-stage technical interviews."
    elif score > 65: 
        summary = "Your performance was solid. You demonstrated good technical knowledge but showed room for improvement in delivery consistency."
        outlook_status = "Competitive Candidate"
        outlook_explanation = "You are performing well and are likely to pass initial screening stages."

    strength = {
        "title": "Good Response Relevance",
        "description": "You stayed on topic for the most part.",
        "evidence": f"Relevance score of {relevance*100:.1f}% indicates you addressed the core prompt."
    }
    if confidence == "High":
        strength = {
            "title": "Strong Vocal Confidence",
            "description": "Your tone and pacing projected authority and assurance.",
            "evidence": "Acoustic analysis classified your vocal delivery as High confidence."
        }
    elif relevance > 0.8:
        strength = {
            "title": "Excellent Topic Alignment",
            "description": "You answered the question directly without unnecessary tangents.",
            "evidence": f"Achieved a high relevance score of {relevance*100:.1f}%."
        }

    improvement = {
        "current_behaviour": "Vocal delivery lacked energetic projection.",
        "why_it_limits": "Interviews require engaging the listener through dynamic pacing.",
        "expected_benefit": "Better engagement and perceived leadership qualities."
    }
    if confidence == "Low":
        improvement = {
            "current_behaviour": "Vocal hesitation and monotonic delivery.",
            "why_it_limits": "It can be perceived as nervousness or lack of conviction in your answers.",
            "expected_benefit": "Projecting more authority will make your technical answers much more convincing."
        }
    elif relevance < 0.6:
        improvement = {
            "current_behaviour": "Straying from the core prompt.",
            "why_it_limits": "Interviewers might feel their question wasn't actually answered.",
            "expected_benefit": "Higher semantic relevance ensures you score full points on rubrics."
        }

    return {
        "executive_summary": summary,
        "recurring_themes": {
            "consistently_strong": ["Baseline technical understanding", "Professional demeanor"],
            "needs_attention": ["Vocal projection consistency", "Maintaining direct eye contact"]
        },
        "long_term_goal": {
            "goal_statement": "Master clear and engaging technical communication.",
            "progress_status": "In Progress"
        },
        "recruiter_perspective": "The candidate presents themselves professionally and has a grasp of the fundamentals. However, greater structure in their answers would inspire more confidence.",
        "interview_outlook": {
            "status": outlook_status,
            "explanation": outlook_explanation
        },
        "biggest_strength": strength,
        "highest_priority_improvement": improvement,
        "smart_practice_plan": [
            {
                "objective": "Improve vocal confidence.",
                "duration": "15 Minutes",
                "difficulty": "Medium",
                "exercise": "Record yourself answering a mock behavioral question and focus purely on your delivery tone. Speak slightly louder than usual.",
                "expected_outcome": improvement["expected_benefit"]
            }
        ],
        "next_question": {
            "question": "Can you describe a time when you had to adapt your communication style to a technical audience?",
            "rationale": "To practice tailoring your delivery dynamically based on the audience."
        },
        "motivational_closing": "Consistent practice with these targeted exercises will rapidly improve your delivery. Focus on the core adjustments and the confidence will follow naturally."
    }


def generate_coaching(metrics: Dict[str, Any], retrieved_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    docs_context = "\n\n".join([
        f"Document: {doc['title']}\nCategory: {doc['category']}\nContent: {doc['content']}"
        for doc in retrieved_docs
    ])

    system_prompt = """You are an expert executive interview coach. Your task is to provide highly personalized, evidence-based coaching suggestions based ONLY on the user's interview metrics, history, and the provided reference documents.

TONE & PERSONALITY GUIDELINES:
- Communicate like an experienced engineering interview coach.
- Tone must be: Professional, Supportive, Constructive, Direct, Encouraging.
- NEVER be overly enthusiastic, robotic, or generic. 
- AVOID phrases like: "Great job!", "Keep it up!", "You can do it!"
- Provide balanced observations supported by concrete evidence. Do not merely list weaknesses.
- Remember previous sessions and reference them naturally (e.g., "Your speaking pace has remained consistent over the last three interviews."). Evolve your advice over time.

You MUST return a valid JSON object ONLY. Do not use markdown wraps in your output. The JSON structure must exactly match:
{
  "executive_summary": "Concise recruiter-style summary covering overall quality, impression, technical communication, confidence, and readiness.",
  "recurring_themes": {
    "consistently_strong": ["Theme 1", "Theme 2"],
    "needs_attention": ["Theme A", "Theme B"]
  },
  "long_term_goal": {
    "goal_statement": "A persistent overarching coaching goal (e.g. Master technical storytelling).",
    "progress_status": "Brief status based on history"
  },
  "recruiter_perspective": "A summary of how an interviewer would likely perceive this interview.",
  "interview_outlook": {
    "status": "Must be exactly one of: Strong Candidate, Competitive Candidate, Needs More Practice, Not Yet Interview Ready",
    "explanation": "Concise explanation of why this outlook was assigned."
  },
  "biggest_strength": {
    "title": "Short title",
    "description": "Why it stood out.",
    "evidence": "Reference actual interview evidence from the transcript or metrics."
  },
  "highest_priority_improvement": {
    "current_behaviour": "Observation of current behaviour.",
    "why_it_limits": "Why this limits performance.",
    "expected_benefit": "Expected benefit if improved."
  },
  "smart_practice_plan": [
    {
      "objective": "Objective of the exercise",
      "duration": "e.g. 20-Minute Focus Session",
      "difficulty": "Low/Medium/High",
      "exercise": "Specific actionable exercise description tailored to weakest skills",
      "expected_outcome": "Expected outcome"
    }
  ],
  "next_question": {
    "question": "A tailored follow-up question dynamically generated based on current and historical weaknesses.",
    "rationale": "Why this question was selected."
  },
  "motivational_closing": "Concise motivational closing reflecting actual progress (avoid generic phrases)."
}
"""

    prompt = (
        f"--- RETRIEVED GROUNDING DOCUMENTS ---\n{docs_context}\n\n"
        f"--- CURRENT SESSION ---\n"
        f"Question: {metrics.get('question', '')}\n"
        f"Transcript: {metrics.get('transcription', '')}\n"
        f"Final Score: {metrics.get('final_score')}/100\n"
        f"Relevance: {metrics.get('relevance')}\n"
        f"Sentiment: {metrics.get('sentiment')}\n"
        f"Confidence Level: {metrics.get('confidence_label')}\n"
        f"Emotion Probabilities: {metrics.get('emotion_probs', {})}\n"
        f"Audio Features: {metrics.get('audio_features', {})}\n"
        f"--- HISTORICAL SESSIONS ---\n"
        f"History (Past 3 sessions): {metrics.get('history', [])}\n\n"
        f"Instructions:\n"
        f"1. Generate the structured coaching feedback following the exact JSON schema.\n"
        f"2. Ensure tone is professional and evidence-based."
    )

    logger.debug("Formatting prompt and system instructions.", extra={"extra_data": {"context_docs_count": len(retrieved_docs)}})

    t0 = time.time()
    cloud_result = _call_cloud_llm(prompt, system_prompt)
    t1 = time.time()
    
    if cloud_result:
        # Inject RAG metrics into the response for developer diagnostics
        cloud_result["transparency"] = {
            "model_used": get_model_name_used(),
            "retrieval_count": len(retrieved_docs),
            "analysis_confidence": "High",
            "inference_time_ms": round((t1 - t0) * 1000, 2),
            "fallback_activated": False
        }
        logger.info("Cloud LLM execution successful.", extra={"extra_data": {"inference_time_ms": round((t1 - t0) * 1000, 2), "model": get_model_name_used()}})
        return cloud_result

    logger.warning("Cloud execution failed or bypassed. Falling back to local deterministic generator.")
    fallback_result = generate_fallback_coaching(metrics)
    fallback_result["transparency"] = {
        "model_used": "Deterministic Rule Engine (Fallback)",
        "retrieval_count": len(retrieved_docs),
        "analysis_confidence": "Low (Fallback mode)",
        "inference_time_ms": round((time.time() - t1) * 1000, 2),
        "fallback_activated": True
    }
    return fallback_result
