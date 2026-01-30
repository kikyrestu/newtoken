import { useState, useEffect, useCallback } from 'react';

interface UseTypingAnimationOptions {
    text: string;
    speed?: number; // ms per character
    delay?: number; // ms before starting
    onComplete?: () => void;
}

export function useTypingAnimation({
    text,
    speed = 30,
    delay = 0,
    onComplete
}: UseTypingAnimationOptions) {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        setDisplayText('');
        setIsComplete(false);
        setIsTyping(false);

        if (!text) {
            setIsComplete(true);
            return;
        }

        const startTimeout = setTimeout(() => {
            setIsTyping(true);
            let currentIndex = 0;

            const typeInterval = setInterval(() => {
                if (currentIndex < text.length) {
                    setDisplayText(text.slice(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(typeInterval);
                    setIsTyping(false);
                    setIsComplete(true);
                    onComplete?.();
                }
            }, speed);

            return () => clearInterval(typeInterval);
        }, delay);

        return () => clearTimeout(startTimeout);
    }, [text, speed, delay, onComplete]);

    return { displayText, isComplete, isTyping };
}

// Glitch text effect hook
export function useGlitchText(text: string, intensity: 'low' | 'medium' | 'high' = 'low') {
    const [displayText, setDisplayText] = useState(text);

    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▄▀■□▪▫';

    const intervals = {
        low: 8000,     // Every 8 seconds
        medium: 4000,  // Every 4 seconds
        high: 2000     // Every 2 seconds
    };

    useEffect(() => {
        setDisplayText(text);

        const glitchInterval = setInterval(() => {
            // Random chance to glitch (30%)
            if (Math.random() > 0.7) {
                const chars = text.split('');
                const glitchCount = Math.floor(Math.random() * 3) + 1;

                for (let i = 0; i < glitchCount; i++) {
                    const pos = Math.floor(Math.random() * chars.length);
                    chars[pos] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                }

                setDisplayText(chars.join(''));

                // Restore after short delay
                setTimeout(() => setDisplayText(text), 100);
            }
        }, intervals[intensity]);

        return () => clearInterval(glitchInterval);
    }, [text, intensity]);

    return displayText;
}

// Scramble reveal animation (like decryption effect)
export function useScrambleReveal(text: string, duration: number = 1000) {
    const [displayText, setDisplayText] = useState('');
    const [isRevealed, setIsRevealed] = useState(false);

    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';

    useEffect(() => {
        if (!text) {
            setDisplayText('');
            setIsRevealed(true);
            return;
        }

        setIsRevealed(false);
        const iterations = 10;
        const iterationDuration = duration / iterations;
        let currentIteration = 0;

        const scrambleInterval = setInterval(() => {
            currentIteration++;

            const revealedLength = Math.floor((currentIteration / iterations) * text.length);
            const revealed = text.slice(0, revealedLength);
            const scrambled = Array(text.length - revealedLength)
                .fill(null)
                .map(() => scrambleChars[Math.floor(Math.random() * scrambleChars.length)])
                .join('');

            setDisplayText(revealed + scrambled);

            if (currentIteration >= iterations) {
                clearInterval(scrambleInterval);
                setDisplayText(text);
                setIsRevealed(true);
            }
        }, iterationDuration);

        return () => clearInterval(scrambleInterval);
    }, [text, duration]);

    return { displayText, isRevealed };
}

// Number counting animation
export function useCountUp(target: number, duration: number = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target === 0) {
            setCount(0);
            return;
        }

        const startTime = Date.now();
        const startValue = 0;

        const updateCount = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quad
            const easeProgress = 1 - (1 - progress) * (1 - progress);
            const currentValue = Math.floor(startValue + (target - startValue) * easeProgress);

            setCount(currentValue);

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        };

        requestAnimationFrame(updateCount);
    }, [target, duration]);

    return count;
}

export default useTypingAnimation;
