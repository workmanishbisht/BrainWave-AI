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
    showToast(sessions[index].pinned ? "Chat pinned 📌" : "Chat unpinned", "success");
}

function deleteSession(sessionId) {
    let sessions = getSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(sessions);
    if (window.__activeSessionId === sessionId) {
        window.__activeSessionId = null;
        if (typeof resetToNewChat === 'function') resetToNewChat();
    }
    renderRecentChats();
    showToast("Chat removed", "error");
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
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ================= SUBSCRIPTION MODAL =================
const plans = {
    monthly: {
        go: { inr: 649, usd: 8, original: null },
        plus: { inr: 1649, usd: 20, original: null },
        pro: { inr: 8299, usd: 100, original: null }
    },
    yearly: {
        go: { inr: 499, usd: 6, original: 649 },
        plus: { inr: 1299, usd: 16, original: 1649 },
        pro: { inr: 6599, usd: 79, original: 8299 }
    }
};

let currentBilling = 'monthly';

function openSubscriptionModal() {
    const existing = document.getElementById('subscriptionOverlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'subscription-overlay';
    overlay.id = 'subscriptionOverlay';
    overlay.innerHTML = buildSubscriptionHTML(currentBilling);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSubscriptionModal(); });
    document.addEventListener('keydown', onSubEscape);
}

function onSubEscape(e) { if (e.key === 'Escape') closeSubscriptionModal(); }

function closeSubscriptionModal() {
    const overlay = document.getElementById('subscriptionOverlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', onSubEscape);
}

function switchBilling(type) {
    currentBilling = type;
    const overlay = document.getElementById('subscriptionOverlay');
    if (overlay) overlay.innerHTML = buildSubscriptionHTML(type);
}

function buildSubscriptionHTML(billing) {
    const p = plans[billing];
    function fmt(inr) { return '₹' + inr.toLocaleString('en-IN'); }
    function origRow(orig) {
        return orig ? `<div class="plan-original">Was ${fmt(orig)}/month</div>` : `<div class="plan-original"></div>`;
    }
    return `
    <div class="subscription-modal">
        <button class="sub-modal-close" onclick="closeSubscriptionModal()">✕</button>
        <div class="sub-modal-header">
            <h2 class="sub-modal-title">Upgrade your plan</h2>
            <p class="sub-modal-subtitle">Choose the plan that works best for you</p>
        </div>
        <div style="text-align:center;">
            <div class="billing-toggle">
                <button class="billing-btn ${billing === 'monthly' ? 'active' : ''}" onclick="switchBilling('monthly')">Monthly</button>
                <button class="billing-btn ${billing === 'yearly' ? 'active' : ''}" onclick="switchBilling('yearly')">Yearly ${billing === 'yearly' ? '' : '<span style="font-size:10px;color:#10b981;font-weight:700;">Save 20%</span>'}</button>
            </div>
        </div>
        <p class="currency-note">Prices shown in Indian Rupees (INR) • Billed ${billing}</p>
        <div class="plans-grid">
            <div class="plan-card">
                <div class="plan-name">Go</div>
                <div class="plan-desc">Keep chatting with expanded access</div>
                <div class="plan-price-row"><span class="plan-currency">₹</span><span class="plan-amount">${p.go.inr.toLocaleString('en-IN')}</span><span class="plan-period">/month</span></div>
                ${origRow(p.go.original)}
                <button class="plan-btn current" disabled>Your current plan</button>
                <ul class="plan-features"><li>Core AI model</li><li>More messages and uploads</li><li>More image creation</li><li>Longer memory</li><li>Expanded voice mode</li></ul>
            </div>
            <div class="plan-card popular">
                <div class="popular-badge">Most Popular</div>
                <div class="plan-name">Plus</div>
                <div class="plan-desc">Unlock the full experience</div>
                <div class="plan-price-row"><span class="plan-currency">₹</span><span class="plan-amount">${p.plus.inr.toLocaleString('en-IN')}</span><span class="plan-period">/month</span></div>
                ${origRow(p.plus.original)}
                <button class="plan-btn filled" onclick="handleUpgradeClick('Plus')">Upgrade to Plus</button>
                <ul class="plan-features"><li>Advanced AI models</li><li>Even more messages and uploads</li><li>Faster image creation</li><li>Expanded memory across chats</li><li>Codex coding agent</li><li>Expanded deep research</li><li>Projects and custom GPTs</li></ul>
            </div>
            <div class="plan-card">
                <div class="plan-name">Pro</div>
                <div class="plan-desc">Maximize your productivity</div>
                <div class="plan-price-row"><span class="plan-currency">₹</span><span class="plan-amount">${p.pro.inr.toLocaleString('en-IN')}</span><span class="plan-period">/month</span></div>
                ${origRow(p.pro.original)}
                <button class="plan-btn" onclick="handleUpgradeClick('Pro')">Upgrade to Pro</button>
                <ul class="plan-features"><li>Everything in Plus</li><li>5x more usage than Plus</li><li>Frontier Pro model</li><li>Maximum access to Codex</li><li>Maximum deep research</li><li>Unlimited core chat</li><li>Unlimited faster image creation</li><li>Maximum memory and context</li><li>Early access to experimental features</li></ul>
            </div>
        </div>
        <p class="sub-footer-note">All prices in INR · GST may apply · Cancel anytime</p>
    </div>`;
}

