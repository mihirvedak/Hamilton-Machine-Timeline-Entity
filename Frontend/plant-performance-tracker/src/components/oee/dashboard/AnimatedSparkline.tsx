import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSparklineProps {
  data: number[];
  color: string;
  animationKey?: number;
}

const AnimatedSparkline = ({ data, color, animationKey = 0 }: AnimatedSparklineProps) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const width = 100;
  const height = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  // Create area path (line + bottom closure)
  const areaPoints = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });
  
  const areaPath = `M ${areaPoints[0].x},${areaPoints[0].y} ` +
    areaPoints.slice(1).map(p => `L ${p.x},${p.y}`).join(" ") +
    ` L ${width},${height} L 0,${height} Z`;

  // Calculate line length for stroke animation
  const lineLength = areaPoints.reduce((acc, point, i) => {
    if (i === 0) return 0;
    const prev = areaPoints[i - 1];
    return acc + Math.sqrt(Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2));
  }, 0);

  // Get the fill color based on the text color class
  const getFillId = () => {
    if (color.includes("danger")) return "gradient-danger";
    if (color.includes("success")) return "gradient-success";
    return "gradient-primary";
  };

  // Reset animation when animationKey changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [animationKey]);

  return (
    <svg width={width} height={height} className={color}>
      <defs>
        <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="gradient-success" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </linearGradient>
        <clipPath id={`clip-${animationKey}`}>
          <rect 
            x="0" 
            y="0" 
            width={isAnimating ? 0 : width} 
            height={height}
            style={{
              transition: isAnimating ? 'width 1.5s ease-out' : 'none',
              width: isAnimating ? '0' : `${width}px`,
            }}
          >
            <animate 
              attributeName="width" 
              from="0" 
              to={width} 
              dur="1.5s" 
              fill="freeze"
              begin="0s"
              key={animationKey}
            />
          </rect>
        </clipPath>
      </defs>
      {/* Area fill with clip animation */}
      <g clipPath={`url(#clip-${animationKey})`}>
        <path d={areaPath} fill={`url(#${getFillId()})`} />
        {/* Line on top */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </g>
    </svg>
  );
};

export default AnimatedSparkline;
