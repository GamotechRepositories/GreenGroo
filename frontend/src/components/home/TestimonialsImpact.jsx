import { useCallback, useEffect, useState } from "react";
import { getTestimonials } from "../../api/api";

const STATS = [
  {
    value: "5000+",
    label: "Happy Clients",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    value: "100K+",
    label: "Units Sold",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  {
    value: "500+",
    label: "Cities Served",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    value: "99%",
    label: "On-Time Delivery",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
];

const AUTO_PLAY_MS = 5000;

function NavArrowButton({ direction, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-primary hover:text-primary"
    >
      {direction === "left" ? "‹" : "›"}
    </button>
  );
}

function Stars() {
  return (
    <div className="mb-2 flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCarousel({ testimonials }) {
  const [current, setCurrent] = useState(0);
  const count = testimonials.length;

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + count) % count);
  }, [count]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const timer = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [next, count]);

  useEffect(() => {
    if (current >= count) {
      setCurrent(0);
    }
  }, [count, current]);

  if (count === 0) {
    return null;
  }

  const item = testimonials[current];

  return (
    <div>
      <h2 className="mb-4 text-sm font-bold tracking-wide text-primary md:text-base">
        WHAT OUR CLIENTS SAY
      </h2>

      <div className="flex w-full items-center gap-3 lg:max-w-md">
        {count > 1 && (
          <NavArrowButton direction="left" onClick={prev} label="Previous testimonial" />
        )}

        <div className="relative flex min-h-[180px] min-w-0 flex-1 flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
          <span className="absolute left-3 top-2 select-none font-serif text-4xl leading-none text-primary/25">
            &ldquo;
          </span>
          <span className="absolute bottom-1 right-3 select-none font-serif text-4xl leading-none text-primary/25">
            &rdquo;
          </span>

          <div className="relative z-10">
            <Stars />
            <p className="mb-4 text-sm leading-relaxed text-neutral-700 transition-opacity duration-500">
              {item.text}
            </p>
          </div>

          <div className="relative z-10">
            <p className="text-sm font-bold text-neutral-900">{item.name}</p>
            {item.role ? (
              <p className="text-xs text-neutral-500">{item.role}</p>
            ) : null}
          </div>
        </div>

        {count > 1 && (
          <NavArrowButton direction="right" onClick={next} label="Next testimonial" />
        )}
      </div>
    </div>
  );
}

function ImpactStats() {
  return (
    <div>
      <h2 className="mb-4 text-sm font-bold tracking-wide text-primary md:text-base">
        OUR IMPACT IN NUMBERS
      </h2>

      <div className="hide-scrollbar scroll-px-5 overflow-x-auto scroll-smooth snap-x snap-mandatory lg:overflow-visible lg:snap-none">
        <div className="flex w-max gap-4 pb-2 lg:w-full lg:grid lg:grid-cols-4 lg:gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex w-[150px] shrink-0 snap-start flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-5 text-center shadow-sm lg:w-auto"
            >
              <div className="mb-2 text-primary">{stat.icon}</div>
              <p className="mb-1 text-xl font-bold leading-none text-neutral-900 md:text-2xl">
                {stat.value}
              </p>
              <p className="text-xs leading-tight text-neutral-600">{stat.label}</p>
            </div>
          ))}
          <div className="w-2 shrink-0 lg:hidden" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function TestimonialsImpact() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data } = await getTestimonials();
        setTestimonials(data.data || []);
      } catch {
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (!loading && testimonials.length === 0) {
    return (
      <section className="bg-white px-5 py-8 sm:px-6 md:px-8 lg:px-12 md:py-10">
        <div className="mx-auto max-w-[1600px]">
          <ImpactStats />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-5 py-8 sm:px-6 md:px-8 lg:px-12 md:py-10">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-center lg:gap-10">
        {!loading && testimonials.length > 0 ? (
          <TestimonialCarousel testimonials={testimonials} />
        ) : null}
        <ImpactStats />
      </div>
    </section>
  );
}

export default TestimonialsImpact;
