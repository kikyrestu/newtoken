import { useCallback, useRef } from 'react';

export function useTerminalSound() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const volumeRef = useRef(0.2); // 20% volume
    const initializedRef = useRef(false);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Generate click sound programmatically
    const playClick = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

            gainNode.gain.setValueAtTime(volumeRef.current * 0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.05);
        } catch (e) {
            console.debug('Click sound failed:', e);
        }
    }, [getAudioContext]);

    // Generate beep sound
    const playBeep = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);

            gainNode.gain.setValueAtTime(volumeRef.current * 0.4, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.debug('Beep sound failed:', e);
        }
    }, [getAudioContext]);

    // Generate power on sound (sci-fi boot sequence)
    const playPowerOn = useCallback(() => {
        try {
            const ctx = getAudioContext();

            // Create multiple oscillators for layered effect
            const createTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq * 0.5, ctx.currentTime + startTime);
                osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + startTime + duration * 0.3);
                osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime + duration * 0.7);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + startTime + duration);

                gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
                gain.gain.linearRampToValueAtTime(volumeRef.current * 0.3, ctx.currentTime + startTime + 0.05);
                gain.gain.setValueAtTime(volumeRef.current * 0.3, ctx.currentTime + startTime + duration * 0.8);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + startTime);
                osc.stop(ctx.currentTime + startTime + duration);
            };

            // Layered boot sequence
            createTone(220, 0, 0.3, 'sine');      // Low hum
            createTone(440, 0.1, 0.25, 'sine');   // Mid tone
            createTone(660, 0.2, 0.2, 'triangle'); // High ping
            createTone(880, 0.25, 0.15, 'sine');  // Final beep

            // Add some noise for texture
            const bufferSize = ctx.sampleRate * 0.3;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * 0.02;
            }

            const noise = ctx.createBufferSource();
            const noiseGain = ctx.createGain();
            const noiseFilter = ctx.createBiquadFilter();

            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 1000;

            noise.buffer = noiseBuffer;
            noiseGain.gain.setValueAtTime(volumeRef.current, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            noise.start(ctx.currentTime);
            noise.stop(ctx.currentTime + 0.3);

        } catch (e) {
            console.debug('Power on sound failed:', e);
        }
    }, [getAudioContext]);

    // Generate static/glitch sound
    const playStatic = useCallback(() => {
        try {
            const ctx = getAudioContext();
            const bufferSize = ctx.sampleRate * 0.1;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            filter.type = 'highpass';
            filter.frequency.value = 2000;

            noise.buffer = noiseBuffer;
            gainNode.gain.setValueAtTime(volumeRef.current * 0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            noise.start(ctx.currentTime);
            noise.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.debug('Static sound failed:', e);
        }
    }, [getAudioContext]);

    const setVolume = useCallback((volume: number) => {
        volumeRef.current = Math.max(0, Math.min(1, volume));
    }, []);

    return {
        playBeep,
        playClick,
        playPowerOn,
        playStatic,
        setVolume
    };
}

export default useTerminalSound;