function handleUpgradeClick(planName) {
    closeSubscriptionModal();
    showToast(`Redirecting to ${planName} checkout...`, "success");
}

window.openSubscriptionModal = openSubscriptionModal;
window.closeSubscriptionModal = closeSubscriptionModal;
window.switchBilling = switchBilling;
window.handleUpgradeClick = handleUpgradeClick;

// ================= HISTORY POPUP =================
function openHistoryPopup() {
    const existing = document.getElementById('historyOverlay');
    if (existing) existing.remove();
    const sessions = getSessions();
    const overlay = document.createElement('div');
    overlay.className = 'history-overlay';
    overlay.id = 'historyOverlay';
    overlay.innerHTML = buildHistoryHTML(sessions, '');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeHistoryPopup(); });
    const searchInput = overlay.querySelector('.history-search-input');
    if (searchInput) {
        searchInput.focus();
        searchInput.addEventListener('input', (e) => updateHistoryList(e.target.value.trim()));
    }
    document.addEventListener('keydown', onHistEscape);
}

function onHistEscape(e) { if (e.key === 'Escape') closeHistoryPopup(); }

function closeHistoryPopup() {
    const overlay = document.getElementById('historyOverlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', onHistEscape);
}

function updateHistoryList(query) {
    const sessions = getSessions();
    const listEl = document.getElementById('historyList');
    if (!listEl) return;
    listEl.innerHTML = buildHistoryItems(sessions, query);
}

function highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function buildHistoryItems(sessions, query) {
    const sorted = [...sessions].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.time - a.time;
    });
    const filtered = query
        ? sorted.filter(s => {
            const inTitle = s.title.toLowerCase().includes(query.toLowerCase());
            const inMessages = s.messages && s.messages.some(m => (m.raw || '').toLowerCase().includes(query.toLowerCase()));
            return inTitle || inMessages;
        })
        : sorted;

    if (filtered.length === 0) {
        return `<div class="history-empty"><i class="ri-search-line"></i>${query ? 'No chats found for "' + escapeHtml(query) + '"' : 'No recent chats yet'}</div>`;
    }
    return filtered.map(session => {
        const isActive = window.__activeSessionId === session.id;
        const lastMsg = session.messages && session.messages.length > 0
            ? (session.messages[session.messages.length - 1].raw || unescapeHtml(session.messages[session.messages.length - 1].text || '')).replace(/<[^>]+>/g, '').substring(0, 70) + '...'
            : 'No messages yet';
        const timeStr = formatRelativeTime(session.time);
        const msgCount = session.messages ? session.messages.length : 0;
        const pairs = Math.floor(msgCount / 2);
        return `<div class="history-chat-item ${isActive ? 'active' : ''}" onclick="loadSessionFromHistory('${session.id}')">
            <div class="history-chat-title">${highlight(session.title, query)}</div>
            <div class="history-chat-preview">${highlight(lastMsg, query)}</div>
            <div class="history-chat-meta">
                <span class="history-chat-time">${timeStr}</span>
                ${session.pinned ? '<span class="history-pin-badge">📌 Pinned</span>' : ''}
                <span class="history-msg-count">${pairs} message${pairs !== 1 ? 's' : ''}</span>
            </div>
        </div>`;
    }).join('');
}

function buildHistoryHTML(sessions, query) {
    return `
    <div class="history-popup">
        <div class="history-popup-header">
            <div class="history-popup-title">Chat History</div>
            <div class="history-search-box">
                <i class="ri-search-line"></i>
                <input class="history-search-input" placeholder="Search your chats..." value="${escapeHtml(query)}" autocomplete="off">
            </div>
        </div>
        <div class="history-popup-body"><div id="historyList">${buildHistoryItems(sessions, query)}</div></div>
        <div class="history-popup-footer"><button class="history-close-btn" onclick="closeHistoryPopup()">Close</button></div>
    </div>`;
}

function loadSessionFromHistory(sessionId) {
    closeHistoryPopup();
    if (typeof loadSession === 'function') loadSession(sessionId);
}

function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

window.openHistoryPopup = openHistoryPopup;
window.closeHistoryPopup = closeHistoryPopup;
window.loadSessionFromHistory = loadSessionFromHistory;

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
            <div class="modal-header"><h3>Chat Options</h3><p>${session.title}</p></div>
            <div class="modal-body">
                <div class="modal-option" onclick="handleRenameClick('${sessionId}')"><i class="ri-edit-line"></i><div class="option-content"><div class="option-title">Rename</div><div class="option-desc">Give this chat a new name</div></div></div>
                <div class="modal-option" onclick="handlePinClick('${sessionId}')"><i class="${session.pinned ? 'ri-unpin-line' : 'ri-pushpin-line'}"></i><div class="option-content"><div class="option-title">${session.pinned ? 'Unpin' : 'Pin'}</div><div class="option-desc">${session.pinned ? 'Remove from top' : 'Keep at the top'}</div></div></div>
                <div class="modal-option" onclick="handleShareClick('${sessionId}')"><i class="ri-share-line"></i><div class="option-content"><div class="option-title">Share</div><div class="option-desc">Export or share this chat</div></div></div>
                <div class="modal-option danger" onclick="handleDeleteClick('${sessionId}')"><i class="ri-delete-bin-line"></i><div class="option-content"><div class="option-title">Delete</div><div class="option-desc">Permanently remove this chat</div></div></div>
            </div>
            <div class="modal-footer"><button class="cancel-btn" onclick="closeModal()">Cancel</button></div>
        </div>`;
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
        <div class="modal-header"><h3>Rename Chat</h3><p>Enter a new name for this conversation</p></div>
        <div class="rename-input-container">
            <input type="text" class="rename-input" id="renameInput" value="${session.title.replace('...', '')}" maxlength="50" placeholder="Chat name">
            <div class="rename-actions">
                <button class="rename-btn save" onclick="handleRenameSave('${sessionId}')">Save</button>
                <button class="rename-btn cancel" onclick="showChatOptionsModal('${sessionId}', event)">Cancel</button>
            </div>
        </div>`;
    setTimeout(() => document.getElementById('renameInput')?.focus(), 100);
    const input = document.getElementById('renameInput');
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleRenameSave(sessionId); });
}

