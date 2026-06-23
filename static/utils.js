/**
 * Shared utility functions for Mainstreet MFB chatbot frontend.
 */

export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[char]));
}

export function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
}

/**
 * Safely parses and renders a formatted chat message into a container element,
 * avoiding the use of innerHTML to prevent XSS.
 * 
 * Supports:
 * - Links starting with http:// or https:// (wrapped in safe <a> elements)
 * - Bold text wrapped in ** (wrapped in <strong> elements)
 * - Underlined text wrapped in __ (wrapped in <u> elements)
 * - Newlines (\n) (rendered as <br> elements)
 * 
 * @param {string} text The message text to render.
 * @param {HTMLElement} container The DOM element to append children to.
 */
export function renderFormattedMessage(text, container) {
    container.replaceChildren();

    if (!text) return;

    // Tokenize text into links, bold, underline, and newlines
    const regex = /(https?:\/\/[^\s]+|\*\*.+?\*\*|__.+?__|\n)/g;
    const parts = String(text).split(regex);

    parts.forEach(part => {
        if (!part) return;

        if (part.startsWith("http://") || part.startsWith("https://")) {
            const link = document.createElement("a");
            link.setAttribute("href", part);
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
            link.textContent = part;
            container.appendChild(link);
        } else if (part.startsWith("**") && part.endsWith("**")) {
            const strong = document.createElement("strong");
            strong.textContent = part.slice(2, -2);
            container.appendChild(strong);
        } else if (part.startsWith("__") && part.endsWith("__")) {
            const u = document.createElement("u");
            u.textContent = part.slice(2, -2);
            container.appendChild(u);
        } else if (part === "\n") {
            container.appendChild(document.createElement("br"));
        } else {
            container.appendChild(document.createTextNode(part));
        }
    });
}
