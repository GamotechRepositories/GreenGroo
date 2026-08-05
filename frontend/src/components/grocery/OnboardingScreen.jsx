import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LOGO_URL } from "../layout/Header";

const ONBOARDING_KEY = "greengrocc_onboarding_done";

export function isOnboardingComplete() {
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

const FEATURES = [
  { icon: "🥬", text: "Farm-fresh produce daily" },
  { icon: "🚚", text: "Fast doorstep delivery" },
  { icon: "💚", text: "Best prices on groceries" },
];

function OnboardingScreen({ onComplete }) {
  const navigate = useNavigate();

  const finish = (goToLocation) => {
    markOnboardingComplete();
    onComplete?.();
    navigate(goToLocation ? "/location" : "/", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-white lg:flex-row">
      {/* Hero panel — full bleed on desktop */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-primary-light via-primary/20 to-primary-light/40 lg:min-h-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.15),transparent_50%)]" />
        <div className="relative w-full max-w-md px-6 py-8 lg:max-w-lg lg:px-12">
          <div className="overflow-hidden rounded-3xl bg-white/60 p-4 shadow-xl shadow-primary/10 backdrop-blur-sm lg:rounded-[2rem] lg:p-6">
            <img
              src="/onboarding-hero.png"
              alt="Fresh groceries"
              className="h-48 w-full rounded-2xl object-cover object-top sm:h-56 lg:h-72 xl:h-80"
              onError={(e) => {
                e.currentTarget.src = LOGO_URL;
                e.currentTarget.className = "h-32 w-full object-contain lg:h-48";
              }}
            />
          </div>
          <ul className="mt-6 hidden space-y-3 lg:block">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm font-medium text-text-primary">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm">
                  {f.icon}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content panel */}
      <div className="flex w-full flex-col justify-center px-6 py-8 lg:w-[min(480px,42%)] lg:shrink-0 lg:px-12 lg:py-12 xl:w-[min(520px,40%)]">
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <img src={LOGO_URL} alt="GreenGrocc" className="mb-4 h-14 w-auto object-contain lg:h-16" />
          <h1 className="text-2xl font-extrabold text-text-primary lg:text-3xl">Welcome to GreenGrocc</h1>
          <p className="mt-2 text-sm text-text-secondary lg:text-base">
            Fresh produce, pantry staples, and daily essentials — delivered to your door.
          </p>

          <ul className="mt-6 space-y-3 lg:hidden">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="text-lg">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-3 lg:mt-10">
            <button
              type="button"
              onClick={() => finish(true)}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark lg:py-4 lg:text-base"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => finish(false)}
              className="w-full rounded-xl border border-border-light py-3.5 text-sm font-semibold text-text-primary transition hover:border-primary/40 hover:bg-primary-light/50 lg:py-4 lg:text-base"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingScreen;
