
export const warmUpBackend = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const url = `${apiUrl}/health`;

        // Fire and forget - silent request
        // using no-cors to avoid CORS errors if the health endpoint is silent/simple
        // but user mentioned fixing CORS, so maybe standard cors is fine.
        // The requirement says "fail silently".

        await fetch(url, {
            method: "GET",
            // We don't need credentials for a health check usually
        });
    } catch (error) {
        // Fail silently as requested
        console.debug("Backend warm-up failed silently:", error);
    }
};
