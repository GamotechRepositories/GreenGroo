function LoadingState({ rows = 4, className = "" }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-8 animate-pulse border border-[#D4D4D4] bg-[#F2F2F2]" />
      ))}
    </div>
  );
}

export default LoadingState;
