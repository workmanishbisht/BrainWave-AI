// ================= SAFE QUERY =================
function safeQuery(selector) {
    return document.querySelector(selector);
}

// ================= SETUP CHECK (FIXED) =================
(function () {
    const isSetupDone = localStorage.getItem("setupComplete");

    if (
        window.location.pathname.includes("setup.html") &&
        isSetupDone === "true"
    ) {
        window.location.href = "dashboard.html";
    }
})();

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggleSidebar");
    const mobileBtn = document.getElementById("mobileMenu");

    const profileToggle = document.querySelector(".profile-toggle");
    const dropdown = document.querySelector(".sidebar-dropdown");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle("active");
            } else {
                sidebar.classList.toggle("collapsed");
            }
        });
    }

    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("active");
        });
    }

    document.addEventListener("click", (e) => {
        if (
            window.innerWidth <= 768 &&
            sidebar &&
            sidebar.classList.contains("active") &&
            !sidebar.contains(e.target) &&
            mobileBtn &&
            !mobileBtn.contains(e.target)
        ) {
            sidebar.classList.remove("active");
        }
    });

    if (profileToggle && dropdown) {
        profileToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (
                dropdown &&
                !dropdown.contains(e.target) &&
                !profileToggle.contains(e.target)
            ) {
                dropdown.classList.remove("show");
            }
        });
    }
});

// ================= ELEMENTS =================
const step1 = safeQuery("#step1");
const step2 = safeQuery("#step2");
const btn = safeQuery("#goStep2");
const finishBtn = safeQuery("#finishSetup");

const title = safeQuery("#setupTitle");
const stepText = safeQuery("#setupStep");
const progress = safeQuery("#progressBar");

const fullName = safeQuery("#fullName");
const username = safeQuery("#username");
const phone = safeQuery("#phone");
const bio = safeQuery("#bio");

const fileInput = safeQuery("#profileInput");
const uploadTrigger = safeQuery("#uploadTrigger");
const previewImg = safeQuery("#previewImg");
const uploadIcon = safeQuery("#uploadIcon");

let uploadedImage = null;

// ================= PROGRESS =================
function updateProgress() {
    if (!progress) return;

    let total = 5;
    let filled = 0;

    if (fullName?.value.trim()) filled++;
    if (username?.value.trim()) filled++;
    if (phone?.value.trim()) filled++;
    if (bio?.value.trim()) filled++;
    if (uploadedImage) filled++;

    progress.style.width = (filled / total) * 100 + "%";
}

// ================= IMAGE UPLOAD =================
if (uploadTrigger && fileInput) {
    uploadTrigger.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Image must be less than 5MB");
            fileInput.value = "";
            return;
        }

        uploadedImage = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            if (previewImg) {
                previewImg.src = e.target.result;
                previewImg.style.display = "block";
            }
            if (uploadIcon) uploadIcon.style.display = "none";
        };
        reader.readAsDataURL(file);

        updateProgress();
    });
}

// ================= INPUT LISTENER =================
[fullName, username, phone, bio].forEach((input) => {
    input?.addEventListener("input", updateProgress);
});

// ================= VALIDATION =================
function validateStep1() {
    let valid = true;

    [fullName, username, phone, bio].forEach((input) => {
        if (input) {
            if (!input.value.trim()) {
                input.style.borderColor = "red";
                valid = false;
            } else {
                input.style.borderColor = "#e5e7eb";
            }
        }
    });

    if (!uploadedImage && fileInput) {
        alert("Please upload profile image");
        valid = false;
    }

    return valid;
}

// ================= STEP SWITCH =================
btn?.addEventListener("click", () => {
    if (!validateStep1()) return;

    step1?.classList.add("hidden");
    step2?.classList.remove("hidden");

    if (title) title.innerText = "Preferences Setup";
    if (stepText) stepText.innerText = "Step 2 of 2";
    if (progress) progress.style.width = "100%";
});

// ================= PERSONALITY =================
document.querySelectorAll('[data-type="personality"]').forEach((el) => {
    el.addEventListener("click", () => {
        document
            .querySelectorAll('[data-type="personality"]')
            .forEach((b) => b.classList.remove("active"));
        el.classList.add("active");
    });
});

// ================= INTEREST =================
document.querySelectorAll('[data-type="interest"]').forEach((el) => {
    el.addEventListener("click", () => {
        el.classList.toggle("active");
    });
});

// ================= FINISH SETUP =================
finishBtn?.addEventListener("click", () => {
    if (!validateStep1()) {
        alert("Please complete all details");
        return;
    }

    const personality = document.querySelector(
        '[data-type="personality"].active'
    );
    const interests = document.querySelectorAll(
        '[data-type="interest"].active'
    );

    if (!personality) {
        alert("Please select a personality");
        return;
    }

    if (interests.length === 0) {
        alert("Please select at least one interest");
        return;
    }

    localStorage.setItem("setupComplete", "true");

    // ✅ FIXED REDIRECT PATH
    window.location.href = "dashboard.html";
});