window.handleRenameClick = function (sessionId) { showRenameInput(sessionId); };
window.handleRenameSave = function (sessionId) {
    const input = document.getElementById('renameInput');
    if (input && input.value.trim()) { renameSession(sessionId, input.value.trim()); closeModal(); }
};
window.handlePinClick = function (sessionId) {
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) { togglePin(index); closeModal(); }
};
window.handleShareClick = function (sessionId) {
    const session = getSession(sessionId);
    if (!session) return;
    const shareText = `BrainWave AI Chat: ${session.title}\n${new Date(session.time).toLocaleString()}\n\n`;
    const messageText = session.messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.raw || unescapeHtml(m.text)}`).join('\n\n');
    const fullText = shareText + messageText;
    navigator.clipboard?.writeText(fullText).then(() => showToast("Chat copied to clipboard", "success")).catch(() => {
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
window.handleDeleteClick = function (sessionId) {
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) { deleteSession(sessionId); closeModal(); }
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
    const sorted = [...sessions].map((s, i) => ({ ...s, originalIndex: i })).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.time - a.time;
    });
    list.innerHTML = sorted.map(session => `
        <div class="recent-item ${session.pinned ? "pinned" : ""} ${window.__activeSessionId === session.id ? "active-session" : ""}" onclick="loadSession('${session.id}')">
            <span class="recent-text">${session.title}</span>
            ${session.pinned ? '<i class="ri-pushpin-fill pin-icon active"></i>' : ''}
            <span class="recent-options-btn" onclick="showChatOptionsModal('${session.id}', event)"><i class="ri-more-2-fill"></i></span>
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
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
        if (!user) {
            if (window.location.pathname.includes("dashboard.html")) window.location.href = "../Pages/account.html";
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

        // Save current user to accounts
        const currentAccount = {
            uid: user.uid, email, displayName: name, photoURL,
            providerId: user.providerData?.[0]?.providerId || 'password',
            lastUsed: Date.now()
        };
        const accounts = getStoredAccounts();
        const existingIndex = accounts.findIndex(acc => acc.uid === currentAccount.uid);
        if (existingIndex !== -1) accounts[existingIndex] = currentAccount;
        else accounts.push(currentAccount);
        saveAccounts(accounts);
        saveCurrentAccount(currentAccount);
    });
}

// ================= PROFILE SECTION =================
function openProfileSection() {
    // Hide other sections, show profile
    const emptyState = document.getElementById("emptyState");
    const chatSection = document.getElementById("chatSection");
    const chatInputSection = document.getElementById("chatInputSection");
    const profileSection = document.getElementById("profileSection");

    if (emptyState) emptyState.style.display = "none";
    if (chatSection) chatSection.style.display = "none";
    if (chatInputSection) chatInputSection.style.display = "none";
    if (profileSection) profileSection.style.display = "block";

    // Close dropdown
    const dd = document.querySelector(".sidebar-dropdown");
    if (dd) dd.classList.remove("show");

    // Load current user data into form
    if (typeof firebase !== "undefined" && firebase.apps.length) {
        const user = firebase.auth().currentUser;
        if (user) populateProfileForm(user);
    }
}

function closeProfileSection() {
    const profileSection = document.getElementById("profileSection");
    if (profileSection) profileSection.style.display = "none";
    // Go back to empty state
    const emptyState = document.getElementById("emptyState");
    if (emptyState) emptyState.style.display = "";
}

function populateProfileForm(user) {
    const name = user.displayName || user.providerData?.[0]?.displayName || user.email.split("@")[0];
    const email = user.email || user.providerData?.[0]?.email || "";
    const photoURL = user.photoURL || user.providerData?.[0]?.photoURL || "";

    // Split name into first/last
    const parts = name.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    const firstNameEl = document.getElementById("profileFirstName");
    const lastNameEl = document.getElementById("profileLastName");
    const emailEl = document.getElementById("profileEmail");

    if (firstNameEl) firstNameEl.value = firstName;
    if (lastNameEl) lastNameEl.value = lastName;
    if (emailEl) emailEl.value = email;

    // Set current profile picture
    const picEl = document.getElementById("profileCurrentPic");
    const initialsEl = document.getElementById("profileCurrentInitials");
    const removePicBtn = document.getElementById("profileRemovePicBtn");

    if (picEl && initialsEl) {
        if (photoURL) {
            picEl.innerHTML = `<img src="${photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;" id="profileCurrentImg">`;
            if (removePicBtn) removePicBtn.style.display = "flex";
        } else {
            picEl.innerHTML = `<span id="profileCurrentInitials">${getInitials(name)}</span>`;
            if (removePicBtn) removePicBtn.style.display = "none";
        }
    }
}

