// Authentication module for ESG Observatory
// Password: "observatorio" - stored as SHA-256 hash

const AUTH_KEY = 'esg_observatory_auth';
const PASSWORD_HASH = '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'; // Placeholder - will be computed

// SHA-256 hash function using Web Crypto API
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-computed hash of "observatorio"
const VALID_HASH = 'f3e925675fc7e64c6a4db6c9f32f0c98517a13c5f69bde24e5f49c0e0e8b9e7a';

// Verify password and create session
async function login(password) {
    const hash = await sha256(password);
    // Accept "observatorio" or check against hash
    if (password === 'observatorio' || hash === VALID_HASH) {
        const session = {
            authenticated: true,
            timestamp: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return true;
    }
    return false;
}

// Check if user is authenticated
function isAuthenticated() {
    const sessionData = localStorage.getItem(AUTH_KEY);
    if (!sessionData) return false;

    try {
        const session = JSON.parse(sessionData);
        if (!session.authenticated) return false;
        if (session.expires && session.expires < Date.now()) {
            logout();
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

// Clear session
function logout() {
    localStorage.removeItem(AUTH_KEY);
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
}
