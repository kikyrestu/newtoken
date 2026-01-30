import { useCallback, useRef } from 'react';

// Free sound effects URLs from public CDNs
// These are short UI sounds that should work well for the terminal aesthetic
const SOUNDS = {
    // Simple click sound from freesound-like sources
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    // Sci-fi interface beep
    beep: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    // Sci-fi confirmation / power on
    powerOn: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
    // Interface hint / notification
    notification: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3',
};

export function useTerminalSound() {
    const volumeRef = useRef(0.3); // 30% volume
    const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

    // Preload sounds for faster playback
    const preloadSound = useCallback((key: keyof typeof SOUNDS) => {
        if (!audioCache.current.has(key)) {
            const audio = new Audio(SOUNDS[key]);
            audio.volume = volumeRef.current;
            audio.preload = 'auto';
            audioCache.current.set(key, audio);
        }
        return audioCache.current.get(key)!;
    }, []);

    const playSound = useCallback((key: keyof typeof SOUNDS) => {
        try {
            const audio = preloadSound(key);
            audio.volume = volumeRef.current;
            audio.currentTime = 0; // Reset to start
            audio.play().catch(e => {
                console.debug('Audio play failed:', e);
            });
        } catch (e) {
            console.debug('Audio error:', e);
        }
    }, [preloadSound]);

    const playClick = useCallback(() => playSound('click'), [playSound]);
    const playBeep = useCallback(() => playSound('beep'), [playSound]);
    const playPowerOn = useCallback(() => playSound('powerOn'), [playSound]);
    const playNotification = useCallback(() => playSound('notification'), [playSound]);

    const setVolume = useCallback((volume: number) => {
        volumeRef.current = Math.max(0, Math.min(1, volume));
        // Update all cached audio elements
        audioCache.current.forEach(audio => {
            audio.volume = volumeRef.current;
        });
    }, []);

    // Preload all sounds on first call
    const preloadAll = useCallback(() => {
        Object.keys(SOUNDS).forEach(key => {
            preloadSound(key as keyof typeof SOUNDS);
        });
    }, [preloadSound]);

    return {
        playClick,
        playBeep,
        playPowerOn,
        playNotification,
        playStatic: playBeep, // Alias for compatibility
        setVolume,
        preloadAll
    };
}

export default useTerminalSound;
