"use client";

import { useState, useEffect } from "react";

export type GuideStep = {
  title: string;
  description: string;
};

type OnboardingGuideProps = {
  pageKey: string;
  title: string;
  steps: GuideStep[];
};

export function OnboardingGuide({ pageKey, title, steps }: OnboardingGuideProps) {
  const storageKey = `onboarding-dismissed-${pageKey}`;
  const [dismissed, setDismissed] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== "true") {
      setDismissed(false);
    }
  }, [storageKey]);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(storageKey, "true");
  }

  function resetGuide() {
    setDismissed(false);
    setCurrentStep(0);
    localStorage.removeItem(storageKey);
  }

  if (dismissed) {
    return (
      <button
        onClick={resetGuide}
        className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        Page Guide
      </button>
    );
  }

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="rounded-[28px] border border-indigo-500/20 bg-indigo-500/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
            {currentStep + 1}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-400/70">{title}</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss guide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{step.description}</p>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep
                  ? "w-6 bg-indigo-400"
                  : "w-2 bg-slate-600 hover:bg-slate-500"
              }`}
              aria-label={`Step ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {!isFirst && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
            >
              Back
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
            >
              Next
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
            >
              Got it!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
