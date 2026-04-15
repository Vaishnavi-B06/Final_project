// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDQCy5uclYiV5ZHWIhBCCqRQ_wCRVeEHP4",
    authDomain: "smart-glam.firebaseapp.com",
    databaseURL: "https://smart-glam-default-rtdb.firebaseio.com",
    projectId: "smart-glam",
    storageBucket: "smart-glam.firebasestorage.app",
    messagingSenderId: "1027496582465",
    appId: "1:1027496582465:web:8b73bf140365970a7055c0",
    measurementId: "G-Z2JTP97G2S"
};

// Initialize Firebase only if not already initialized
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    window.auth = firebase.auth();
    window.db = firebase.database();

    window.auth.onAuthStateChanged((user) => {
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html') || path.includes('signup.html') ||
            path === '/' || path.endsWith('index.html');
        if (user) {
            localStorage.setItem('userId', user.uid);
            if (isAuthPage) window.location.href = 'dashboard.html';
        } else {
            localStorage.removeItem('userId');
            if (!isAuthPage) window.location.href = 'login.html';
        }
    });
} else {
    console.warn('Firebase SDK not loaded');
}

// --- SIGN UP ---
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            if (typeof toggleLoader === 'function') toggleLoader(true, 'Creating account...');
            if (window.auth) {
                window.auth.createUserWithEmailAndPassword(email, password)
                    .then(() => { if (typeof showToast === 'function') showToast('Account created! ✨'); })
                    .catch((err) => {
                        if (typeof toggleLoader === 'function') toggleLoader(false);
                        if (typeof showToast === 'function') showToast(err.message, 'error');
                    });
            }
        });
    }

    // --- LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            if (typeof toggleLoader === 'function') toggleLoader(true, 'Logging in...');
            if (window.auth) {
                window.auth.signInWithEmailAndPassword(email, password)
                    .then(() => { if (typeof showToast === 'function') showToast('Welcome back! 💄'); })
                    .catch((err) => {
                        if (typeof toggleLoader === 'function') toggleLoader(false);
                        if (typeof showToast === 'function') showToast(err.message, 'error');
                    });
            }
        });
    }

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.auth) {
                window.auth.signOut()
                    .then(() => { if (typeof showToast === 'function') showToast('Logged out'); })
                    .catch(console.error);
            }
        });
    }
});

// --- DB HELPER ---
function saveToFirebase(imageUrl) {
    if (!window.auth || !window.db) return Promise.reject('Firebase not initialized');
    const user = window.auth.currentUser;
    if (!user) return Promise.reject('Not logged in');

    const entryId = `look_${Date.now()}`;
    return window.db.ref('users/' + user.uid + '/uploads/' + entryId).set({
        userId: user.uid,
        imageUrl,
        timestamp: Date.now()
    }).then(() => console.log('Saved to Firebase'))
        .catch(err => { console.error('Firebase DB Error:', err); throw err; });
}