// ================= YEAR =================
const yearEl = safeQuery("#year");
if (yearEl) {
    yearEl.innerText = new Date().getFullYear();
}

// ================= LOGOUT =================
document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.querySelector(".dropdown-item.logout");

    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    logoutBtn?.addEventListener("click", () => {
        showToast("Logging out...");

        setTimeout(() => {
            localStorage.removeItem("setupComplete");

            window.location.href = "../index.html";
        }, 2000);
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
});


// ================= TESTIMONIALS =================
document.addEventListener("DOMContentLoaded", () => {
    const track = document.querySelector(".testimonial-track");
    const cards = document.querySelectorAll(".testimonial-card");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");

    if (!track || cards.length === 0) return;

    let index = 0;

    function getCardWidth() {
        const card = cards[0];
        const gap = 24; // 1.5rem ≈ 24px
        return card.offsetWidth + gap;
    }

    function updateSlider() {
        const moveX = -(index * getCardWidth());
        track.style.transform = `translateX(${moveX}px)`;
    }

    nextBtn?.addEventListener("click", () => {
        if (index < cards.length - 1) {
            index++;
            updateSlider();
        }
    });

    prevBtn?.addEventListener("click", () => {
        if (index > 0) {
            index--;
            updateSlider();
        }
    });

    // optional: resize fix
    window.addEventListener("resize", updateSlider);
});


// ================= FIX PIN TOGGLE =================
document.addEventListener("DOMContentLoaded", () => {

    const items = document.querySelectorAll(".recent-item");

    items.forEach((item, index) => {

        const pin = item.querySelector(".pin-icon");

        // 🔹 Load saved state
        const saved = localStorage.getItem("pin_" + index);
        if (saved === "true") {
            pin.classList.add("active");
            item.classList.add("pinned");
        }

        // 🔹 CLICK EVENT
        pin.addEventListener("click", (e) => {
            e.stopPropagation();

            // toggle class
            pin.classList.toggle("active");
            item.classList.toggle("pinned");

            // save state
            const isActive = pin.classList.contains("active");
            localStorage.setItem("pin_" + index, isActive);
        });

    });

});



document.addEventListener("DOMContentLoaded", () => {

    // ================= ELEMENTS =================
    const emptyState = document.getElementById("emptyState");
    const chatSection = document.getElementById("chatSection");
    const chatInputSection = document.getElementById("chatInputSection");

    const mainInput = document.getElementById("mainInput");
    const startChatBtn = document.getElementById("startChatBtn");

    const chatContainer = document.getElementById("chatContainer");
    const chatInput = document.getElementById("chatInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");

    // ================= CHAT HISTORY =================
    let chatHistory = [];

    // ================= ADD MESSAGE =================
    function addMessage(text, type) {
        if (!chatContainer) return;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", type);

        messageDiv.innerHTML = `
            <div class="message-bubble">${text}</div>
        `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // ================= AI RESPONSE =================
    async function generateResponse(input) {
        try {
            // user message save
            chatHistory.push({
                role: "user",
                content: input
            });

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer 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",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: "meta-llama/llama-3-8b-instruct",
                    messages: chatHistory
                })
            });

            const data = await response.json();
            console.log("API:", data);

            if (data.error) {
                return "API Error: " + data.error.message;
            }

            const reply = data.choices?.[0]?.message?.content || "No response 😅";

            // AI response save
            chatHistory.push({
                role: "assistant",
                content: reply
            });

            return reply;

        } catch (error) {
            console.error(error);
            return "Network error ❌";
        }
    }

    // ================= START CHAT =================
    async function startChat(message) {
        if (!message || !message.trim()) return;

        emptyState.style.display = "none";
        chatSection.style.display = "block";
        chatInputSection.style.display = "block";

        addMessage(message, "user");

        // typing
        addMessage("Typing...", "ai");

        const reply = await generateResponse(message);

        // remove typing
        chatContainer.lastChild.remove();

        addMessage(reply, "ai");
    }

    // ================= SEND MESSAGE =================
    async function sendChatMessage() {
        const message = chatInput.value;

        if (!message || !message.trim()) return;

        addMessage(message, "user");
        chatInput.value = "";

        addMessage("Typing...", "ai");

        const reply = await generateResponse(message);

        chatContainer.lastChild.remove();

        addMessage(reply, "ai");
    }

    // ================= EVENTS =================

    // HOME INPUT
    mainInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            startChat(mainInput.value);
            mainInput.value = "";
        }
    });

    // HOME BUTTON
    startChatBtn?.addEventListener("click", () => {
        startChat(mainInput.value);
        mainInput.value = "";
    });

    // CHAT INPUT
    chatInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendChatMessage();
        }
    });

    // SEND BUTTON
    sendMessageBtn?.addEventListener("click", sendChatMessage);

});
