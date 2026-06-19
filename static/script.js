const button = document.getElementById("send-btn");
const questionInput = document.getElementById("question");
const chatBox = document.getElementById("chat-box");

button.addEventListener("click", async () => {

    const question = questionInput.value;

    if (!question) return;

    chatBox.innerHTML += `
        <div class="user">
            <strong>You:</strong> ${question}
        </div>
    `;

    questionInput.value = "";

    const response = await fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            question
        })
    });

    const data = await response.json();

    chatBox.innerHTML += `
    <div class="bot">
        ${data.answer.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')}
    </div>
`;

    chatBox.scrollTop = chatBox.scrollHeight;
});