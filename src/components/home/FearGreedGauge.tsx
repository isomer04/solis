interface Props {
  value: number;
  classification: string;
}

const SEGMENTS = [
  {
    label: "Extreme Fear",
    color: "#e74c3c",
    from: [30, 100],
    to: [50.5, 50.5],
  },
  { label: "Fear", color: "#e67e22", from: [50.5, 50.5], to: [100, 30] },
  { label: "Greed", color: "#2ecc71", from: [100, 30], to: [149.5, 50.5] },
  {
    label: "Extreme Greed",
    color: "#27ae60",
    from: [149.5, 50.5],
    to: [170, 100],
  },
];

export default function FearGreedGauge({ value, classification }: Props) {
  // Needle: value 0→left (θ=180°), value 100→right (θ=0°) through top
  const theta = ((100 - value) / 100) * Math.PI; // radians in standard math
  const r = 60;
  const cx = 100,
    cy = 100;
  const needleX = cx + r * Math.cos(theta);
  const needleY = cy - r * Math.sin(theta); // SVG y is inverted

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 115"
        className="w-full max-w-65"
        aria-label={`Fear & Greed Index: ${value} — ${classification}`}
      >
        {/* Background arc */}
        <path
          d="M 30 100 A 70 70 0 1 0 170 100"
          fill="none"
          stroke="#333"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Colored segments (CCW sweep=0) */}
        {SEGMENTS.map((seg) => (
          <path
            key={seg.label}
            d={`M ${seg.from[0]} ${seg.from[1]} A 70 70 0 0 0 ${seg.to[0]} ${seg.to[1]}`}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
          />
        ))}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill="currentColor" />

        {/* Value */}
        <text
          x="100"
          y="90"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="currentColor"
        >
          {value}
        </text>
      </svg>

      <p className="text-sm font-semibold mt-1">{classification}</p>

      {/* Scale labels */}
      <div className="flex justify-between w-full max-w-60 text-xs text-base-content/50 mt-1">
        <span>Extreme Fear</span>
        <span>Extreme Greed</span>
      </div>
    </div>
  );
}
