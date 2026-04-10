// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", function () {

    // ================= FIREBASE =================
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

    // ================= ELEMENTS =================
    const loginBox = document.getElementById("login-form");
    const signupBox = document.getElementById("signup-form");
    const forgotBox = document.getElementById("forgot-form");

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const forgotForm = document.getElementById("forgotForm");

    const showSignup = document.getElementById("show-signup");
    const showLogin = document.getElementById("show-login");
    const showForgot = document.getElementById("show-forgot");
    const backLogin = document.getElementById("back-login");

    // ================= REDIRECT =================
    function redirectUser() {
        const setupDone = localStorage.getItem("setupComplete");

        if (setupDone === "true") {
            window.location.href = "../Pages/dashboard.html";
        } else {
            window.location.href = "../Pages/setup.html";
        }
    }

    // ================= AUTO LOGIN CHECK =================
    // Jab page load ho, Firebase check karta hai user pehle se logged in hai ya nahi
    // Agar session active hai toh bina login kiye seedha dashboard/setup pe bhejo
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User pehle se logged in hai — login page dikhne ki zaroorat nahi
            redirectUser();
        }
        // Agar user null hai toh login page normal dikhta rahega
    });

    // ================= FORM TOGGLE =================
    showSignup?.addEventListener("click", (e) => {
        e.preventDefault();
        loginBox?.classList.remove("active");
        signupBox?.classList.add("active");
        forgotBox?.classList.remove("active");
    });

    showLogin?.addEventListener("click", (e) => {
        e.preventDefault();
        signupBox?.classList.remove("active");
        loginBox?.classList.add("active");
        forgotBox?.classList.remove("active");
    });

    showForgot?.addEventListener("click", (e) => {
        e.preventDefault();
        loginBox?.classList.remove("active");
        signupBox?.classList.remove("active");
        forgotBox?.classList.add("active");
    });

    backLogin?.addEventListener("click", (e) => {
        e.preventDefault();
        forgotBox?.classList.remove("active");
        loginBox?.classList.add("active");
    });

    // ================= PASSWORD TOGGLE =================
    document.querySelectorAll(".toggle-password").forEach((icon) => {
        icon.addEventListener("click", function () {
            const input = this.previousElementSibling;

            if (input.type === "password") {
                input.type = "text";
                this.classList.replace("ri-eye-off-line", "ri-eye-line");
            } else {
                input.type = "password";
                this.classList.replace("ri-eye-line", "ri-eye-off-line");
            }
        });
    });

    // ================= TOAST =================
    function showToast(message, success = true) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.className = "toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.background = success
            ? "linear-gradient(to right,#16a34a,#22c55e)"
            : "#111827";

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // ================= GOOGLE LOGIN =================
    document.querySelectorAll(".google-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const provider = new firebase.auth.GoogleAuthProvider();

            auth.signInWithPopup(provider)
                .then(() => {
                    showToast("Google login successful 🎉", true);
                    setTimeout(redirectUser, 1200);
                })
                .catch((err) => {
                    showToast(err.message || "Google login failed", false);
                });
        });
    });

    // ================= GITHUB LOGIN =================
    document.querySelectorAll(".github-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const provider = new firebase.auth.GithubAuthProvider();

            auth.signInWithPopup(provider)
                .then(() => {
                    showToast("GitHub login successful 🎉", true);
                    setTimeout(redirectUser, 1200);
                })
                .catch((err) => {
                    showToast(err.message || "GitHub login failed", false);
                });
        });
    });

    // ================= SIGNUP =================
    signupForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;

        if (!name || !email || !password) {
            showToast("All fields required", false);
            return;
        }

        if (password.length < 6) {
            showToast("Password must be at least 6 characters", false);
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.updateProfile({
                    displayName: name
                });
            })
            .then(() => {
                showToast("Account created successfully 🎉", true);

                signupBox?.classList.remove("active");
                loginBox?.classList.add("active");
            })
            .catch((error) => {
                let msg = "Signup failed";

                if (error.code === "auth/email-already-in-use")
                    msg = "Email already exists";
                else if (error.code === "auth/invalid-email")
                    msg = "Invalid email";
                else if (error.code === "auth/weak-password")
                    msg = "Weak password";

                showToast(msg, false);
            });
    });

    // ================= LOGIN =================
    loginForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {
            showToast("Enter email & password", false);
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                showToast(`Welcome ${userCredential.user.email} 🎉`, true);
                setTimeout(redirectUser, 1200);
            })
            .catch((error) => {
                let msg = "Login failed";

                if (error.code === "auth/user-not-found")
                    msg = "User not found";
                else if (error.code === "auth/wrong-password")
                    msg = "Wrong password";
                else if (error.code === "auth/invalid-email")
                    msg = "Invalid email";
                else if (error.code === "auth/too-many-requests")
                    msg = "Too many attempts. Try later";

                showToast(msg, false);
            });
    });

    // ================= FORGOT PASSWORD =================
    forgotForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("forgotEmail").value.trim();

        if (!email) {
            showToast("Enter your email", false);
            return;
        }

        auth.sendPasswordResetEmail(email)
            .then(() => {
                showToast("Reset link sent to your email 📩", true);

                forgotBox?.classList.remove("active");
                loginBox?.classList.add("active");
            })
            .catch((error) => {
                let msg = "Failed to send reset email";

                if (error.code === "auth/user-not-found")
                    msg = "Email not registered";
                else if (error.code === "auth/invalid-email")
                    msg = "Invalid email";

                showToast(msg, false);
            });
    });

});
