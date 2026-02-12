import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CountUpNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  animationKey?: number;
}

const CountUpNumber = ({ 
  value, 
  duration = 1.5, 
  decimals = 2, 
  suffix = "",
  animationKey = 0 
}: CountUpNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevKeyRef = useRef(animationKey);
  
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    // Reset to 0 when animationKey changes
    if (animationKey !== prevKeyRef.current) {
      springValue.set(0);
      prevKeyRef.current = animationKey;
    }
    
    // Small delay to ensure reset happens first
    const timeout = setTimeout(() => {
      springValue.set(value);
    }, 50);

    return () => clearTimeout(timeout);
  }, [value, animationKey, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [springValue]);

  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span>
      {formattedValue}{suffix}
    </span>
  );
};

export default CountUpNumber;
