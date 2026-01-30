/**
 * Plays a short "pop" sound using the Web Audio API.
 * This avoids the need for external audio files and ensures low latency.
 */
export function playClickSound() {
    // Prevent errors in SSR or environments without AudioContext
    if (typeof window === "undefined") return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Create a "pop" sound:
        // 1. Frequency sweeps down quickly (800Hz -> 300Hz)
        // 2. Volume checks out quickly (0.3 -> 0.01)

        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (err) {
        console.error("Failed to play click sound", err);
    }
}
