/**
 * Plays the tap sound using HTMLAudioElement.
 * Includes vibration support for mobile.
 */
export function playClickSound() {
    try {
        const audio = new Audio("/music/tap.mp3");
        audio.volume = 0.5;

        // Play sound (catch errors for browsers that block auto-play without interaction)
        audio.play().catch((err) => {
            // detailed error logging only in dev
            if (import.meta.env.DEV) console.warn("Audio play blocked:", err);
        });

        // Vibrate if supported
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(20);
        }
    } catch (err) {
        if (import.meta.env.DEV) console.error("Sound error:", err);
    }
}

