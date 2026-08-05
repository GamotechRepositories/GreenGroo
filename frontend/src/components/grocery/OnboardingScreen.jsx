import { useNavigate } from "react-router-dom";
import { LOGO_URL } from "../layout/Header";

const ONBOARDING_KEY = "greengrocc_onboarding_done";
const HERO_IMAGE = "/onboarding-hero.png";
const DESKTOP_IMAGE = "/onboarding-desktop.png";

export function isOnboardingComplete() {
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

function OnboardingScreen({ onComplete }) {
  const navigate = useNavigate();

  const finish = (goToLocation) => {
    markOnboardingComplete();
    onComplete?.();
    navigate(goToLocation ? "/location" : "/", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#E8F5E9]">
      {/* Mobile: text top · full image · buttons bottom */}
      <div className="relative flex h-full w-full flex-col lg:hidden">
        <div className="relative z-20 shrink-0 px-6 pt-[max(2rem,env(safe-area-inset-top))] text-center">
          <img
            src={LOGO_URL}
            alt="GreenGrocc"
            className="mx-auto h-10 w-auto object-contain"
          />
          <h1 className="mt-3 text-[24px] font-extrabold leading-snug tracking-tight text-text-primary">
            Welcome to GreenGrocc
          </h1>
          <p className="mx-auto mt-1.5 max-w-[260px] text-[13px] font-medium leading-relaxed text-text-secondary">
            Fresh produce, pantry staples, and daily essentials — delivered to your door.
          </p>
        </div>

        <div className="relative min-h-0 flex-1">
          <img
            src={HERO_IMAGE}
            alt="Fresh groceries"
            className="absolute inset-0 h-full w-full object-cover object-[center_78%]"
          />
        </div>

        <div className="relative z-20 shrink-0 bg-gradient-to-t from-[#E8F5E9] via-[#E8F5E9]/95 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => finish(true)}
              className="w-full rounded-2xl bg-[#0C831F] py-3.5 text-[15px] font-bold text-white shadow-md shadow-[#0C831F]/25 transition active:scale-[0.99]"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => finish(false)}
              className="w-full rounded-2xl border border-black/8 bg-white py-3.5 text-[15px] font-semibold text-text-primary transition active:scale-[0.99]"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: full image background · text overlay left */}
      <div className="relative hidden h-full w-full overflow-hidden lg:block">
        <img
          src={DESKTOP_IMAGE}
          alt="Fresh groceries"
          className="absolute inset-0 h-full w-full object-cover object-[right_center]"
        />

        <div className="relative z-10 flex h-full items-center justify-start pl-[12%] pr-8 xl:pl-[14%] 2xl:pl-[16%]">
          <div className="flex w-full max-w-[440px] flex-col items-start">
            <img
              src={LOGO_URL}
              alt="GreenGrocc"
              className="h-11 w-auto object-contain object-left xl:h-12"
            />

            <h1 className="mt-5 text-[36px] font-extrabold leading-[1.2] tracking-[-0.025em] text-text-primary xl:mt-6 xl:text-[42px]">
              Welcome to GreenGrocc
            </h1>

            <p className="mt-3 max-w-[360px] text-[15px] font-medium leading-[1.55] text-[#5F6B66] xl:text-base">
              Fresh produce, pantry staples, and daily essentials — delivered to your door.
            </p>

            <div className="mt-7 flex w-full max-w-[400px] items-stretch gap-3 xl:mt-8">
              <button
                type="button"
                onClick={() => finish(true)}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-[#0C831F] px-5 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#097019]"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => finish(false)}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-[#D8D8D8] bg-white px-5 text-[15px] font-semibold text-text-primary transition hover:bg-[#FAFAFA]"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingScreen;