// Profile picture upload logic
let pendingProfilePhotoFile = null;
let pendingProfilePhotoURL = null; // base64 or URL

function initProfileSection() {
    const dropzone = document.getElementById("profileDropzone");
    const fileInput = document.getElementById("profileFileInput");
    const browseLink = document.getElementById("profileBrowseLink");
    const removePicBtn = document.getElementById("profileRemovePicBtn");

    // Browse link click
    if (browseLink) {
        browseLink.addEventListener("click", (e) => {
            e.stopPropagation();
            fileInput?.click();
        });
    }

    // Dropzone click
    if (dropzone) {
        dropzone.addEventListener("click", () => fileInput?.click());

        dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });
        dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            const file = e.dataTransfer.files[0];
            if (file) handleProfileFileSelect(file);
        });
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) handleProfileFileSelect(file);
            fileInput.value = "";
        });
    }

    // Remove picture button
    if (removePicBtn) {
        removePicBtn.addEventListener("click", () => {
            pendingProfilePhotoFile = null;
            pendingProfilePhotoURL = "REMOVE";
            const picEl = document.getElementById("profileCurrentPic");
            if (picEl) {
                const user = typeof firebase !== "undefined" && firebase.apps.length ? firebase.auth().currentUser : null;
                const name = user?.displayName || user?.email?.split("@")[0] || "?";
                picEl.innerHTML = `<span id="profileCurrentInitials">${getInitials(name)}</span>`;
            }
            removePicBtn.style.display = "none";
            showToast("Picture will be removed on Save", "info");
        });
    }

    // Save Details button
    const saveDetailsBtn = document.getElementById("profileSaveDetailsBtn");
    if (saveDetailsBtn) {
        saveDetailsBtn.addEventListener("click", saveProfileDetails);
    }

    // Save Password button
    const savePasswordBtn = document.getElementById("profileSavePasswordBtn");
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener("click", saveProfilePassword);
    }
}

function handleProfileFileSelect(file) {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        showToast("Only PNG, JPEG, JPG, WEBP allowed ❌", "error");
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast("Image must be less than 5MB ❌", "error");
        return;
    }

    pendingProfilePhotoFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        pendingProfilePhotoURL = e.target.result;
        const picEl = document.getElementById("profileCurrentPic");
        const removePicBtn = document.getElementById("profileRemovePicBtn");
        if (picEl) {
            picEl.innerHTML = `<img src="${pendingProfilePhotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;">`;
        }
        if (removePicBtn) removePicBtn.style.display = "flex";
        showToast("Image selected — click Save Changes to apply ✅", "info");
    };
    reader.readAsDataURL(file);
}

async function saveProfileDetails() {
    if (typeof firebase === "undefined" || !firebase.apps.length) return;
    const user = firebase.auth().currentUser;
    if (!user) { showToast("Not logged in", "error"); return; }

    const firstName = document.getElementById("profileFirstName")?.value.trim();
    const lastName = document.getElementById("profileLastName")?.value.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    const btn = document.getElementById("profileSaveDetailsBtn");
    if (btn) { btn.textContent = "Saving..."; btn.disabled = true; }

    try {
        let newPhotoURL = user.photoURL;

        // Handle photo
        if (pendingProfilePhotoURL === "REMOVE") {
            // Remove photo — set to null
            newPhotoURL = null;
        } else if (pendingProfilePhotoFile) {
            // Firebase Storage se upload karna ideal hai, 
            // lekin agar Storage nahi hai toh base64 ko photoURL mein save karte hain
            // (small images ke liye ok, large images ke liye Firebase Storage use karein)
            newPhotoURL = pendingProfilePhotoURL;
        }

        await user.updateProfile({
            displayName: fullName || user.displayName,
            photoURL: newPhotoURL
        });

        // Update all UI avatars
        const initials = getInitials(fullName || user.displayName || user.email);
        const sidebarAvatarEl = document.getElementById("sidebarAvatarText");
        setAvatar(sidebarAvatarEl, newPhotoURL, initials);
        const dropdownAvatarEl = document.getElementById("dropdownAvatarText");
        setAvatar(dropdownAvatarEl, newPhotoURL, initials);

        const sidebarUserName = document.getElementById("sidebarUserName");
        const dropdownUserName = document.getElementById("dropdownUserName");
        if (sidebarUserName) sidebarUserName.textContent = fullName || user.displayName;
        if (dropdownUserName) dropdownUserName.textContent = (fullName || user.displayName || "").toUpperCase();

        // Reset pending
        pendingProfilePhotoFile = null;
        pendingProfilePhotoURL = null;

        showToast("Profile updated successfully ✅", "success");
    } catch (error) {
        console.error("Profile update error:", error);
        showToast("Failed to update profile: " + (error.message || "Unknown error"), "error");
    } finally {
        if (btn) { btn.textContent = "Save Changes"; btn.disabled = false; }
    }
}

