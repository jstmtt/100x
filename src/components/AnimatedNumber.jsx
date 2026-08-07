import { useState, useEffect, useRef } from "react";
import { fmt } from "../lib/formatters";

export const AnimatedNumber = ({ value, duration = 1200 }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);

    useEffect(() => {
        let animationFrame;
        let start = prevValueRef.current;
        const end = value;
        if (start === end) {
            prevValueRef.current = value;
            return;
        }

        if (Math.abs(end - start) < 10) {
            setDisplayValue(end);
            prevValueRef.current = value;
            return;
        }

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const current = start + (end - start) * ease;
            setDisplayValue(current);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        prevValueRef.current = value;
        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [value, duration]);

    return fmt(displayValue);
};
