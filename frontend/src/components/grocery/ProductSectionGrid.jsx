import HorizontalScrollRow from "../home/HorizontalScrollRow";

function ProductSectionGrid({ children, loading, skeletonCount = 8 }) {
  if (loading) {
    return (
      <>
        <div className="lg:hidden">
          <HorizontalScrollRow>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skel-m-${index}`}
                className="h-[258px] w-[150px] shrink-0 animate-pulse rounded-2xl border border-border-light bg-mobile-surface sm:w-[165px]"
              />
            ))}
          </HorizontalScrollRow>
        </div>
        <div className="hidden gap-3 lg:grid lg:grid-cols-8">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div
              key={`skel-d-${index}`}
              className="h-[280px] animate-pulse rounded-2xl border border-border-light bg-mobile-surface"
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="lg:hidden">
        <HorizontalScrollRow>{children}</HorizontalScrollRow>
      </div>
      <div className="hidden gap-3 lg:grid lg:grid-cols-8">{children}</div>
    </>
  );
}

export default ProductSectionGrid;