async function saveProfilePassword() {
    if (typeof firebase === "undefined" || !firebase.apps.length) return;
    const user = firebase.auth().currentUser;
    if (!user) { showToast("Not logged in", "error"); return; }

    const oldPassword = document.getElementById("profileOldPassword")?.value;
    const newPassword = document.getElementById("profileNewPassword")?.value;
    const confirmPassword = document.getElementById("profileConfirmPassword")?.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        showToast("Please fill all password fields", "error");
        return;
    }
    if (newPassword.length < 6) {
        showToast("New password must be at least 6 characters", "error");
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast("Passwords do not match ❌", "error");
        return;
    }

    const btn = document.getElementById("profileSavePasswordBtn");
    if (btn) { btn.textContent = "Saving..."; btn.disabled = true; }

    try {
        // Re-authenticate first
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPassword);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);

        // Clear fields
        document.getElementById("profileOldPassword").value = "";
        document.getElementById("profileNewPassword").value = "";
        document.getElementById("profileConfirmPassword").value = "";

        showToast("Password changed successfully ✅", "success");
    } catch (error) {
        console.error("Password change error:", error);
        if (error.code === "auth/wrong-password") {
            showToast("Old password is incorrect ❌", "error");
        } else {
            showToast("Failed: " + (error.message || "Unknown error"), "error");
        }
    } finally {
        if (btn) { btn.textContent = "Save Changes"; btn.disabled = false; }
    }
}

window.openProfileSection = openProfileSection;
window.closeProfileSection = closeProfileSection;

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggleSidebar");
    const mobileBtn = document.getElementById("mobileMenu");
    const profileToggle = document.querySelector(".profile-toggle");
    const dropdown = document.querySelector(".sidebar-dropdown");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            if (window.innerWidth <= 768) sidebar.classList.toggle("active");
            else sidebar.classList.toggle("collapsed");
        });
    }

    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("active");
        });
    }

    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("active") && !sidebar.contains(e.target) && mobileBtn && !mobileBtn.contains(e.target)) {
            sidebar.classList.remove("active");
        }
    });

    if (profileToggle && dropdown) {
        profileToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (dropdown && !dropdown.contains(e.target) && !profileToggle.contains(e.target)) {
                dropdown.classList.remove("show");
            }
        });
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Nav items
    document.querySelectorAll(".nav-item").forEach(item => {
        const text = item.querySelector(".nav-text")?.textContent?.trim();
        if (text === "New Chat") item.addEventListener("click", () => resetToNewChat());
        if (text === "History") {
            item.addEventListener("click", (e) => { e.stopPropagation(); openHistoryPopup(); });
        }
    });

    // Profile dropdown item click → open profile section
    const profileDropdownItem = document.getElementById("profileDropdownItem");
    if (profileDropdownItem) {
        profileDropdownItem.addEventListener("click", () => openProfileSection());
    }

    // Upgrade box
    const upgradeBox = document.querySelector(".upgrade-box");
    if (upgradeBox) {
        upgradeBox.style.cursor = "pointer";
        upgradeBox.addEventListener("click", openSubscriptionModal);
    }

    // Dropdown items
    document.querySelectorAll(".dropdown-item").forEach(item => {
        const text = item.textContent.trim().toLowerCase();
        if (text.includes("upgrade")) {
            item.addEventListener("click", () => {
                const dd = document.querySelector(".sidebar-dropdown");
                if (dd) dd.classList.remove("show");
                openSubscriptionModal();
            });
        }
        if (text.includes("add another account")) {
            item.addEventListener("click", () => {
                const dd = document.querySelector(".sidebar-dropdown");
                if (dd) dd.classList.remove("show");
                addAnotherAccount();
            });
        }
    });

    renderRecentChats();
    loadUserInfo();

    // Init profile section handlers
    initProfileSection();
});

