const button = document.getElementById("send-btn");
const questionInput = document.getElementById("question");
const chatBox = document.getElementById("chat-box");
const conversationHistory = [];
const welcomeMessage = "Hi, I'm Joy from Mainstreet Microfinance Bank, a bot to answer your questions.";

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[char]));
}

function linkify(value) {
    return escapeHtml(value).replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

function formatAnswer(value) {
    return linkify(value)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.+?)__/g, "<u>$1</u>")
        .replace(/\n/g, "<br>");
}

function addMessage(text, type) {
    chatBox.innerHTML += `
        <div class="${type}">
            ${type === "user" ? `<strong>You:</strong> ${escapeHtml(text)}` : formatAnswer(text)}
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
}

addMessage(welcomeMessage, "bot");

async function sendQuestion() {

    const question = questionInput.value.trim();

    if (!question) return;

    addMessage(question, "user");

    questionInput.value = "";
    button.disabled = true;
    button.textContent = "Sending";

    try {
        const response = await fetch("/chat", {
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

        addMessage(data.answer, "bot");
        conversationHistory.push({ role: "user", content: question });
        conversationHistory.push({ role: "assistant", content: data.answer });
    } catch (error) {
        addMessage("I could not reach the assistant. Please try again.", "bot");
    } finally {
        button.disabled = false;
        button.textContent = "Send";
    }
}

button.addEventListener("click", sendQuestion);
questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendQuestion();
    }
});
