// ================= SAFE QUERY =================
function safeQuery(selector) {
    return document.querySelector(selector);
}

// ================= SETUP CHECK =================
(function () {
    // Old key cleanup — agar purani key hai toh remove karo
    const oldSetup = localStorage.getItem("setupComplete");
    if (oldSetup) {
        localStorage.removeItem("setupComplete");
    }
})();

// ================= RECENT CHAT HISTORY =================
const MAX_RECENT = 8;

function getRecentChats() {
    return JSON.parse(localStorage.getItem("recentChats") || "[]");
}

function saveRecentChat(text) {
    if (!text.trim()) return;

    let chats = getRecentChats();
    chats = chats.filter((c) => c.text !== text.trim());
    chats.unshift({
        text: text.trim().substring(0, 38) + (text.trim().length > 38 ? "..." : ""),
        pinned: false,
        time: Date.now(),
    });
    if (chats.length > MAX_RECENT) chats = chats.slice(0, MAX_RECENT);
    localStorage.setItem("recentChats", JSON.stringify(chats));
    renderRecentChats();
}

function togglePin(index) {
    let chats = getRecentChats();
    if (chats[index] === undefined) return;
    chats[index].pinned = !chats[index].pinned;
    localStorage.setItem("recentChats", JSON.stringify(chats));
    renderRecentChats();
}

function renderRecentChats() {
    const list = document.querySelector(".recent-list");
    if (!list) return;

    const chats = getRecentChats();

    if (chats.length === 0) {
        list.innerHTML = '<p class="recent-empty">No recent chats yet</p>';
        return;
    }

    const sorted = [...chats]
        .map((c, i) => ({ ...c, originalIndex: i }))
        .sort((a, b) => b.pinned - a.pinned);

    list.innerHTML = sorted
        .map(
            (chat) => `
        <div class="recent-item ${chat.pinned ? "pinned" : ""}"
             onclick="loadRecentChat('${chat.text.replace(/'/g, "\\'")}')">
            <span class="recent-text">${chat.text}</span>
            <span class="pin-icon ${chat.pinned ? "active" : ""}"
                  onclick="event.stopPropagation(); togglePin(${chat.originalIndex})"
                  title="${chat.pinned ? "Unpin" : "Pin"}">
                <i class="${chat.pinned ? "ri-pushpin-fill" : "ri-pushpin-line"}"></i>
            </span>
        </div>`
        )
        .join("");
}

function loadRecentChat(text) {
    const chatInput = document.getElementById("chatInput");
    const mainInput = document.getElementById("mainInput");

    if (chatInput && document.getElementById("chatSection")?.style.display !== "none") {
        chatInput.value = text;
        chatInput.focus();
    } else if (mainInput) {
        mainInput.value = text;
        mainInput.focus();
    }
}

window.togglePin = togglePin;
window.loadRecentChat = loadRecentChat;

