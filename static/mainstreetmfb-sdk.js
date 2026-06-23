(async function () {
    const currentScript = document.currentScript;
    const scriptOrigin = currentScript ? new URL(currentScript.src).origin : window.location.origin;
    const config = window.MainstreetMFBConfig || {};
    const apiBaseUrl = (config.apiBaseUrl || scriptOrigin).replace(/\/$/, "");
    const title = config.title || "Mainstreet MFB";
    const subtitle = config.subtitle || "Assistant";
    const buttonLabel = config.buttonLabel || "Chat";
    
    // Sanitize accent color to prevent CSS injection
    let accentColor = config.accentColor || "#0f766e";
    if (!/^#[0-9a-fA-F]{3,8}$|^[a-zA-Z]+$/.test(accentColor)) {
        accentColor = "#0f766e";
    }

    const position = config.position === "left" ? "left" : "right";

    if (document.getElementById("mainstreetmfb-widget-root")) {
        return;
    }

    // Dynamically load the shared rendering utility relative to the script location
    let renderFormattedMessage;
    try {
        const utilsUrl = currentScript ? new URL('./utils.js', currentScript.src).href : '/static/utils.js';
        const utils = await import(utilsUrl);
        renderFormattedMessage = utils.renderFormattedMessage;
    } catch (e) {
        console.error("Failed to load Mainstreet MFB chat utilities:", e);
        // Safe fallback in case of import failure
        renderFormattedMessage = function(text, container) {
            container.replaceChildren();
            container.textContent = text;
        };
    }

    const root = document.createElement("div");
    root.id = "mainstreetmfb-widget-root";

    const style = document.createElement("style");
    style.textContent = `
        #mainstreetmfb-widget-root {
            position: fixed;
            ${position}: 20px;
            bottom: 20px;
            z-index: 2147483000;
            font-family: "Segoe UI", Arial, sans-serif;
        }

        .msmfb-panel {
            width: min(380px, calc(100vw - 32px));
            height: min(560px, calc(100vh - 96px));
            display: none;
            flex-direction: column;
            margin-bottom: 12px;
            background: #ffffff;
            border: 1px solid #d9e2ea;
            border-radius: 8px;
            box-shadow: 0 18px 50px rgba(15, 23, 42, 0.22);
            overflow: hidden;
        }

        .msmfb-panel.is-open {
            display: flex;
        }

        .msmfb-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px;
            background: ${accentColor};
            color: #ffffff;
        }

        .msmfb-kicker {
            margin: 0 0 2px;
            font-size: 12px;
            line-height: 1.2;
            opacity: 0.82;
        }

        .msmfb-title {
            margin: 0;
            font-size: 18px;
            line-height: 1.2;
            font-weight: 650;
        }

        .msmfb-close {
            width: 32px;
            height: 32px;
            border: 0;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.14);
            color: #ffffff;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
        }

        .msmfb-messages {
            flex: 1;
            overflow-y: auto;
            padding: 14px;
            background: #f8fafc;
        }

        .msmfb-message {
            width: fit-content;
            max-width: 84%;
            margin: 10px 0;
            padding: 10px 12px;
            border-radius: 8px;
            line-height: 1.4;
            font-size: 14px;
            color: #17202a;
            background: #e8eef4;
            overflow-wrap: anywhere;
        }

        .msmfb-message.is-user {
            margin-left: auto;
            background: ${accentColor};
            color: #ffffff;
            text-align: right;
        }

        .msmfb-message a {
            color: ${accentColor};
        }

        .msmfb-message strong {
            font-weight: 700;
        }

        .msmfb-message u {
            text-underline-offset: 3px;
        }

        .msmfb-form {
            display: flex;
            gap: 8px;
            padding: 12px;
            border-top: 1px solid #d9e2ea;
            background: #ffffff;
        }

        .msmfb-input {
            flex: 1;
            min-width: 0;
            padding: 11px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            color: #17202a;
            font-size: 14px;
        }

        .msmfb-send,
        .msmfb-launcher {
            border: 0;
            background: ${accentColor};
            color: #ffffff;
            cursor: pointer;
            font-weight: 650;
        }

        .msmfb-send {
            padding: 11px 14px;
            border-radius: 8px;
        }

        .msmfb-launcher {
            float: ${position};
            min-width: 108px;
            min-height: 44px;
            padding: 12px 16px;
            border-radius: 999px;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.24);
        }

        @media (max-width: 480px) {
            #mainstreetmfb-widget-root {
                left: 12px;
                right: 12px;
                bottom: 12px;
            }

            .msmfb-panel {
                width: 100%;
                height: min(520px, calc(100vh - 84px));
            }
        }
    `;
    root.appendChild(style);

    const panel = document.createElement("div");
    panel.className = "msmfb-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", `${title} ${subtitle}`);

    const header = document.createElement("div");
    header.className = "msmfb-header";

    const titleContainer = document.createElement("div");

    const kicker = document.createElement("p");
    kicker.className = "msmfb-kicker";
    kicker.textContent = title;

    const titleEl = document.createElement("h2");
    titleEl.className = "msmfb-title";
    titleEl.textContent = subtitle;

    titleContainer.appendChild(kicker);
    titleContainer.appendChild(titleEl);

    const closeButton = document.createElement("button");
    closeButton.className = "msmfb-close";
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("aria-label", "Close chat");
    closeButton.textContent = "x";

    header.appendChild(titleContainer);
    header.appendChild(closeButton);

    const messages = document.createElement("div");
    messages.className = "msmfb-messages";
    messages.setAttribute("aria-live", "polite");

    const form = document.createElement("form");
    form.className = "msmfb-form";

    const input = document.createElement("input");
    input.className = "msmfb-input";
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", "How can I help you?");
    input.setAttribute("autocomplete", "off");

    const sendButton = document.createElement("button");
    sendButton.className = "msmfb-send";
    sendButton.setAttribute("type", "submit");
    sendButton.textContent = "Send";

    form.appendChild(input);
    form.appendChild(sendButton);

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(form);

    const launcher = document.createElement("button");
    launcher.className = "msmfb-launcher";
    launcher.setAttribute("type", "button");
    launcher.setAttribute("aria-expanded", "false");
    launcher.textContent = buttonLabel;

    root.appendChild(panel);
    root.appendChild(launcher);

    document.body.appendChild(root);

    const conversationHistory = [];
    const welcomeMessage = "Hi, I'm Joy from Mainstreet Microfinance Bank, a bot to answer your questions.";

    addMessage(welcomeMessage, "bot");

    launcher.addEventListener("click", () => {
        const isOpen = panel.classList.toggle("is-open");
        launcher.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
            input.focus();
        }
    });

    closeButton.addEventListener("click", () => {
        panel.classList.remove("is-open");
        launcher.setAttribute("aria-expanded", "false");
        launcher.focus();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) {
            return;
        }

        addMessage(question, "user");
        input.value = "";
        sendButton.disabled = true;
        sendButton.textContent = "Sending";

        try {
            const response = await fetch(`${apiBaseUrl}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question,
                    history: conversationHistory.slice(-8)
                })
            });

            if (!response.ok) {
                throw new Error("Request failed");
            }

            const data = await response.json();
            addMessage(data.answer || "I do not have an answer for that yet.", "bot");
            conversationHistory.push({ role: "user", content: question });
            conversationHistory.push({ role: "assistant", content: data.answer || "" });
        } catch (error) {
            addMessage("I could not reach the assistant. Please try again.", "bot");
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = "Send";
        }
    });

    function addMessage(text, type) {
        const message = document.createElement("div");
        message.className = `msmfb-message ${type === "user" ? "is-user" : ""}`;
        if (type === "user") {
            message.textContent = text;
        } else {
            renderFormattedMessage(text, message);
        }
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    }
}());
