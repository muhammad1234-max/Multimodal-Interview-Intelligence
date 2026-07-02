import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ApiResults } from "@/hooks/use-analysis";

// Helper to generate the exact same feedback points as the dashboard
function generateFeedbackList(data: ApiResults) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (data.relevance >= 0.70) strengths.push("Answer was on-topic and addressed the question well.");
  else weaknesses.push("Answer could be more focused on the question asked.");

  if (data.sentiment >= 0.65) strengths.push("Positive and confident tone in your response.");
  else { weaknesses.push("Tone came across as hesitant or neutral."); suggestions.push("Practice speaking with more enthusiasm and conviction."); }

  if (data.confidence_label === "High") strengths.push("Strong vocal confidence detected across the interview.");
  else if (data.confidence_label === "Medium") suggestions.push("Build on your confidence — try rehearsing aloud before interviews.");
  else weaknesses.push("Low vocal confidence detected — focus on steady pacing and clear enunciation.");

  const happy = data.emotion_probs?.happy ?? 0;
  const anxious = data.emotion_probs?.anxious ?? 0;
  if (happy > 0.4) strengths.push("Friendly and approachable facial expressions.");
  if (anxious > 0.35) weaknesses.push("Some nervousness visible in your facial expressions.");

  return { strengths, weaknesses, suggestions };
}

export function generateInterviewReport(data: ApiResults | null) {
  if (!data) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Brand color (Antigravity Blue)
  const brandBlue: [number, number, number] = [48, 84, 255];
  
  // --- Header ---
  doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("AI Interview Assessment", 14, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 25, { align: "right" });
  doc.text("Confidential Report", pageWidth - 14, 32, { align: "right" });
  
  // --- Executive Summary ---
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 14, 60);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  
  const score = Math.round(data.final_score ?? 0);
  doc.text(`Overall Score: ${score}/100`, 14, 70);
  doc.text(`Relevance: ${Math.round((data.relevance ?? 0) * 100)}%`, 14, 78);
  doc.text(`Sentiment: ${Math.round((data.sentiment ?? 0) * 100)}%`, 14, 86);
  doc.text(`Vocal Confidence: ${data.confidence_label}`, 14, 94);
  
  let currentY = 110;
  
  // --- Speech & Emotion Tables ---
  if (data.audio_features) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Speech Metrics", 14, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      headStyles: { fillColor: brandBlue },
      margin: { left: 14, right: pageWidth / 2 + 5 },
      head: [['Metric', 'Value']],
      body: [
        ['Rate', `${data.audio_features.speech_rate.toFixed(1)} syl/s`],
        ['Pitch Variance', `${data.audio_features.pitch_variance.toFixed(0)} Hz²`],
        ['Vocal Energy', `${(data.audio_features.energy * 1000).toFixed(1)} mE`],
        ['Duration', `${data.audio_features.duration.toFixed(1)} s`]
      ],
      theme: 'grid'
    });
  }
  
  if (data.emotion_probs) {
    doc.text("Emotion Analysis", pageWidth / 2 + 5, currentY);
    
    const emotions = Object.entries(data.emotion_probs)
      .map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1), `${Math.round(v * 100)}%`])
      .sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
      
    autoTable(doc, {
      startY: currentY + 5,
      headStyles: { fillColor: brandBlue },
      margin: { left: pageWidth / 2 + 5, right: 14 },
      head: [['Emotion', 'Probability']],
      body: emotions,
      theme: 'grid'
    });
  }
  
  // Move Y down past the tables
  currentY = Math.max((doc as any).lastAutoTable.finalY + 15, currentY + 40);
  
  // --- Feedback ---
  const { strengths, weaknesses, suggestions } = generateFeedbackList(data);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Actionable Feedback", 14, currentY);
  currentY += 10;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  
  if (strengths.length > 0) {
    doc.setTextColor(34, 197, 94); // Green
    doc.setFont("helvetica", "bold");
    doc.text("Strengths:", 14, currentY);
    currentY += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    strengths.forEach(s => {
      doc.text(`• ${s}`, 18, currentY);
      currentY += 7;
    });
    currentY += 3;
  }
  
  if (weaknesses.length > 0) {
    doc.setTextColor(239, 68, 68); // Red
    doc.setFont("helvetica", "bold");
    doc.text("Areas to Improve:", 14, currentY);
    currentY += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    weaknesses.forEach(w => {
      doc.text(`• ${w}`, 18, currentY);
      currentY += 7;
    });
    currentY += 3;
  }
  
  if (suggestions.length > 0) {
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Suggestions:", 14, currentY);
    currentY += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    suggestions.forEach(s => {
      doc.text(`• ${s}`, 18, currentY);
      currentY += 7;
    });
    currentY += 10;
  }
  
  // Check page break
  if (currentY > 230) {
    doc.addPage();
    currentY = 25;
  }
  
  // --- Transcription ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Transcription Log", 14, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  
  const splitText = doc.splitTextToSize(`"${data.transcription || "No speech detected."}"`, pageWidth - 28);
  doc.text(splitText, 14, currentY);
  
  // Save PDF
  doc.save(`Interview_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}