// ================= DYNAMIC USER INFO (FIREBASE) =================
function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function setAvatar(el, photoURL, initials) {
    if (!el) return;
    if (photoURL) {
        el.innerHTML = `<img src="${photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        el.textContent = initials;
    }
}

function loadUserInfo() {
    if (typeof firebase === "undefined") return;

    const firebaseConfig = {
        apiKey: "AIzaSyBYLS84ZfBdxO8FeIHhgO5ZvbmWBrsarEQ",
        authDomain: "brainwave-ai-80d64.firebaseapp.com",
        projectId: "brainwave-ai-80d64",
        storageBucket: "brainwave-ai-80d64.appspot.com",
        messagingSenderId: "303848893322",
        appId: "1:303848893322:web:60eb231d7d9ed07ce0f673",
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();

    auth.onAuthStateChanged((user) => {
        if (!user) {
            // FIX: sirf dashboard.html se hi redirect karo — loop nahi hoga
            if (window.location.pathname.includes("dashboard.html")) {
                window.location.href = "../Pages/account.html";
            }
            return;
        }

        // FIX: email correctly lena — providerData se fallback
        const name = user.displayName || user.providerData?.[0]?.displayName || user.email.split("@")[0];
        const email = user.email || user.providerData?.[0]?.email || "";
        const photoURL = user.photoURL || user.providerData?.[0]?.photoURL || "";
        const initials = getInitials(name);

        // Sidebar avatar
        const sidebarAvatarEl = document.getElementById("sidebarAvatarText");
        setAvatar(sidebarAvatarEl, photoURL, initials);

        // Dropdown avatar
        const dropdownAvatarEl = document.getElementById("dropdownAvatarText");
        setAvatar(dropdownAvatarEl, photoURL, initials);

        const sidebarUserName = document.getElementById("sidebarUserName");
        const sidebarUserEmail = document.getElementById("sidebarUserEmail");
        const dropdownUserName = document.getElementById("dropdownUserName");
        const dropdownUserEmail = document.getElementById("dropdownUserEmail");

        if (sidebarUserName) sidebarUserName.textContent = name;
        if (sidebarUserEmail) sidebarUserEmail.textContent = email;
        if (dropdownUserName) dropdownUserName.textContent = name.toUpperCase();
        if (dropdownUserEmail) dropdownUserEmail.textContent = email;
    });
}

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

    renderRecentChats();
    loadUserInfo();
});

// ================= ELEMENTS (Setup page ke liye) =================
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
        document.querySelectorAll('[data-type="personality"]').forEach((b) => b.classList.remove("active"));
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

    const personality = document.querySelector('[data-type="personality"].active');
    const interests = document.querySelectorAll('[data-type="interest"].active');

    if (!personality) {
        alert("Please select a personality");
        return;
    }
    if (interests.length === 0) {
        alert("Please select at least one interest");
        return;
    }

    // FIX: UID ke saath save karo taaki auth.js ke saath match kare
    if (typeof firebase !== "undefined" && firebase.apps.length) {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            localStorage.setItem("setupComplete_" + currentUser.uid, "true");
        }
    }

    window.location.href = "dashboard.html";
});

// ================= YEAR =================
const yearEl = safeQuery("#year");
if (yearEl) yearEl.innerText = new Date().getFullYear();

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
            if (typeof firebase !== "undefined" && firebase.apps.length) {
                firebase.auth().signOut().then(() => {
                    // FIX: index.html pe bhejo — account.html loop se bachao
                    window.location.href = "../index.html";
                });
            } else {
                window.location.href = "../index.html";
            }
        }, 1500);
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
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
        return cards[0].offsetWidth + 24;
    }

    function updateSlider() {
        track.style.transform = `translateX(${-(index * getCardWidth())}px)`;
    }

    nextBtn?.addEventListener("click", () => {
        if (index < cards.length - 1) { index++; updateSlider(); }
    });

    prevBtn?.addEventListener("click", () => {
        if (index > 0) { index--; updateSlider(); }
    });

    window.addEventListener("resize", updateSlider);
});

// ================= CHAT =================
document.addEventListener("DOMContentLoaded", () => {

    const emptyState = document.getElementById("emptyState");
    const chatSection = document.getElementById("chatSection");
    const chatInputSection = document.getElementById("chatInputSection");
    const mainInput = document.getElementById("mainInput");
    const startChatBtn = document.getElementById("startChatBtn");
    const chatContainer = document.getElementById("chatContainer");
    const chatInput = document.getElementById("chatInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");

    let chatHistory = [];

    function addMessage(text, type) {
        if (!chatContainer) return;
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", type);
        messageDiv.innerHTML = `<div class="message-bubble">${text}</div>`;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showTypingLoader() {
        if (!chatContainer) return null;
        const loaderDiv = document.createElement("div");
        loaderDiv.classList.add("message", "ai");
        loaderDiv.innerHTML = `
            <div class="message-bubble">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>`;
        chatContainer.appendChild(loaderDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return function replaceWithText(text) {
            loaderDiv.querySelector(".message-bubble").innerHTML = text;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        };
    }

    async function generateResponse(input) {
        try {
            chatHistory.push({ role: "user", content: input });
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
            if (data.error) return "API Error: " + data.error.message;
            const reply = data.choices?.[0]?.message?.content || "No response 😅";
            chatHistory.push({ role: "assistant", content: reply });
            return reply;
        } catch (error) {
            console.error(error);
            return "Network error ❌";
        }
    }

    async function startChat(message) {
        if (!message || !message.trim()) return;
        saveRecentChat(message);
        if (emptyState) emptyState.style.display = "none";
        if (chatSection) chatSection.style.display = "block";
        if (chatInputSection) chatInputSection.style.display = "block";
        addMessage(message, "user");
        const replaceWithText = showTypingLoader();
        const reply = await generateResponse(message);
        replaceWithText(reply);
    }

    async function sendChatMessage() {
        if (!chatInput) return;
        const message = chatInput.value.trim();
        if (!message) return;
        saveRecentChat(message);
        addMessage(message, "user");
        chatInput.value = "";
        const replaceWithText = showTypingLoader();
        const reply = await generateResponse(message);
        replaceWithText(reply);
    }

    mainInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            startChat(mainInput.value.trim());
            mainInput.value = "";
        }
    });

    startChatBtn?.addEventListener("click", () => {
        startChat(mainInput.value.trim());
        mainInput.value = "";
    });

    chatInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendChatMessage();
    });

    sendMessageBtn?.addEventListener("click", sendChatMessage);

    window.startChat = startChat;
});
