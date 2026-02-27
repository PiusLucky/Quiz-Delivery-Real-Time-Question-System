"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import type { QuestionData } from "@/hooks/useQuizSocket";

interface QuestionDisplayProps {
  question: QuestionData;
}

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current || !question.text) return;
    try {
      const hasLatex = /\\[a-zA-Z]+|\\frac|\\sqrt|\\sum|\\int/.test(question.text);
      if (hasLatex) {
        const html = katex.renderToString(question.text, {
          throwOnError: false,
          displayMode: true,
        });
        textRef.current.innerHTML = html;
      } else {
        textRef.current.textContent = question.text;
      }
    } catch {
      textRef.current.textContent = question.text;
    }
  }, [question.text]);

  return (
    <div className="question-card">
      <div className="question-seq">Question #{question.seq}</div>
      <div ref={textRef} className="question-text" />
      {question.options && question.options.length > 0 && (
        <ul className="question-options">
          {question.options.map((opt, i) => (
            <li key={i}>{opt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
