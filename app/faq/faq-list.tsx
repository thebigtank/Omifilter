"use client";

import { useState } from "react";

export type Faq = { title: string; body: string };

/**
 * Interactive FAQ accordion — the same open/close behaviour as the home page's
 * inline FAQ (app/page.tsx), now as its own client component on /faq. One item
 * open at a time; clicking the open item again closes it. The styles are the
 * global .faq* rules from app/landing.css, imported by the root layout.
 */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq__list">
      {faqs.map((q, i) => {
        const isOpen = open === i;
        return (
          <div className="faq__item" key={q.title}>
            <button
              type="button"
              className="faq__trigger"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span>{q.title}</span>
              <span className="faq__sign">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <p className="faq__answer" id={`faq-answer-${i}`}>
                {q.body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
