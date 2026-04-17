// ================= SAFE QUERY =================
function safeQuery(selector) {
    return document.querySelector(selector);
}

// ================= SETUP CHECK =================
(function () {
    const oldSetup = localStorage.getItem("setupComplete");
    if (oldSetup) {
        localStorage.removeItem("setupComplete");
    }
})();

// ================= CHAT SESSION MANAGER =================
const MAX_RECENT = 8;

function getSessions() {
    return JSON.parse(localStorage.getItem("chatSessions") || "[]");
}

function saveSessions(sessions) {
    localStorage.setItem("chatSessions", JSON.stringify(sessions));
}

function createSession(firstMessage) {
    const id = "session_" + Date.now();
    const session = {
        id,
        title: firstMessage.trim().substring(0, 38) + (firstMessage.trim().length > 38 ? "..." : ""),
        pinned: false,
        time: Date.now(),
        messages: []
    };
    const sessions = getSessions();
    sessions.unshift(session);
    if (sessions.length > MAX_RECENT) sessions.splice(MAX_RECENT);
    saveSessions(sessions);
    return id;
}

function updateSessionMessages(sessionId, messages) {
    const sessions = getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx !== -1) {
        sessions[idx].messages = messages;
        saveSessions(sessions);
    }
}

function getSession(sessionId) {
    return getSessions().find(s => s.id === sessionId) || null;
}

function togglePin(index) {
    const sessions = getSessions();
    if (!sessions[index]) return;
    sessions[index].pinned = !sessions[index].pinned;
    saveSessions(sessions);
    renderRecentChats();
    showToast(sessions[index].pinned ? "Chat pinned 📌" : "Chat unpinned");
}

function deleteSession(sessionId) {
    let sessions = getSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(sessions);
    
    if (window.__activeSessionId === sessionId) {
        window.__activeSessionId = null;
        if (typeof resetToNewChat === 'function') {
            resetToNewChat();
        }
    }
    
    renderRecentChats();
    showToast("Chat deleted", "success");
}

function renameSession(sessionId, newTitle) {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        session.title = newTitle.substring(0, 38) + (newTitle.length > 38 ? "..." : "");
        saveSessions(sessions);
        renderRecentChats();
        showToast("Chat renamed", "success");
    }
}

