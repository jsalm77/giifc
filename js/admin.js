// ===== Admin Page Logic =====
document.addEventListener("DOMContentLoaded", () => {
    const currentUser = FCWolvesUtils.getFromLocalStorage("currentUser");
    const currentUserType = FCWolvesUtils.getFromLocalStorage("currentUserType");

    if (!currentUser || currentUserType !== "admin") {
        window.location.href = "index.html"; // Redirect if not admin
        return;
    }

    // Display admin content
    const adminContainer = document.querySelector(".admin-container");
    adminContainer.innerHTML = `
        <h1>مرحباً بك يا ${currentUser.name} (المدرب)</h1>
        <p>هنا يمكنك إدارة اللاعبين، المباريات، وإرسال الإشعارات.</p>
        <button onclick="FCWolvesUtils.logout()">تسجيل الخروج</button>
        
        <h2>إدارة اللاعبين</h2>
        <div class="player-management">
            <input type="text" id="playerName" placeholder="اسم اللاعب">
            <input type="text" id="playerCode" placeholder="رمز الدخول">
            <input type="text" id="playerPosition" placeholder="مركز اللاعب">
            <input type="number" id="playerNumber" placeholder="رقم القميص">
            <button id="addPlayerBtn">إضافة لاعب</button>
            <ul id="playerList"></ul>
        </div>

        <h2>إدارة المباريات</h2>
        <div class="match-management">
            <input type="text" id="opponentName" placeholder="اسم الفريق المنافس">
            <input type="datetime-local" id="matchTime">
            <input type="text" id="matchLocation" placeholder="مكان المباراة">
            <select id="matchType">
                <option value="ودية">ودية</option>
                <option value="دوري رمضان">دوري رمضان</option>
                <option value="كوشه">كوشه</option>
            </select>
            <button id="addMatchBtn">إضافة مباراة</button>
            <ul id="matchList"></ul>
        </div>

        <h2>إرسال إشعار</h2>
        <div class="notification-sender">
            <input type="text" id="notificationTitle" placeholder="عنوان الإشعار">
            <textarea id="notificationMessage" placeholder="رسالة الإشعار"></textarea>
            <button id="sendNotificationBtn">إرسال الإشعار</button>
        </div>
    `;

    const addPlayerBtn = document.getElementById("addPlayerBtn");
    const playerList = document.getElementById("playerList");
    const addMatchBtn = document.getElementById("addMatchBtn");
    const matchList = document.getElementById("matchList");
    const sendNotificationBtn = document.getElementById("sendNotificationBtn");

    addPlayerBtn.addEventListener("click", addPlayer);
    addMatchBtn.addEventListener("click", addMatch);
    sendNotificationBtn.addEventListener("click", sendNotification);

    loadPlayers();
    loadMatches();

    async function addPlayer() {
        const name = document.getElementById("playerName").value.trim();
        const code = document.getElementById("playerCode").value.trim();
        const position = document.getElementById("playerPosition").value.trim();
        const number = document.getElementById("playerNumber").value.trim();

        if (!name || !code || !position || !number) {
            FCWolvesUtils.showMessage("الرجاء ملء جميع حقول اللاعب.", "error");
            return;
        }

        const newPlayer = {
            name, code, position, number: parseInt(number)
        };

        let players = FCWolvesUtils.getFromLocalStorage("players") || [];
        players.push(newPlayer);
        FCWolvesUtils.saveToLocalStorage("players", players);
        await FCWolvesUtils.saveData("players", players);
        
        FCWolvesUtils.showMessage("تم إضافة اللاعب بنجاح!");
        loadPlayers();
        document.getElementById("playerName").value = "";
        document.getElementById("playerCode").value = "";
        document.getElementById("playerPosition").value = "";
        document.getElementById("playerNumber").value = "";
    }

    async function loadPlayers() {
        const players = await FCWolvesUtils.loadData("players") || [];
        playerList.innerHTML = "";
        players.forEach(player => {
            const li = document.createElement("li");
            li.textContent = `${player.name} (${player.code}) - ${player.position} #${player.number}`;
            playerList.appendChild(li);
        });
    }

    async function addMatch() {
        const opponentName = document.getElementById("opponentName").value.trim();
        const matchTime = document.getElementById("matchTime").value;
        const matchLocation = document.getElementById("matchLocation").value.trim();
        const matchType = document.getElementById("matchType").value;

        if (!opponentName || !matchTime || !matchLocation || !matchType) {
            FCWolvesUtils.showMessage("الرجاء ملء جميع حقول المباراة.", "error");
            return;
        }

        const newMatch = {
            id: FCWolvesUtils.generateId(),
            opponentName,
            matchTime,
            matchLocation,
            matchType
        };

        let matches = FCWolvesUtils.getFromLocalStorage("matches") || [];
        matches.push(newMatch);
        FCWolvesUtils.saveToLocalStorage("matches", matches);
        await FCWolvesUtils.saveData("matches", matches);

        FCWolvesUtils.showMessage("تم إضافة المباراة بنجاح!");
        loadMatches();
        document.getElementById("opponentName").value = "";
        document.getElementById("matchTime").value = "";
        document.getElementById("matchLocation").value = "";
    }

    async function loadMatches() {
        const matches = await FCWolvesUtils.loadData("matches") || [];
        matchList.innerHTML = "";
        matches.forEach(match => {
            const li = document.createElement("li");
            li.textContent = `${match.opponentName} - ${FCWolvesUtils.formatDate(match.matchTime)} - ${match.matchLocation} (${match.matchType})`;
            matchList.appendChild(li);
        });
    }

    async function sendNotification() {
        const title = document.getElementById("notificationTitle").value.trim();
        const message = document.getElementById("notificationMessage").value.trim();

        if (!title || !message) {
            FCWolvesUtils.showMessage("الرجاء إدخال عنوان ورسالة الإشعار.", "error");
            return;
        }

        FCWolvesUtils.createNotification(title, message, "info");
        FCWolvesUtils.showMessage("تم إرسال الإشعار بنجاح!");
        document.getElementById("notificationTitle").value = "";
        document.getElementById("notificationMessage").value = "";
    }
});

