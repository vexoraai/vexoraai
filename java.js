
    // **IMPORTANT: Replace with your actual API key!**
const apiKey = "AIzaSyAp7Ez5f7Jm5YQQigp3cKr0rbo0t1qn2jM";
const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey;

const promptInput = document.getElementById("prompt");
const submitButton = document.getElementById("submit-button");
const chatMessages = document.getElementById("chat-messages");
const errorMessage = document.getElementById("error-message");

const chatHistory = [];

submitButton.addEventListener("click", async () => {
    const promptValue = promptInput.value.trim();

    if (!promptValue) {
        errorMessage.textContent = "Please enter a prompt.";
        errorMessage.style.display = "block";
        return;
    } else {
        errorMessage.style.display = "none";
    }

    // Add user message to chat
    addUserMessage(promptValue);
    promptInput.value = ""; // Clear input

    try {
        // Disable button while loading
        submitButton.disabled = true;
        submitButton.textContent = "Generating...";

        // Fetch Gemini Response & Wikipedia Image in Parallel
        const [geminiResponse, wikiData] = await Promise.allSettled([
            fetchGeminiResponse(promptValue),
            fetchWikipediaData(promptValue)
        ]);

        let geminiText = geminiResponse.status === "fulfilled" ? geminiResponse.value : null;
        let wikiSummary = wikiData.status === "fulfilled" ? wikiData.value.summary : null;
        let wikiImage = wikiData.status === "fulfilled" ? wikiData.value.image : null;

        // If Gemini's response contains an apology, use Wikipedia summary instead
        if (geminiText && (geminiText.includes("I'm sorry") || geminiText.includes("I am not able") || geminiText.includes("sorry") )) {
            geminiText = wikiSummary || "I can't understand your question or I might not have enough knowledge about it at the moment. You can try rephrasing it, or I can look it up for you!";
        }

        // Show the response on screen
        addBotMessage(geminiText, wikiImage);

    } catch (error) {
        console.error("Error:", error);
        errorMessage.textContent = "Sorry, I couldn't process your request. Please try again.";
        errorMessage.style.display = "block";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Generate";
    }
});

// ✅ Fetch Gemini AI Response
async function fetchGeminiResponse(prompt) {
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("Unexpected response from Gemini API.");
    }
}

// ✅ Fetch Wikipedia Summary & Image
async function fetchWikipediaData(query) {
    const wikiApiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

    try {
        const response = await fetch(wikiApiUrl);
        if (!response.ok) return { summary: null, image: null };

        const data = await response.json();
        return {
            summary: data.extract || null, // Wikipedia summary text
            image: data.thumbnail?.source || null // Wikipedia image
        };
    } catch (error) {
        console.error("Wikipedia API error:", error);
        return { summary: null, image: null };
    }
}

// ✅ Add User Message to Chat
function addUserMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "user");
    messageDiv.innerHTML = `<p class="message-text">${text}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}

// ✅ Add Bot Message with Optional Wikipedia Image
function addBotMessage(text, imageUrl) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "bot");
    messageDiv.innerHTML = `
        <p class="message-text">${text}</p>
        ${imageUrl ? `<img src="${imageUrl}" alt="Wikipedia Image" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">` : ""}
        <div class="message-actions">
            <button onclick="speakText('${encodeURIComponent(text)}')">🔊</button>
            <button onclick="copyToClipboard('${encodeURIComponent(text)}')">📋</button>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}

// ✅ Text-to-Speech
function speakText(encodedText) {
    const text = decodeURIComponent(encodedText);
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

// ✅ Copy to Clipboard
function copyToClipboard(encodedText) {
    const text = decodeURIComponent(encodedText);
    navigator.clipboard.writeText(text);
}

function saveChatHistory() {
    localStorage.setItem("chatHistory", chatMessages.innerHTML);
}

function loadChatHistory() {
    chatMessages.innerHTML = localStorage.getItem("chatHistory") || "";
}

// Call this function after adding a bot message
function addBotMessage(text, imageUrl) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "bot");
    messageDiv.innerHTML = `
        <p class="message-text">${text}</p>
        ${imageUrl ? `<img src="${imageUrl}" alt="Wikipedia Image" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">` : ""}
        <div class="message-actions">
            <button onclick="speakText('${encodeURIComponent(text)}')">🔊</button>
            <button onclick="copyToClipboard('${encodeURIComponent(text)}')">📋</button>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll

    // 🔹 Save chat history including the bot message
    saveChatHistory();
}

window.onload = loadChatHistory;

    document.getElementById("clear-chat").addEventListener("click", () => {
    localStorage.removeItem("chatHistory");
    chatMessages.innerHTML = "";
});