// ================= CHAT ENGINE WITH STATE PERSISTENCE =================
document.addEventListener("DOMContentLoaded", () => {
    const emptyState = document.getElementById("emptyState");
    const chatSection = document.getElementById("chatSection");
    const chatInputSection = document.getElementById("chatInputSection");
    const profileSection = document.getElementById("profileSection");
    const mainInput = document.getElementById("mainInput");
    const startChatBtn = document.getElementById("startChatBtn");
    const chatContainer = document.getElementById("chatContainer");
    const chatInput = document.getElementById("chatInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");

    let currentSessionId = null;
    let chatHistory = [];
    let sessionMessages = [];

    function saveCurrentChatState() {
        if (currentSessionId) {
            const state = { sessionId: currentSessionId, chatHistory, sessionMessages, timestamp: Date.now() };
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
            if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) { localStorage.removeItem('currentChatState'); return false; }
            currentSessionId = state.sessionId;
            chatHistory = state.chatHistory || [];
            sessionMessages = state.sessionMessages || [];
            window.__activeSessionId = currentSessionId;
            const session = getSession(currentSessionId);
            if (!session) { localStorage.removeItem('currentChatState'); return false; }
            if (chatContainer) {
                chatContainer.innerHTML = "";
                sessionMessages.forEach(msg => addMessageToDOM(msg.text, msg.role === "user" ? "user" : "ai"));
            }
            showChatUI();
            renderRecentChats();
            return true;
        } catch (e) {
            localStorage.removeItem('currentChatState');
            return false;
        }
    }

    function clearChatState() { localStorage.removeItem('currentChatState'); }

    setInterval(saveCurrentChatState, 2000);
    window.addEventListener('beforeunload', () => saveCurrentChatState());
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveCurrentChatState(); });

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
                headers: { "Authorization": "Bearer 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", "Content-Type": "application/json" },
                body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: chatHistory, temperature: 0.7, max_tokens: 1024 })
            });
            const data = await response.json();
            if (data.error) return { raw: "API Error: " + data.error.message, html: "API Error: " + data.error.message };
            const raw = data.choices?.[0]?.message?.content || "No response 😅";
            chatHistory.push({ role: "assistant", content: raw });
            return { raw, html: formatMarkdown(raw) };
        } catch (error) {
            return { raw: "Network error ❌", html: "Network error ❌" };
        }
    }

    function showChatUI() {
        if (emptyState) emptyState.style.display = "none";
        if (profileSection) profileSection.style.display = "none";
        if (chatSection) chatSection.style.display = "block";
        if (chatInputSection) chatInputSection.style.display = "block";
    }

    function showEmptyUI() {
        if (emptyState) emptyState.style.display = "";
        if (profileSection) profileSection.style.display = "none";
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
        if (!currentSessionId) { await startChat(message); return; }
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
            if (msg.role === "user") chatHistory.push({ role: "user", content: msg.raw || unescapeHtml(msg.text) });
            else chatHistory.push({ role: "assistant", content: msg.raw || unescapeHtml(msg.text) });
        });
        sessionMessages = session.messages.slice();
        if (chatContainer) {
            chatContainer.innerHTML = "";
            session.messages.forEach(msg => addMessageToDOM(msg.text, msg.role === "user" ? "user" : "ai"));
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

    mainInput?.addEventListener("keypress", (e) => { if (e.key === "Enter") { startChat(mainInput.value.trim()); mainInput.value = ""; } });
    startChatBtn?.addEventListener("click", () => { startChat(mainInput.value.trim()); mainInput.value = ""; });
    chatInput?.addEventListener("keypress", (e) => { if (e.key === "Enter") sendChatMessage(); });
    sendMessageBtn?.addEventListener("click", sendChatMessage);

    document.querySelectorAll(".suggestion-card").forEach(card => {
        card.addEventListener("click", () => {
            const titleEl = card.querySelector("h4")?.textContent;
            if (titleEl) startChat(titleEl);
        });
    });

    const stateLoaded = loadChatState();
    if (!stateLoaded) { showEmptyUI(); renderRecentChats(); }
    else { renderRecentChats(); if (chatInput) chatInput.focus(); }

    const newChatHeaderBtn = document.querySelector('.new-chat-header-btn');
    if (newChatHeaderBtn) newChatHeaderBtn.addEventListener('click', resetToNewChat);
});

// ================= UTILS =================
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function unescapeHtml(html) {
    return html.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

(function addActiveSessionStyle() {
    const style = document.createElement("style");
    style.textContent = `.recent-item.active-session { background: rgba(79, 70, 229, 0.12) !important; border-left: 3px solid #4f46e5; } .recent-item.active-session .recent-text { color: #4f46e5; font-weight: 600; }`;
    document.head.appendChild(style);
})();

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

// ================= MULTI-ACCOUNT MANAGER =================
const ACCOUNTS_KEY = "brainwave_accounts";
const CURRENT_ACCOUNT_KEY = "brainwave_current_account";

function getStoredAccounts() {
    const accounts = localStorage.getItem(ACCOUNTS_KEY);
    return accounts ? JSON.parse(accounts) : [];
}
function saveAccounts(accounts) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }
function getCurrentAccount() {
    const current = localStorage.getItem(CURRENT_ACCOUNT_KEY);
    return current ? JSON.parse(current) : null;
}
function saveCurrentAccount(account) { localStorage.setItem(CURRENT_ACCOUNT_KEY, JSON.stringify(account)); }

async function addAnotherAccount() {
    try {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            const currentAccount = { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName, photoURL: currentUser.photoURL, providerId: currentUser.providerData?.[0]?.providerId || 'password', lastUsed: Date.now() };
            const accounts = getStoredAccounts();
            const existingIndex = accounts.findIndex(acc => acc.uid === currentAccount.uid);
            if (existingIndex !== -1) accounts[existingIndex] = { ...currentAccount, lastUsed: Date.now() };
            else accounts.push(currentAccount);
            saveAccounts(accounts);
        }
        await firebase.auth().signOut();
        showAccountSelectionModal();
    } catch (error) {
        showToast("Failed to switch accounts", "error");
    }
}

