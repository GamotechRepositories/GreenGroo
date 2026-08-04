import { useRef } from "react";
import { useAutoScroll } from "../../hooks/useAutoScroll";

function HorizontalScrollRow({
  children,
  autoScroll = false,
  className = "",
  gapClassName = "gap-2.5 sm:gap-3 md:gap-4",
}) {
  const scrollRef = useRef(null);
  const { handlers } = useAutoScroll(scrollRef, { enabled: autoScroll });

  return (
    <div
      ref={scrollRef}
      className={`hide-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-1 ${gapClassName} ${className}`}
      {...(autoScroll ? handlers : {})}
    >
      {children}
    </div>
  );
}

export default HorizontalScrollRow;
