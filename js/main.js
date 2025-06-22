// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyAaNGTCdQVnF7hqLD3irngJQquHRK8vCXk",
  authDomain: "fc-wolves-app.firebaseapp.com",
  databaseURL: "https://fc-wolves-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fc-wolves-app",
  storageBucket: "fc-wolves-app.appspot.com",
  messagingSenderId: "1052697954397",
  appId: "1:1052697954397:web:7266d638b753093c94e5b4"
};

// Initialize Firebase
let app, db;
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// ===== Global Variables =====
let currentUser = null;
let currentUserType = null;

// ===== Initialize Default Data =====
function initializeDefaultData() {
    // Add all FC Wolves players
    const defaultPlayers = [
        {
            name: "جهاد الغرياني",
            code: "0011JM",
            position: "رأس حربة",
            number: 9
        },
        {
            name: "عبدالسلام علي",
            code: "aabd11",
            position: "حارس",
            number: 1
        },
        {
            name: "ميمد",
            code: "mmemd110",
            position: "وسط",
            number: 8
        },
        {
            name: "تخرخوري",
            code: "ttgrgoi77",
            position: "جناح او حارس",
            number: 7
        },
        {
            name: "ميلاد",
            code: "mmellad44",
            position: "قلب دفاع",
            number: 4
        },
        {
            name: "الديدي",
            code: "dedeee222",
            position: "قلب دفاع",
            number: 2
        }
    ];
    
    const existingPlayers = getFromLocalStorage("players");
    if (!existingPlayers || existingPlayers.length === 0) {
        saveToLocalStorage("players", defaultPlayers);
        if (db) {
            saveData("players", defaultPlayers);
        }
    }
}

// ===== Utility Functions =====

function showMessage(message, type = "success") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = "block";
    
    const container = document.querySelector(".container") || document.body;
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showLoading(show = true) {
    const loading = document.querySelector(".loading");
    if (loading) {
        loading.style.display = show ? "block" : "none";
    }
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Error reading from localStorage:", error);
        return null;
    }
}

// ===== Authentication Functions =====

function validateAccessCode(code) {
    const adminCode = "0011JMFC";
    
    // Check if it's admin code
    if (code === adminCode) {
        return { type: "admin", user: { name: "المدرب", role: "admin" } };
    }
    
    // Check player codes
    const players = getFromLocalStorage("players") || [];
    const player = players.find(p => p.code === code);
    
    if (player) {
        return { type: "player", user: player };
    }
    
    return null;
}

function logout() {
    currentUser = null;
    currentUserType = null;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserType");
    window.location.href = "index.html";
}

// ===== Data Management Functions =====

async function saveData(path, data) {
    try {
        if (db) {
            await db.ref(path).set(data);
        }
        // Always save to localStorage as backup
        saveToLocalStorage(path.replace("/", "_"), data);
        return true;
    } catch (error) {
        console.error("Error saving data:", error);
        // Fallback to localStorage only
        saveToLocalStorage(path.replace("/", "_"), data);
        return false;
    }
}

async function loadData(path) {
    try {
        if (db) {
            const snapshot = await db.ref(path).once("value");
            const data = snapshot.val();
            if (data) {
                // Save to localStorage for offline access
                saveToLocalStorage(path.replace("/", "_"), data);
                return data;
            }
        }
    } catch (error) {
        console.error("Error loading from Firebase:", error);
    }
    
    // Fallback to localStorage
    return getFromLocalStorage(path.replace("/", "_"));
}

async function pushData(path, data) {
    try {
        if (db) {
            const ref = await db.ref(path).push(data);
            return ref.key;
        }
    }
    catch (error) {
        console.error("Error pushing to Firebase:", error);
    }
    
    // Fallback to localStorage with generated ID
    const id = generateId();
    const existingData = getFromLocalStorage(path.replace("/", "_")) || {};
    existingData[id] = data;
    saveToLocalStorage(path.replace("/", "_"), existingData);
    return id;
}

// ===== Notification Functions =====

function createNotification(title, message, type = "info") {
    const notification = {
        id: generateId(),
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    // Save notification
    const notifications = getFromLocalStorage("notifications") || [];
    notifications.unshift(notification);
    saveToLocalStorage("notifications", notifications);
    
    // Save to Firebase
    if (db) {
        db.ref("notifications").child(notification.id).set(notification);
    }
    
    return notification;
}

function showNotificationPopup(title, message, type = "info") {
    const popup = document.createElement("div");
    popup.className = `notification-popup ${type}`;
    popup.innerHTML = `
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
        }
    }, 5000);
}

// Initialize default data when the script loads
document.addEventListener("DOMContentLoaded", () => {
    initializeDefaultData();
});

// ===== Export functions for use in other files =====
window.FCWolvesUtils = {
    showMessage,
    showLoading,
    formatDate,
    generateId,
    saveToLocalStorage,
    getFromLocalStorage,
    validateAccessCode,
    logout,
    saveData,
    loadData,
    pushData,
    createNotification,
    showNotificationPopup,
    firebaseConfig,
    db
};

