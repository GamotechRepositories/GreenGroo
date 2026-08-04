function Sparkline({
  values = [],
  color = "#ff7a00",
  height = 36,
  className = "",
  showDots = false,
}) {
  const points = values.map((value) => Number(value) || 0);
  const width = 96;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);

  const coordinates = points.map((value, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-24 ${className}`}
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {showDots &&
        coordinates.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3" fill={color} />
        ))}
    </svg>
  );
}

export default Sparkline;
