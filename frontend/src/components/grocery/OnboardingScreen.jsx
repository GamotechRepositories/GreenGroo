import { useNavigate } from "react-router-dom";
import { LOGO_URL } from "../layout/Header";

const ONBOARDING_KEY = "greengrocc_onboarding_done";
const HERO_IMAGE = "/onboarding-hero.png";

export function isOnboardingComplete() {
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

const FEATURES = [
  { text: "Farm-fresh produce daily" },
  { text: "Fast doorstep delivery" },
  { text: "Best prices on groceries" },
];

function OnboardingScreen({ onComplete }) {
  const navigate = useNavigate();

  const finish = (goToLocation) => {
    markOnboardingComplete();
    onComplete?.();
    navigate(goToLocation ? "/location" : "/", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#E8F5E9] lg:flex lg:bg-white">
      {/* Mobile: full-bleed starting page */}
      <div className="relative flex h-full w-full flex-col lg:hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="Fresh groceries"
            className="absolute inset-0 h-full w-full object-cover object-[center_70%]"
          />
          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-white/70 via-white/20 to-transparent px-5 pb-16 pt-10">
            <img src={LOGO_URL} alt="GreenGrocc" className="mx-auto h-12 w-auto object-contain" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#E8F5E9] via-[#E8F5E9]/85 to-transparent" />
        </div>

        <div className="relative z-10 -mt-8 px-5 pb-8 pt-2">
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-text-primary">
            Welcome to GreenGrocc
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-text-secondary">
            Fresh produce, pantry staples, and daily essentials — delivered to your door.
          </p>

          <ul className="mt-5 space-y-2">
            {FEATURES.map((f) => (
              <li
                key={f.text}
                className="flex items-center gap-2.5 rounded-xl bg-white/80 px-3.5 py-2.5 text-sm font-medium text-text-primary shadow-sm backdrop-blur-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  ✓
                </span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => finish(true)}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark active:scale-[0.99]"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => finish(false)}
              className="w-full rounded-xl border border-border-light bg-white/90 py-3.5 text-sm font-semibold text-text-primary transition hover:border-primary/40"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-[#E8F5E9] lg:flex">
        <img
          src={HERO_IMAGE}
          alt="Fresh groceries"
          className="h-full w-full max-w-xl object-contain object-bottom px-8 py-10"
        />
      </div>

      <div className="hidden w-full flex-col justify-center px-12 py-12 lg:flex xl:w-[min(520px,40%)] lg:w-[min(480px,42%)] lg:shrink-0">
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <img src={LOGO_URL} alt="GreenGrocc" className="mb-4 h-16 w-auto object-contain" />
          <h1 className="text-3xl font-extrabold text-text-primary">Welcome to GreenGrocc</h1>
          <p className="mt-2 text-base text-text-secondary">
            Fresh produce, pantry staples, and daily essentials — delivered to your door.
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm font-medium text-text-primary">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-light text-primary">
                  ✓
                </span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="mt-10 space-y-3">
            <button
              type="button"
              onClick={() => finish(true)}
              className="w-full rounded-xl bg-primary py-4 text-base font-bold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => finish(false)}
              className="w-full rounded-xl border border-border-light py-4 text-base font-semibold text-text-primary transition hover:border-primary/40 hover:bg-primary-light/50"
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