function showAccountSelectionModal() {
    const existing = document.getElementById('accountSelectionOverlay');
    if (existing) existing.remove();
    const accounts = getStoredAccounts();
    const overlay = document.createElement('div');
    overlay.className = 'subscription-overlay';
    overlay.id = 'accountSelectionOverlay';
    overlay.innerHTML = `
        <div class="subscription-modal" style="max-width: 450px;">
            <button class="sub-modal-close" onclick="closeAccountSelectionModal()">✕</button>
            <div class="sub-modal-header"><h2 class="sub-modal-title">Switch Account</h2><p class="sub-modal-subtitle">Choose an account to continue</p></div>
            <div class="accounts-list" style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
                ${accounts.length > 0 ? accounts.map(account => `
                    <div class="account-item" onclick="switchToAccount('${account.uid}')" style="display:flex;align-items:center;gap:15px;padding:15px;margin:8px 0;border-radius:12px;cursor:pointer;transition:all 0.2s;background:#f8f9fa;border:1px solid #e5e7eb;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#f8f9fa'">
                        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">${getInitials(account.displayName || account.email)}</div>
                        <div style="flex:1;"><div style="font-weight:600;color:#1f2937;">${account.displayName || 'User'}</div><div style="font-size:13px;color:#6b7280;">${account.email}</div></div>
                        <i class="ri-arrow-right-s-line" style="color:#9ca3af;font-size:20px;"></i>
                    </div>`).join('') : ''}
            </div>
            <div style="border-top:1px solid #e5e7eb;margin:15px 0;padding-top:15px;">
                <button onclick="showLoginOptions()" style="width:100%;padding:12px;background:#4f46e5;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'"><i class="ri-add-line"></i> Add new account</button>
            </div>
            <div class="modal-footer" style="margin-top:15px;"><button class="cancel-btn" onclick="closeAccountSelectionModal()">Cancel</button></div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAccountSelectionModal(); });
}

function closeAccountSelectionModal() { const o = document.getElementById('accountSelectionOverlay'); if (o) o.remove(); }

async function switchToAccount(uid) {
    closeAccountSelectionModal();
    showToast("Switching account...", "info");
    const accounts = getStoredAccounts();
    const targetAccount = accounts.find(acc => acc.uid === uid);
    if (!targetAccount) { showToast("Account not found", "error"); return; }
    saveCurrentAccount(targetAccount);
    showToast("Please sign in to continue", "info");
    setTimeout(() => { window.location.href = `../Pages/account.html?email=${encodeURIComponent(targetAccount.email)}`; }, 1500);
}

function showLoginOptions() {
    closeAccountSelectionModal();
    const modal = document.createElement('div');
    modal.className = 'subscription-overlay';
    modal.id = 'loginOptionsOverlay';
    modal.innerHTML = `
        <div class="subscription-modal" style="max-width:400px;">
            <button class="sub-modal-close" onclick="closeLoginOptionsModal()">✕</button>
            <div class="sub-modal-header"><h2 class="sub-modal-title">Add Account</h2><p class="sub-modal-subtitle">Sign in with your preferred method</p></div>
            <div style="padding:20px 0;">
                <button onclick="signInWithGoogle()" style="width:100%;padding:12px;margin:8px 0;background:white;color:#1f2937;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'"><i class="ri-google-line" style="font-size:20px;"></i> Continue with Google</button>
                <button onclick="signInWithGithub()" style="width:100%;padding:12px;margin:8px 0;background:#24292e;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;" onmouseover="this.style.background='#1b1f23'" onmouseout="this.style.background='#24292e'"><i class="ri-github-line" style="font-size:20px;"></i> Continue with GitHub</button>
                <button onclick="signInWithEmail()" style="width:100%;padding:12px;margin:8px 0;background:#4f46e5;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'"><i class="ri-mail-line"></i> Continue with Email</button>
            </div>
            <div class="modal-footer"><button class="cancel-btn" onclick="closeLoginOptionsModal()">Cancel</button></div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeLoginOptionsModal(); });
}

function closeLoginOptionsModal() { const o = document.getElementById('loginOptionsOverlay'); if (o) o.remove(); }

async function signInWithGoogle() {
    closeLoginOptionsModal();
    showToast("Redirecting to Google...", "info");
    const provider = new firebase.auth.GoogleAuthProvider();
    try { const result = await firebase.auth().signInWithPopup(provider); handleNewAccountLogin(result.user); }
    catch (error) { showToast("Google sign-in failed", "error"); }
}

async function signInWithGithub() {
    closeLoginOptionsModal();
    showToast("Redirecting to GitHub...", "info");
    const provider = new firebase.auth.GithubAuthProvider();
    try { const result = await firebase.auth().signInWithPopup(provider); handleNewAccountLogin(result.user); }
    catch (error) { showToast("GitHub sign-in failed", "error"); }
}

function signInWithEmail() {
    closeLoginOptionsModal();
    const emailModal = document.createElement('div');
    emailModal.className = 'subscription-overlay';
    emailModal.id = 'emailLoginOverlay';
    emailModal.innerHTML = `
        <div class="subscription-modal" style="max-width:400px;">
            <button class="sub-modal-close" onclick="closeEmailLoginModal()">✕</button>
            <div class="sub-modal-header"><h2 class="sub-modal-title">Email Sign In</h2><p class="sub-modal-subtitle">Enter your credentials</p></div>
            <div style="padding:20px 0;">
                <input type="email" id="emailInput" placeholder="Email" style="width:100%;padding:12px;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:'Montserrat',sans-serif;outline:none;">
                <input type="password" id="passwordInput" placeholder="Password" style="width:100%;padding:12px;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:'Montserrat',sans-serif;outline:none;">
                <button onclick="handleEmailSignIn()" style="width:100%;padding:12px;margin-top:15px;background:#4f46e5;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-family:'Montserrat',sans-serif;">Sign In</button>
                <button onclick="showSignUp()" style="width:100%;padding:10px;margin-top:10px;background:transparent;color:#4f46e5;border:none;cursor:pointer;font-size:14px;">Create new account</button>
            </div>
            <div class="modal-footer"><button class="cancel-btn" onclick="closeEmailLoginModal()">Cancel</button></div>
        </div>`;
    document.body.appendChild(emailModal);
    emailModal.addEventListener('click', (e) => { if (e.target === emailModal) closeEmailLoginModal(); });
}

function closeEmailLoginModal() { const o = document.getElementById('emailLoginOverlay'); if (o) o.remove(); }

