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


// ================= CHAT INIT =================
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


    // ================= ADD MESSAGE =================
    function addMessage(text, type) {
        if (!chatContainer) return;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", type);

        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${text}
            </div>
        `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }


    // ================= AI RESPONSE =================
    async function generateResponse(input) {
        try {
            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyDG0G2drAGcEP4lWlYxCXo4A5qLmfQ4M4A",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: input }]
                            }
                        ]
                    }),
                }
            );

            const data = await response.json();
            console.log(data);

            return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

        } catch (error) {
            console.error(error);
            return "Error getting response ❌";
        }
    }


    // ================= START CHAT =================
    async function startChat(message) {
        if (!message || !message.trim()) return;

        if (emptyState) emptyState.style.display = "none";
        if (chatSection) chatSection.style.display = "block";
        if (chatInputSection) chatInputSection.style.display = "block";

        addMessage(message, "user");

        addMessage("Typing...", "ai");

        const reply = await generateResponse(message);

        if (chatContainer && chatContainer.lastChild) {
            chatContainer.lastChild.remove();
        }

        addMessage(reply, "ai");
    }


    // ================= SEND MESSAGE =================
    async function sendChatMessage() {
        if (!chatInput) return;

        const message = chatInput.value;

        if (!message || !message.trim()) return;

        addMessage(message, "user");
        chatInput.value = "";

        addMessage("Typing...", "ai");

        const reply = await generateResponse(message);

        if (chatContainer && chatContainer.lastChild) {
            chatContainer.lastChild.remove();
        }

        addMessage(reply, "ai");
    }


    // ================= EVENTS =================

    // HOME INPUT
    if (mainInput) {
        mainInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                startChat(mainInput.value);
                mainInput.value = "";
            }
        });
    }

    // HOME BUTTON
    if (startChatBtn && mainInput) {
        startChatBtn.addEventListener("click", function () {
            startChat(mainInput.value);
            mainInput.value = "";
        });
    }

    // CHAT INPUT
    if (chatInput) {
        chatInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                sendChatMessage();
            }
        });
    }

    // SEND BUTTON
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener("click", sendChatMessage);
    }

});
