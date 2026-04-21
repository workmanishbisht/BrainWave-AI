document.addEventListener("DOMContentLoaded", function () {

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

    const loginBox   = document.getElementById("login-form");
    const signupBox  = document.getElementById("signup-form");
    const forgotBox  = document.getElementById("forgot-form");
    const loginForm  = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const forgotForm = document.getElementById("forgotForm");

    document.getElementById("year").textContent = new Date().getFullYear();

    function showForm(active) {
        [loginBox, signupBox, forgotBox].forEach(f => f?.classList.remove("active"));
        active?.classList.add("active");
    }

    document.getElementById("show-signup")?.addEventListener("click", e => { e.preventDefault(); showForm(signupBox); });
    document.getElementById("show-login")?.addEventListener("click",  e => { e.preventDefault(); showForm(loginBox);  });
    document.getElementById("show-forgot")?.addEventListener("click", e => { e.preventDefault(); showForm(forgotBox); });
    document.getElementById("back-login")?.addEventListener("click",  e => { e.preventDefault(); showForm(loginBox);  });

    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", function () {
            const input = this.previousElementSibling;
            const icon  = this.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                icon?.classList.replace("ri-eye-off-line", "ri-eye-line");
            } else {
                input.type = "password";
                icon?.classList.replace("ri-eye-line", "ri-eye-off-line");
            }
        });
    });

    function showToast(message, success = true) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.style.background = success ? "#16a34a" : "#1a1a2e";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }

    function isSetupDone(uid) {
        return localStorage.getItem("setupComplete_" + uid) === "true";
    }

    function markSetupDone(uid) {
        localStorage.setItem("setupComplete_" + uid, "true");
    }

    function redirectUser(user) {
        if (isSetupDone(user.uid)) {
            window.location.href = "../Pages/dashboard.html";
            return;
        }
        const created   = new Date(user.metadata.creationTime).getTime();
        const lastLogin = new Date(user.metadata.lastSignInTime).getTime();
        const diffMins  = (lastLogin - created) / 60000;

        if (diffMins > 5) {
            markSetupDone(user.uid);
            window.location.href = "../Pages/dashboard.html";
        } else {
            window.location.href = "../Pages/setup.html";
        }
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            if (sessionStorage.getItem("loggedOut")) {
                sessionStorage.removeItem("loggedOut");
                return;
            }
            redirectUser(user);
        }
    });

    document.querySelectorAll(".google-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then(res => {
                    showToast("Google login successful!", true);
                    setTimeout(() => redirectUser(res.user), 1200);
                })
                .catch(err => showToast(err.message || "Google login failed", false));
        });
    });

    document.querySelectorAll(".github-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const provider = new firebase.auth.GithubAuthProvider();
            auth.signInWithPopup(provider)
                .then(res => {
                    showToast("GitHub login successful!", true);
                    setTimeout(() => redirectUser(res.user), 1200);
                })
                .catch(err => showToast(err.message || "GitHub login failed", false));
        });
    });

    loginForm?.addEventListener("submit", e => {
        e.preventDefault();
        const email    = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) { showToast("Enter email & password", false); return; }

        auth.signInWithEmailAndPassword(email, password)
            .then(res => {
                showToast("Welcome back!", true);
                setTimeout(() => redirectUser(res.user), 1200);
            })
            .catch(err => {
                const msgs = {
                    "auth/user-not-found":     "User not found",
                    "auth/wrong-password":     "Incorrect password",
                    "auth/invalid-email":      "Invalid email address",
                    "auth/too-many-requests":  "Too many attempts. Try later",
                };
                showToast(msgs[err.code] || "Login failed", false);
            });
    });

    signupForm?.addEventListener("submit", e => {
        e.preventDefault();
        const name     = document.getElementById("signupName").value.trim();
        const email    = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;

        if (!name || !email || !password) { showToast("All fields are required", false); return; }
        if (password.length < 6) { showToast("Password must be at least 6 characters", false); return; }

        auth.createUserWithEmailAndPassword(email, password)
            .then(res => res.user.updateProfile({ displayName: name }).then(() => res.user))
            .then(() => {
                showToast("Account created!", true);
                setTimeout(() => { window.location.href = "../Pages/setup.html"; }, 1200);
            })
            .catch(err => {
                const msgs = {
                    "auth/email-already-in-use": "Email already in use",
                    "auth/invalid-email":        "Invalid email address",
                    "auth/weak-password":        "Password is too weak",
                };
                showToast(msgs[err.code] || "Signup failed", false);
            });
    });

    forgotForm?.addEventListener("submit", e => {
        e.preventDefault();
        const email = document.getElementById("forgotEmail").value.trim();
        if (!email) { showToast("Enter your email", false); return; }

        auth.sendPasswordResetEmail(email)
            .then(() => {
                showToast("Reset link sent to your email", true);
                showForm(loginBox);
            })
            .catch(err => {
                const msgs = {
                    "auth/user-not-found": "Email not registered",
                    "auth/invalid-email":  "Invalid email address",
                };
                showToast(msgs[err.code] || "Failed to send reset email", false);
            });
    });

});
