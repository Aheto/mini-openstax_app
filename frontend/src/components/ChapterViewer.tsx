// C:\Users\JNR\mini-openstax\frontend\src\components\ChapterViewer.tsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  ChapterData,
  SubmissionAnswer,
  SubmissionResponse,
} from "../types/api";
import { ChapterService, SubmissionService } from "../services/api";

const ChapterViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [feedback, setFeedback] = useState<
    Record<string, SubmissionResponse["item_results"][0]>
  >({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const loadChapter = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await ChapterService.getChapter(id);
        setChapter(data);
      } catch (err: any) {
        setError(err.message || "Failed to load chapter");
      } finally {
        setLoading(false);
      }
    };
    loadChapter();
  }, [id]);

  const handleOptionChange = (itemId: string, optionId: string) => {
    if (!isSubmitted) {
      setSelectedAnswers((prev) => ({ ...prev, [itemId]: optionId }));
    }
  };

  const handleSubmit = async () => {
    if (!chapter || !id) return;

    const answers: SubmissionAnswer[] = Object.entries(selectedAnswers).map(
      ([item_id, option_id]) => ({ item_id, option_id })
    );

    if (answers.length === 0) return;

    try {
      const result: SubmissionResponse = await SubmissionService.submitQuiz(
        id,
        answers
      );

      const feedbackMap: Record<string, SubmissionResponse["item_results"][0]> =
        {};
      result.item_results.forEach((item) => {
        feedbackMap[item.item_id] = item;
      });

      setFeedback(feedbackMap);
      setScore(result.score);
      setIsSubmitted(true);
    } catch (err: any) {
      alert("Quiz submission failed: " + (err.message || "Unknown error"));
    }
  };

  // === Render States ===
  if (loading) {
    return (
      <div className="container">
        <p>Loading chapter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="container">
        <p>Chapter not found.</p>
      </div>
    );
  }

  // ✅ Sanitize HTML to prevent XSS
  const cleanContent = DOMPurify.sanitize(chapter.content_html, {
    USE_PROFILES: { html: true },
    // Optional: allow media if needed
    // ADD_TAGS: ['iframe'],
    // ADD_ATTR: ['allow', 'allowfullscreen', 'src']
  });

  return (
    <div className="container">
      {/* Header with LO tags */}
      <header>
        <h1>{chapter.title}</h1>
        <div>
          {chapter.learning_objectives.map((lo) => (
            <span key={lo.id} className="lo-tag">
              {lo.tag}
            </span>
          ))}
        </div>
      </header>

      {/* Chapter Content */}
      <article
        className="chapter-content"
        dangerouslySetInnerHTML={{ __html: cleanContent }}
      />

      {/* Quiz Section */}
      {chapter.assessment_items.length > 0 && (
        <section className="card">
          <h2>Check Your Understanding</h2>
          {chapter.assessment_items.map((item) => (
            <div key={item.id} className="quiz-item">
              <p>
                <strong>{item.prompt}</strong>
              </p>
              {item.options.map((opt) => (
                <label key={opt.id}>
                  <input
                    type="radio"
                    name={`q-${item.id}`}
                    value={opt.id}
                    checked={selectedAnswers[item.id] === opt.id}
                    onChange={() => handleOptionChange(item.id, opt.id)}
                    disabled={isSubmitted}
                  />
                  <span>{opt.text}</span>
                </label>
              ))}
              {/* Feedback after submission */}
              {feedback[item.id] && (
                <div
                  className={`quiz-feedback ${
                    feedback[item.id].is_correct
                      ? "feedback-correct"
                      : "feedback-incorrect"
                  }`}
                >
                  {feedback[item.id].is_correct
                    ? "✅ Correct!"
                    : `❌ Incorrect. The correct answer is: ${
                        item.options.find((o) => o.is_correct)?.text || "—"
                      }`}
                </div>
              )}
            </div>
          ))}

          {/* Submit Button */}
          {!isSubmitted ? (
            <button
              className="btn"
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length === 0}
            >
              Submit Quiz
            </button>
          ) : (
            <div className="card" style={{ marginTop: "1rem" }}>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Your Score:</strong> {Math.round((score || 0) * 100)}%
              </p>
              <button className="btn btn-secondary" disabled>
                Quiz Submitted
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ChapterViewer;