// ================= TOAST NOTIFICATION =================
function showToast(message, type = 'info') {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast-notification ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ================= MODAL MANAGEMENT =================
let currentModalSessionId = null;

function showChatOptionsModal(sessionId, event) {
    event.stopPropagation();
    currentModalSessionId = sessionId;
    
    const session = getSession(sessionId);
    if (!session) return;
    
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="chat-options-modal" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3>Chat Options</h3>
                <p>${session.title}</p>
            </div>
            <div class="modal-body">
                <div class="modal-option" onclick="handleRenameClick('${sessionId}')">
                    <i class="ri-edit-line"></i>
                    <div class="option-content">
                        <div class="option-title">Rename</div>
                        <div class="option-desc">Give this chat a new name</div>
                    </div>
                </div>
                <div class="modal-option" onclick="handlePinClick('${sessionId}')">
                    <i class="${session.pinned ? 'ri-unpin-line' : 'ri-pushpin-line'}"></i>
                    <div class="option-content">
                        <div class="option-title">${session.pinned ? 'Unpin' : 'Pin'}</div>
                        <div class="option-desc">${session.pinned ? 'Remove from top' : 'Keep at the top'}</div>
                    </div>
                </div>
                <div class="modal-option" onclick="handleShareClick('${sessionId}')">
                    <i class="ri-share-line"></i>
                    <div class="option-content">
                        <div class="option-title">Share</div>
                        <div class="option-desc">Export or share this chat</div>
                    </div>
                </div>
                <div class="modal-option danger" onclick="handleDeleteClick('${sessionId}')">
                    <i class="ri-delete-bin-line"></i>
                    <div class="option-content">
                        <div class="option-title">Delete</div>
                        <div class="option-desc">Permanently remove this chat</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', closeModal);
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    currentModalSessionId = null;
}

function showRenameInput(sessionId) {
    const session = getSession(sessionId);
    if (!session) return;
    
    const modal = document.querySelector('.chat-options-modal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-header">
            <h3>Rename Chat</h3>
            <p>Enter a new name for this conversation</p>
        </div>
        <div class="rename-input-container">
            <input type="text" 
                   class="rename-input" 
                   id="renameInput" 
                   value="${session.title.replace('...', '')}" 
                   maxlength="50"
                   placeholder="Chat name">
            <div class="rename-actions">
                <button class="rename-btn save" onclick="handleRenameSave('${sessionId}')">Save</button>
                <button class="rename-btn cancel" onclick="showChatOptionsModal('${sessionId}', event)">Cancel</button>
            </div>
        </div>
    `;
    
    setTimeout(() => document.getElementById('renameInput')?.focus(), 100);
    
    const input = document.getElementById('renameInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleRenameSave(sessionId);
            }
        });
    }
}

// ================= MODAL ACTION HANDLERS =================
window.handleRenameClick = function(sessionId) {
    showRenameInput(sessionId);
};

window.handleRenameSave = function(sessionId) {
    const input = document.getElementById('renameInput');
    if (input && input.value.trim()) {
        renameSession(sessionId, input.value.trim());
        closeModal();
    }
};

window.handlePinClick = function(sessionId) {
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
        togglePin(index);
        closeModal();
    }
};

window.handleShareClick = function(sessionId) {
    const session = getSession(sessionId);
    if (!session) return;
    
    const shareText = `BrainWave AI Chat: ${session.title}\n${new Date(session.time).toLocaleString()}\n\n`;
    const messageText = session.messages.map(m => 
        `${m.role === 'user' ? 'You' : 'AI'}: ${m.raw || unescapeHtml(m.text)}`
    ).join('\n\n');
    
    const fullText = shareText + messageText;
    
    navigator.clipboard?.writeText(fullText).then(() => {
        showToast("Chat copied to clipboard", "success");
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast("Chat copied to clipboard", "success");
    });
    
    closeModal();
};

window.handleDeleteClick = function(sessionId) {
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
        deleteSession(sessionId);
        closeModal();
    }
};

window.closeModal = closeModal;
window.showChatOptionsModal = showChatOptionsModal;

// ================= RENDER RECENT CHATS =================
function renderRecentChats() {
    const list = document.querySelector(".recent-list");
    if (!list) return;

    const sessions = getSessions();

    if (sessions.length === 0) {
        list.innerHTML = '<p class="recent-empty">No recent chats yet</p>';
        return;
    }

    const sorted = [...sessions]
        .map((s, i) => ({ ...s, originalIndex: i }))
        .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.time - a.time;
        });

    list.innerHTML = sorted.map(session => `
        <div class="recent-item ${session.pinned ? "pinned" : ""} ${window.__activeSessionId === session.id ? "active-session" : ""}"
             onclick="loadSession('${session.id}')">
            <span class="recent-text">${session.title}</span>
            ${session.pinned ? '<i class="ri-pushpin-fill pin-icon active"></i>' : ''}
            <span class="recent-options-btn" onclick="showChatOptionsModal('${session.id}', event)">
                <i class="ri-more-2-fill"></i>
            </span>
        </div>`
    ).join("");
}

window.togglePin = togglePin;

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
            if (window.location.pathname.includes("dashboard.html")) {
                window.location.href = "../Pages/account.html";
            }
            return;
        }

        const name = user.displayName || user.providerData?.[0]?.displayName || user.email.split("@")[0];
        const email = user.email || user.providerData?.[0]?.email || "";
        const photoURL = user.photoURL || user.providerData?.[0]?.photoURL || "";
        const initials = getInitials(name);

        const sidebarAvatarEl = document.getElementById("sidebarAvatarText");
        setAvatar(sidebarAvatarEl, photoURL, initials);

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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    const newChatNavItem = document.querySelector(".nav-item.active");
    if (newChatNavItem) {
        newChatNavItem.addEventListener("click", () => {
            resetToNewChat();
        });
    }

    document.querySelectorAll(".nav-item").forEach(item => {
        const text = item.querySelector(".nav-text")?.textContent?.trim();
        if (text === "New Chat") {
            item.addEventListener("click", () => resetToNewChat());
        }
    });

    renderRecentChats();
    loadUserInfo();
});

// ================= SETUP PAGE ELEMENTS =================
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

function updateProgress() {
    if (!progress) return;
    let total = 3;
    let filled = 0;
    if (fullName?.value.trim()) filled++;
    if (username?.value.trim()) filled++;
    if (phone?.value.trim()) filled++;
    progress.style.width = (filled / total) * 100 + "%";
}

if (uploadTrigger && fileInput) {
    uploadTrigger.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); fileInput.value = ""; return; }
        uploadedImage = file;
        const reader = new FileReader();
        reader.onload = function (e) {
            if (previewImg) { previewImg.src = e.target.result; previewImg.style.display = "block"; }
            if (uploadIcon) uploadIcon.style.display = "none";
        };
        reader.readAsDataURL(file);
        updateProgress();
    });
}

[fullName, username, phone, bio].forEach((input) => { input?.addEventListener("input", updateProgress); });

function validateStep1() {
    let valid = true;
    [fullName, username, phone].forEach((input) => {
        if (input) {
            if (!input.value.trim()) { input.style.borderColor = "red"; valid = false; }
            else { input.style.borderColor = "#e5e7eb"; }
        }
    });
    if (bio) bio.style.borderColor = "#e5e7eb";
    return valid;
}

btn?.addEventListener("click", () => {
    if (!validateStep1()) return;
    step1?.classList.add("hidden");
    step2?.classList.remove("hidden");
    if (title) title.innerText = "Preferences Setup";
    if (stepText) stepText.innerText = "Step 2 of 2";
    if (progress) progress.style.width = "100%";
});

document.querySelectorAll('[data-type="personality"]').forEach((el) => {
    el.addEventListener("click", () => {
        document.querySelectorAll('[data-type="personality"]').forEach((b) => b.classList.remove("active"));
        el.classList.add("active");
    });
});

document.querySelectorAll('[data-type="interest"]').forEach((el) => {
    el.addEventListener("click", () => { el.classList.toggle("active"); });
});

finishBtn?.addEventListener("click", () => {
    if (!validateStep1()) { alert("Please fill Name, Username and Phone"); return; }
    const personality = document.querySelector('[data-type="personality"].active');
    const interests = document.querySelectorAll('[data-type="interest"].active');
    if (!personality) { alert("Please select a personality"); return; }
    if (interests.length === 0) { alert("Please select at least one interest"); return; }
    if (typeof firebase !== "undefined" && firebase.apps.length) {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) { localStorage.setItem("setupComplete_" + currentUser.uid, "true"); }
    }
    window.location.href = "dashboard.html";
});

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
                firebase.auth().signOut().then(() => { window.location.href = "../index.html"; });
            } else {
                window.location.href = "../index.html";
            }
        }, 1500);
    });
});

// ================= TESTIMONIALS =================
document.addEventListener("DOMContentLoaded", () => {
    const track = document.querySelector(".testimonial-track");
    const cards = document.querySelectorAll(".testimonial-card");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    if (!track || cards.length === 0) return;
    let index = 0;
    function getCardWidth() { return cards[0].offsetWidth + 24; }
    function updateSlider() { track.style.transform = `translateX(${-(index * getCardWidth())}px)`; }
    nextBtn?.addEventListener("click", () => { if (index < cards.length - 1) { index++; updateSlider(); } });
    prevBtn?.addEventListener("click", () => { if (index > 0) { index--; updateSlider(); } });
    window.addEventListener("resize", updateSlider);
});

// ===== SEARCH VOICE =====
document.addEventListener("DOMContentLoaded", () => {
    const micBtn = document.getElementById("searchMicBtn");
    const input = document.getElementById("mainInput");
    const sendBtn = document.getElementById("startChatBtn");

    let recognition;
    let isRecording = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition || !micBtn) return;

    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;

    micBtn.addEventListener("click", async () => {
        if (isRecording) {
            recognition.stop();
            micBtn.classList.remove("recording");
            isRecording = false;
            return;
        }

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            micBtn.classList.add("recording");
            isRecording = true;
            recognition.start();
        } catch (err) {
            alert("Mic permission denied ❌");
        }
    });

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        micBtn.classList.remove("recording");
        micBtn.classList.add("processing");
        isRecording = false;
        input.value = text;
        setTimeout(() => {
            micBtn.classList.remove("processing");
            sendBtn.click();
        }, 800);
    };

    recognition.onerror = () => {
        micBtn.classList.remove("recording");
        micBtn.classList.remove("processing");
        isRecording = false;
        alert("Voice error ❌");
    };
});

// ================= MARKDOWN FORMATTER =================
function formatMarkdown(text) {
    const codeBlocks = [];
    text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
        const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
        codeBlocks.push(`<pre style="background:#1e1e1e;color:#f8f8f2;padding:14px 16px;border-radius:10px;overflow-x:auto;font-family:'Courier New',monospace;font-size:13px;margin:12px 0;line-height:1.6;"><code>${escaped}</code></pre>`);
        return placeholder;
    });
    text = text.replace(/`([^`]+)`/g, (_, code) => {
        const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<code style="background:#f0f0f0;color:#d63384;padding:2px 6px;border-radius:4px;font-family:'Courier New',monospace;font-size:13px;">${escaped}</code>`;
    });
    text = text.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;margin:14px 0 6px;">$1</h3>');
    text = text.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:700;margin:16px 0 6px;">$1</h2>');
    text = text.replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;margin:18px 0 8px;">$1</h1>');
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    text = text.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e0e0e0;margin:14px 0;">');
    text = text.replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;">$1</li>');
    text = text.replace(/((<li style="margin:4px 0;">.*?<\/li>\n?)+)/g, (match) => `<ol style="margin:8px 0;padding-left:22px;">${match}</ol>`);
    text = text.replace(/^[*\-] (.+)$/gm, '<li style="margin:4px 0;list-style:disc;">$1</li>');
    text = text.replace(/((<li style="margin:4px 0;list-style:disc;">.*?<\/li>\n?)+)/g, (match) => `<ul style="margin:8px 0;padding-left:22px;">${match}</ul>`);
    text = text.replace(/\n/g, '<br>');
    codeBlocks.forEach((block, i) => { text = text.replace(`%%CODEBLOCK_${i}%%`, block); });
    return text;
}

// ================= CHAT ENGINE WITH STATE PERSISTENCE =================
document.addEventListener("DOMContentLoaded", () => {

    const emptyState = document.getElementById("emptyState");
    const chatSection = document.getElementById("chatSection");
    const chatInputSection = document.getElementById("chatInputSection");
    const mainInput = document.getElementById("mainInput");
    const startChatBtn = document.getElementById("startChatBtn");
    const chatContainer = document.getElementById("chatContainer");
    const chatInput = document.getElementById("chatInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");

    let currentSessionId = null;
    let chatHistory = [];
    let sessionMessages = [];

    // ================= STATE PERSISTENCE =================
    
    function saveCurrentChatState() {
        if (currentSessionId) {
            const state = {
                sessionId: currentSessionId,
                chatHistory: chatHistory,
                sessionMessages: sessionMessages,
                timestamp: Date.now()
            };
            localStorage.setItem('currentChatState', JSON.stringify(state));
        } else {
            localStorage.removeItem('currentChatState');
        }
    }

    function loadChatState() {
        const savedState = localStorage.getItem('currentChatState');
        if (!savedState) return false;

        try {
            const state = JSON.parse(savedState);
            
            if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('currentChatState');
                return false;
            }

            currentSessionId = state.sessionId;
            chatHistory = state.chatHistory || [];
            sessionMessages = state.sessionMessages || [];
            window.__activeSessionId = currentSessionId;

            const session = getSession(currentSessionId);
            if (!session) {
                localStorage.removeItem('currentChatState');
                return false;
            }

            if (chatContainer) {
                chatContainer.innerHTML = "";
                sessionMessages.forEach(msg => {
                    addMessageToDOM(msg.text, msg.role === "user" ? "user" : "ai");
                });
            }

            showChatUI();
            renderRecentChats();
            
            return true;
        } catch (e) {
            console.error('Error loading chat state:', e);
            localStorage.removeItem('currentChatState');
            return false;
        }
    }

    function clearChatState() {
        localStorage.removeItem('currentChatState');
    }

    setInterval(saveCurrentChatState, 2000);

    window.addEventListener('beforeunload', () => {
        saveCurrentChatState();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveCurrentChatState();
        }
    });

    // ================= HELPER FUNCTIONS =================

    function addMessageToDOM(html, type) {
        if (!chatContainer) return;
        const div = document.createElement("div");
        div.classList.add("message", type);
        div.innerHTML = `<div class="message-bubble">${html}</div>`;
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showTypingLoader() {
        if (!chatContainer) return null;
        const loaderDiv = document.createElement("div");
        loaderDiv.classList.add("message", "ai");
        loaderDiv.innerHTML = `<div class="message-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
        chatContainer.appendChild(loaderDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return function replaceWithText(html) {
            loaderDiv.querySelector(".message-bubble").innerHTML = html;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        };
    }

    async function callAPI(input) {
        try {
            chatHistory.push({ role: "user", content: input });
            saveCurrentChatState();
            
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer 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",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: chatHistory,
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });
            const data = await response.json();
            if (data.error) return { raw: "API Error: " + data.error.message, html: "API Error: " + data.error.message };
            const raw = data.choices?.[0]?.message?.content || "No response 😅";
            chatHistory.push({ role: "assistant", content: raw });
            return { raw, html: formatMarkdown(raw) };
        } catch (error) {
            console.error(error);
            return { raw: "Network error ❌", html: "Network error ❌" };
        }
    }

    function showChatUI() {
        if (emptyState) emptyState.style.display = "none";
        if (chatSection) chatSection.style.display = "block";
        if (chatInputSection) chatInputSection.style.display = "block";
    }

    function showEmptyUI() {
        if (emptyState) emptyState.style.display = "";
        if (chatSection) chatSection.style.display = "none";
        if (chatInputSection) chatInputSection.style.display = "none";
        if (mainInput) mainInput.value = "";
        clearChatState();
    }

    async function startChat(message) {
        if (!message || !message.trim()) return;

        clearChatState();

        currentSessionId = createSession(message);
        window.__activeSessionId = currentSessionId;
        chatHistory = [];
        sessionMessages = [];

        if (chatContainer) chatContainer.innerHTML = "";
        showChatUI();
        renderRecentChats();

        const userHtml = escapeHtml(message);
        addMessageToDOM(userHtml, "user");
        sessionMessages.push({ role: "user", text: userHtml, raw: message });
        updateSessionMessages(currentSessionId, sessionMessages);
        saveCurrentChatState();

        const replaceWithText = showTypingLoader();
        const { raw, html } = await callAPI(message);
        replaceWithText(html);
        sessionMessages.push({ role: "ai", text: html, raw });
        updateSessionMessages(currentSessionId, sessionMessages);
        saveCurrentChatState();
    }

    async function sendChatMessage() {
        if (!chatInput) return;
        const message = chatInput.value.trim();
        if (!message) return;
        chatInput.value = "";

        if (!currentSessionId) {
            await startChat(message);
            return;
        }

        const userHtml = escapeHtml(message);
        addMessageToDOM(userHtml, "user");
        sessionMessages.push({ role: "user", text: userHtml, raw: message });
        updateSessionMessages(currentSessionId, sessionMessages);
        saveCurrentChatState();

        const replaceWithText = showTypingLoader();
        const { raw, html } = await callAPI(message);
        replaceWithText(html);
        sessionMessages.push({ role: "ai", text: html, raw });
        updateSessionMessages(currentSessionId, sessionMessages);
        saveCurrentChatState();
    }

    function loadSession(sessionId) {
        const session = getSession(sessionId);
        if (!session) return;

        currentSessionId = sessionId;
        window.__activeSessionId = sessionId;

        chatHistory = [];
        session.messages.forEach(msg => {
            if (msg.role === "user") {
                chatHistory.push({ role: "user", content: msg.raw || unescapeHtml(msg.text) });
            } else {
                chatHistory.push({ role: "assistant", content: msg.raw || unescapeHtml(msg.text) });
            }
        });

        sessionMessages = session.messages.slice();

        if (chatContainer) {
            chatContainer.innerHTML = "";
            session.messages.forEach(msg => {
                addMessageToDOM(msg.text, msg.role === "user" ? "user" : "ai");
            });
        }

        showChatUI();
        renderRecentChats();
        saveCurrentChatState();
        
        if (chatInput) chatInput.focus();
    }

    function resetToNewChat() {
        currentSessionId = null;
        window.__activeSessionId = null;
        chatHistory = [];
        sessionMessages = [];
        if (chatContainer) chatContainer.innerHTML = "";
        showEmptyUI();
        renderRecentChats();
        clearChatState();
    }

    window.startChat = startChat;
    window.loadSession = loadSession;
    window.resetToNewChat = resetToNewChat;

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

    document.querySelectorAll(".suggestion-card").forEach(card => {
        card.addEventListener("click", () => {
            const title = card.querySelector("h4")?.textContent;
            if (title) {
                startChat(title);
            }
        });
    });

    const stateLoaded = loadChatState();
    
    if (!stateLoaded) {
        showEmptyUI();
        renderRecentChats();
    } else {
        renderRecentChats();
        if (chatInput) chatInput.focus();
    }

    const newChatHeaderBtn = document.querySelector('.new-chat-header-btn');
    if (newChatHeaderBtn) {
        newChatHeaderBtn.addEventListener('click', resetToNewChat);
    }
});

// ================= UTILS =================
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function unescapeHtml(html) {
    return html
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');
}

// Add active session style
(function addActiveSessionStyle() {
    const style = document.createElement("style");
    style.textContent = `
        .recent-item.active-session {
            background: rgba(79, 70, 229, 0.12) !important;
            border-left: 3px solid #4f46e5;
        }
        .recent-item.active-session .recent-text {
            color: #4f46e5;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
})();
