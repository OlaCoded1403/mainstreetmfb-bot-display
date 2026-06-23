import { renderFormattedMessage } from './utils.js';

const button = document.getElementById("send-btn");
const questionInput = document.getElementById("question");
const chatBox = document.getElementById("chat-box");
const conversationHistory = [];
const welcomeMessage = "Hi, I'm Joy from Mainstreet Microfinance Bank, a bot to answer your questions.";

function addMessage(text, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = type;

    if (type === "user") {
        const strong = document.createElement("strong");
        strong.textContent = "You: ";
        messageDiv.appendChild(strong);
        messageDiv.appendChild(document.createTextNode(text));
    } else {
        renderFormattedMessage(text, messageDiv);
    }

    chatBox.appendChild(messageDiv);
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
