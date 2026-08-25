function LoadingState({ rows = 4, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-200/70" />
      ))}
    </div>
  );
}

export default LoadingState;
