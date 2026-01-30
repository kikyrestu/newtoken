import { useCallback, useRef } from 'react';

// Sound file paths (base64 encoded short sounds for instant playback)
const SOUNDS = {
    beep: 'data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToFAACAgICAgICAgICAgICAgICAgICAgICBgn+AfX5/gYOFh4mKi4yMjIuKiIaEgoB+fHt6e3x+gIKEhomLjY6PkJCPjo2LiYaEgX99e3p5eXp7fX+Bg4WHiYqLjIyMi4qIhoSCgH59fHt7fH1/gYOFh4mKi4yMjIuKiIaEgoB+fHt6e3x9f4GDhYeJiouMjIyLioiGhIKAfn18e3t8fX+BgoSGiImKi4uLioqIhoSCgH9+fXx8fX5/gYKEhoeIiYqKioqJiIaFg4KAf358fHx9fn+AgYOEhYaHiIiIiIeGhYSDgYB/fn19fX5+f4CBgoOEhYaGhoaGhYSEg4KBgH9+fn1+fn9/gIGCg4OEhIWFhYWEhIOCgoGAf39+fn5+f3+AgIGCgoODhISEhIODgoKBgIB/f35+fn5/f4CAgYGCgoODg4ODg4KCgYGAgH9/fn5+fn9/gIAA',
    click: 'data:audio/wav;base64,UklGRjQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRADAACBgH5+fn+Bg4aJjI+RkpKRj4yJhoOAfoB9e3x9gIKFiIuOkJKTk5KQjouIhYKAf319fX6AgYSHio2PkZKSkpGPjImGg4GAfn19fX+BgoWIi46QkpOTkpCOi4iFgoB/fn19foCAgoWIi46QkpOTkpCOi4iFgoB/fn19foCAgoWIi4+RkpOTkpCOi4iFgoB/fn19foCAg4aJjI+RkpKRkI6LiIWCgH9+fn5/gIKFiIuOkJKTk5KQjouIhYKAf359fX6AgYSHio2PkZKSkpGPjImGg4B/fXx8fH6AgYSHio2PkZKSkpGPjImGg4GAfn19fX6AgYSHio0A',
    powerOn: 'data:audio/wav;base64,UklGRsQHAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YaAHAACAgICAgICAgICAgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAP///v79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dXT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPUE9QUVJTVFVWWFlaW11eX2JjZWhpa25wcnV3en1/g4aJjI+SlZmanZ+io6Wmp6ipqqqrq6urq6qqqaiop6alpKOhoJ6cm5mXlZSSj42LiIaEgn9+e3p3dXNxb21ramhlY2BfXVtZV1VTUk9PTU1LS0pKSkpKS0tMTU5QUVNVWFpcX2JlZ2pucXR4e3+ChoeKjpGUl5qcn6Gjpaaoqqutrq6vr66urq2sq6qoqKalpaOioJ+dnJqZl5WTkY+OjIqIhoWDgYB/fXx7enl4d3Z2dXV1dXV1dnd4eXp7fH1/gIGDhIaHiYqMjY+Qk',
    static: 'data:audio/wav;base64,UklGRhIGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0Ye4FAACLdYpzgnuGfIF8in2FgoV+g4OBgoR9hYF+gYSChYKBgX2BfYOBgH6DhIGBgoCBg3+DgIJ+gYOAg4GAgYKBgoF/gIJ/goKAgIOAgoJ/gIF/goF+gYOBgoF/gX+CgYCBgoGCgX+Bf4KBf4GCgYOBf4F+goF/gYKBg4F/gH6Cf4CBgoGDgX+BfoJ/gIGBgYOBf4F/gn+AgYGBgoGAgX+Bf4CAgYGCgYGBf4F/gX+AgYGCgYGBf4F/gX+AgYGBgYGBgIF/gX9/gIGBgYGBgYGBf4F/f4CBgYGBgYGBgX+Bf3+AgYGBgYGBgYF/gX9/gIGBgYGBgYGBf4F/f4CBgYGBgYGBgX+Bf3+AgYGBgYGBgYGBf4F/f4CBgYGBgYGBgX+BfoCAgYGBgYGBgYF/gX+AgIGBgYGBgYGBf4F/gICBgYGBgYGBgX+Bf4CAgYGBgYGBgYF/gn+AgIGBgYGBgYGBf4J/gICBgYGBgYGBgX+Cf4CAgYGBgYGBgYF/gn+AgIGBgYGBgYGB',
};

export function useTerminalSound() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const volumeRef = useRef(0.15); // 15% volume - subtle

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const playSound = useCallback(async (soundType: keyof typeof SOUNDS) => {
        try {
            const ctx = getAudioContext();
            const soundData = SOUNDS[soundType];

            // Decode base64 audio
            const response = await fetch(soundData);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            // Create source and gain nodes
            const source = ctx.createBufferSource();
            const gainNode = ctx.createGain();

            source.buffer = audioBuffer;
            gainNode.gain.value = volumeRef.current;

            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            source.start(0);
        } catch (e) {
            // Silently fail if audio doesn't work
            console.debug('Audio playback failed:', e);
        }
    }, [getAudioContext]);

    const playBeep = useCallback(() => playSound('beep'), [playSound]);
    const playClick = useCallback(() => playSound('click'), [playSound]);
    const playPowerOn = useCallback(() => playSound('powerOn'), [playSound]);
    const playStatic = useCallback(() => playSound('static'), [playSound]);

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