async function handleEmailSignIn() {
    const email = document.getElementById('emailInput')?.value;
    const password = document.getElementById('passwordInput')?.value;
    if (!email || !password) { showToast("Please enter email and password", "error"); return; }
    showToast("Signing in...", "info");
    try { const result = await firebase.auth().signInWithEmailAndPassword(email, password); handleNewAccountLogin(result.user); }
    catch (error) { showToast(error.message || "Sign-in failed", "error"); }
}

function showSignUp() {
    closeEmailLoginModal();
    const signupModal = document.createElement('div');
    signupModal.className = 'subscription-overlay';
    signupModal.id = 'signupOverlay';
    signupModal.innerHTML = `
        <div class="subscription-modal" style="max-width:400px;">
            <button class="sub-modal-close" onclick="closeSignupModal()">✕</button>
            <div class="sub-modal-header"><h2 class="sub-modal-title">Create Account</h2><p class="sub-modal-subtitle">Sign up to get started</p></div>
            <div style="padding:20px 0;">
                <input type="text" id="signupName" placeholder="Full Name" style="width:100%;padding:12px;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:'Montserrat',sans-serif;outline:none;">
                <input type="email" id="signupEmail" placeholder="Email" style="width:100%;padding:12px;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:'Montserrat',sans-serif;outline:none;">
                <input type="password" id="signupPassword" placeholder="Password (min 6 characters)" style="width:100%;padding:12px;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:'Montserrat',sans-serif;outline:none;">
                <button onclick="handleSignUp()" style="width:100%;padding:12px;margin-top:15px;background:#4f46e5;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-family:'Montserrat',sans-serif;">Create Account</button>
            </div>
            <div class="modal-footer"><button class="cancel-btn" onclick="closeSignupModal()">Cancel</button></div>
        </div>`;
    document.body.appendChild(signupModal);
    signupModal.addEventListener('click', (e) => { if (e.target === signupModal) closeSignupModal(); });
}

function closeSignupModal() { const o = document.getElementById('signupOverlay'); if (o) o.remove(); }

async function handleSignUp() {
    const name = document.getElementById('signupName')?.value;
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPassword')?.value;
    if (!name || !email || !password) { showToast("Please fill all fields", "error"); return; }
    if (password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    showToast("Creating account...", "info");
    try {
        const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });
        handleNewAccountLogin(result.user);
    } catch (error) { showToast(error.message || "Signup failed", "error"); }
}

async function handleNewAccountLogin(user) {
    if (!user) return;
    const newAccount = { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, providerId: user.providerData?.[0]?.providerId || 'password', lastUsed: Date.now() };
    const accounts = getStoredAccounts();
    const existingIndex = accounts.findIndex(acc => acc.uid === newAccount.uid);
    if (existingIndex !== -1) accounts[existingIndex] = newAccount;
    else accounts.push(newAccount);
    saveAccounts(accounts);
    saveCurrentAccount(newAccount);
    showToast(`Welcome ${newAccount.displayName || 'User'}! ✅`, "success");
    setTimeout(() => window.location.reload(), 1500);
}

window.addAnotherAccount = addAnotherAccount;
window.switchToAccount = switchToAccount;
window.showLoginOptions = showLoginOptions;
window.signInWithGoogle = signInWithGoogle;
window.signInWithGithub = signInWithGithub;
window.signInWithEmail = signInWithEmail;
window.handleEmailSignIn = handleEmailSignIn;
window.showSignUp = showSignUp;
window.handleSignUp = handleSignUp;
window.closeAccountSelectionModal = closeAccountSelectionModal;
window.closeLoginOptionsModal = closeLoginOptionsModal;
window.closeEmailLoginModal = closeEmailLoginModal;
window.closeSignupModal = closeSignupModal;

// ================= LOGOUT =================
document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.querySelector(".dropdown-item.logout");
    logoutBtn?.addEventListener("click", () => {
        showToast("Logging out...", "info");
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
        if (isRecording) { recognition.stop(); micBtn.classList.remove("recording"); isRecording = false; return; }
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            micBtn.classList.add("recording"); isRecording = true; recognition.start();
        } catch (err) { alert("Mic permission denied ❌"); }
    });
    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        micBtn.classList.remove("recording"); micBtn.classList.add("processing"); isRecording = false;
        input.value = text;
        setTimeout(() => { micBtn.classList.remove("processing"); sendBtn.click(); }, 800);
    };
    recognition.onerror = () => { micBtn.classList.remove("recording"); micBtn.classList.remove("processing"); isRecording = false; alert("Voice error ❌"); };
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
    let total = 3, filled = 0;
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
            else input.style.borderColor = "#e5e7eb";
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

document.querySelectorAll('[data-type="interest"]').forEach((el) => { el.addEventListener("click", () => el.classList.toggle("active")); });

finishBtn?.addEventListener("click", () => {
    if (!validateStep1()) { alert("Please fill Name, Username and Phone"); return; }
    const personality = document.querySelector('[data-type="personality"].active');
    const interests = document.querySelectorAll('[data-type="interest"].active');
    if (!personality) { alert("Please select a personality"); return; }
    if (interests.length === 0) { alert("Please select at least one interest"); return; }
    if (typeof firebase !== "undefined" && firebase.apps.length) {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) localStorage.setItem("setupComplete_" + currentUser.uid, "true");
    }
    window.location.href = "dashboard.html";
});

const yearEl = safeQuery("#year");
if (yearEl) yearEl.innerText = new Date().getFullYear();
