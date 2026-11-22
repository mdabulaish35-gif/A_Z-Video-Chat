if (typeof window !== "undefined") {
    window.global = window;
    window.process = window.process || {};
    window.process.env = window.process.env || { NODE_DEBUG: undefined };
    if (!window.process.nextTick) {
        window.process.nextTick = (cb) => setTimeout(cb, 0);
    }
    try {
        window.Buffer = window.Buffer || require("buffer").Buffer;
    } catch (e) {
        window.Buffer = {};
    }
}