function LoadingState({ rows = 4, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-[#E5E7EB] bg-gradient-to-r from-[#F3F4F6] via-white to-[#F3F4F6]"
        />
      ))}
    </div>
  );
}

export default LoadingState;
