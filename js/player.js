// ===== Player Page Logic =====
document.addEventListener("DOMContentLoaded", () => {
    const currentUser = FCWolvesUtils.getFromLocalStorage("currentUser");
    const currentUserType = FCWolvesUtils.getFromLocalStorage("currentUserType");

    if (!currentUser || currentUserType !== "player") {
        window.location.href = "index.html"; // Redirect if not player
        return;
    }

    // Display player content
    const playerContainer = document.querySelector(".player-content");
    const navItems = document.querySelectorAll(".player-nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    const chatNavItems = document.querySelectorAll(".chat-nav-item");
    const chatSections = document.querySelectorAll(".chat-section");

    // Set initial active tab
    showTab("team-tab");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.dataset.tab + "-tab";
            showTab(tabId);
        });
    });

    // Chat navigation
    chatNavItems.forEach(item => {
        item.addEventListener("click", () => {
            const chatType = item.dataset.chatType;
            showChatSection(chatType);
        });
    });

    function showTab(tabId) {
        tabContents.forEach(content => {
            content.style.display = "none";
        });
        navItems.forEach(item => {
            item.classList.remove("active");
        });

        document.getElementById(tabId).style.display = "block";
        document.querySelector(`[data-tab="${tabId.replace("-tab", "")}"]`).classList.add("active");

        // Load content based on tab
        switch (tabId) {
            case "team-tab":
                loadTeamContent();
                break;
            case "posts-tab":
                loadPostsContent();
                break;
            case "chat-tab":
                loadChatContent();
                break;
            case "profile-tab":
                loadProfileContent();
                break;
        }
    }

    function showChatSection(chatType) {
        chatSections.forEach(section => {
            section.classList.remove("active");
        });
        chatNavItems.forEach(item => {
            item.classList.remove("active");
        });

        document.getElementById(chatType + "-chat").classList.add("active");
        document.querySelector(`[data-chat-type="${chatType}"]`).classList.add("active");

        if (chatType === "general") {
            loadGeneralChat();
        } else if (chatType === "private") {
            loadPrivateChat();
        }
    }

    async function loadTeamContent() {
        const teamTab = document.getElementById("team-tab");
        const players = await FCWolvesUtils.loadData("players") || [];
        const matches = await FCWolvesUtils.loadData("matches") || [];

        let playersHtml = players.map(p => `<li>${p.name} - ${p.position} (#${p.number})</li>`).join("");
        if (players.length === 0) playersHtml = "<p>لا يوجد لاعبون مسجلون بعد.</p>";

        let matchesHtml = matches.map(m => `<li>${m.opponentName} - ${FCWolvesUtils.formatDate(m.matchTime)} - ${m.matchLocation} (${m.matchType})</li>`).join("");
        if (matches.length === 0) matchesHtml = "<p>لا توجد مباريات مجدولة بعد.</p>";

        teamTab.innerHTML = `
            <h2>الفريق</h2>
            <h3>قائمة اللاعبين:</h3>
            <ul>${playersHtml}</ul>
            <h3>المباريات القادمة:</h3>
            <ul>${matchesHtml}</ul>
        `;
    }

    async function loadPostsContent() {
        const postsTab = document.getElementById("posts-tab");
        postsTab.innerHTML = `
            <h2>المنشورات</h2>
            <div class="post-input">
                <textarea id="postText" placeholder="ماذا يدور في ذهنك يا ${currentUser.name}؟ شاركنا أفكارك..."></textarea>
                <button id="publishPostBtn"><i class="fas fa-paper-plane"></i> نشر</button>
            </div>
            <div id="postsList"></div>
        `;

        const publishPostBtn = document.getElementById("publishPostBtn");
        publishPostBtn.addEventListener("click", publishPost);
        loadPosts();
    }

    async function publishPost() {
        const postText = document.getElementById("postText").value.trim();
        if (!postText) {
            FCWolvesUtils.showMessage("الرجاء كتابة محتوى المنشور.", "error");
            return;
        }

        const newPost = {
            id: FCWolvesUtils.generateId(),
            author: currentUser.name,
            authorCode: currentUser.code,
            text: postText,
            timestamp: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            comments: []
        };

        try {
            await FCWolvesUtils.pushData("posts", newPost);
            FCWolvesUtils.showMessage("تم نشر المنشور بنجاح!");
            document.getElementById("postText").value = "";
            loadPosts();
        } catch (error) {
            console.error("Error publishing post:", error);
            FCWolvesUtils.showMessage("حدث خطأ في نشر المنشور.", "error");
        }
    }

    async function loadPosts() {
        const postsList = document.getElementById("postsList");
        if (!postsList) return;

        try {
            const posts = await FCWolvesUtils.loadData("posts") || {};
            const postsArray = Object.entries(posts).map(([id, post]) => ({...post, id}))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (postsArray.length === 0) {
                postsList.innerHTML = "<p>لا توجد منشورات بعد. كن أول من ينشر!</p>";
                return;
            }

            postsList.innerHTML = postsArray.map(post => `
                <div class="post-item">
                    <div class="post-header">
                        <span class="post-author">${post.author}</span>
                        <span class="post-time">${FCWolvesUtils.formatDate(post.timestamp)}</span>
                    </div>
                    <p class="post-text">${post.text}</p>
                    <div class="post-actions">
                        <button onclick="likePost('${post.id}')">
                            <i class="fas fa-thumbs-up"></i> إعجاب (${post.likes || 0})
                        </button>
                        <button onclick="showComments('${post.id}')">
                            <i class="fas fa-comment"></i> تعليقات (${post.comments ? post.comments.length : 0})
                        </button>
                    </div>
                    <div class="post-comments" id="comments-${post.id}" style="display:none;">
                        <!-- Comments will be loaded here -->
                    </div>
                </div>
            `).join("");
        } catch (error) {
            console.error("Error loading posts:", error);
            postsList.innerHTML = "<p>حدث خطأ في تحميل المنشورات.</p>";
        }
    }

    // Global functions for posts
    window.likePost = async (postId) => {
        try {
            const posts = await FCWolvesUtils.loadData("posts") || {};
            if (posts[postId]) {
                if (!posts[postId].likedBy) {
                    posts[postId].likedBy = [];
                }
                
                const userIndex = posts[postId].likedBy.indexOf(currentUser.code);
                if (userIndex === -1) {
                    posts[postId].likedBy.push(currentUser.code);
                    posts[postId].likes = (posts[postId].likes || 0) + 1;
                } else {
                    posts[postId].likedBy.splice(userIndex, 1);
                    posts[postId].likes = Math.max(0, (posts[postId].likes || 0) - 1);
                }
                
                await FCWolvesUtils.saveData("posts", posts);
                loadPosts();
            }
        } catch (error) {
            console.error("Error liking post:", error);
        }
    };

    window.showComments = async (postId) => {
        const commentsDiv = document.getElementById(`comments-${postId}`);
        if (commentsDiv.style.display === "none") {
            try {
                const posts = await FCWolvesUtils.loadData("posts") || {};
                const post = posts[postId];
                if (post && post.comments) {
                    commentsDiv.innerHTML = post.comments.map(comment => `
                        <div class="comment-item">
                            <strong>${comment.author}:</strong> ${comment.text}
                            <span class="comment-time">${FCWolvesUtils.formatDate(comment.timestamp)}</span>
                        </div>
                    `).join("");
                }
                commentsDiv.innerHTML += `
                    <div class="add-comment">
                        <input type="text" id="commentInput-${postId}" placeholder="أضف تعليق...">
                        <button onclick="addComment('${postId}')">إضافة</button>
                    </div>
                `;
                commentsDiv.style.display = "block";
            } catch (error) {
                console.error("Error loading comments:", error);
            }
        } else {
            commentsDiv.style.display = "none";
        }
    };

    window.addComment = async (postId) => {
        const commentInput = document.getElementById(`commentInput-${postId}`);
        const commentText = commentInput.value.trim();
        if (!commentText) return;

        try {
            const posts = await FCWolvesUtils.loadData("posts") || {};
            if (posts[postId]) {
                if (!posts[postId].comments) {
                    posts[postId].comments = [];
                }
                posts[postId].comments.push({
                    author: currentUser.name,
                    text: commentText,
                    timestamp: new Date().toISOString()
                });
                await FCWolvesUtils.saveData("posts", posts);
                commentInput.value = "";
                showComments(postId); // Reload comments
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    async function loadChatContent() {
        // Initialize chat sections
        showChatSection("general");
    }

    async function loadGeneralChat() {
        const generalChatInput = document.getElementById("generalChatInput");
        const sendGeneralChatBtn = document.getElementById("sendGeneralChatBtn");
        
        if (sendGeneralChatBtn && !sendGeneralChatBtn.hasEventListener) {
            sendGeneralChatBtn.addEventListener("click", sendGeneralMessage);
            sendGeneralChatBtn.hasEventListener = true;
        }
        
        if (generalChatInput && !generalChatInput.hasEventListener) {
            generalChatInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    sendGeneralMessage();
                }
            });
            generalChatInput.hasEventListener = true;
        }
        
        loadGeneralMessages();
    }

    async function sendGeneralMessage() {
        const generalChatInput = document.getElementById("generalChatInput");
        const messageText = generalChatInput.value.trim();
        if (!messageText) return;

        const newMessage = {
            author: currentUser.name,
            authorCode: currentUser.code,
            text: messageText,
            timestamp: new Date().toISOString(),
            type: "general"
        };

        try {
            await FCWolvesUtils.pushData("generalChat", newMessage);
            generalChatInput.value = "";
        } catch (error) {
            console.error("Error sending message:", error);
            FCWolvesUtils.showMessage("حدث خطأ في إرسال الرسالة.", "error");
        }
    }

    async function loadGeneralMessages() {
        const chatMessagesDiv = document.getElementById("generalChatMessages");
        if (!chatMessagesDiv) return;

        // Listen for new messages in real-time
        if (FCWolvesUtils.db) {
            FCWolvesUtils.db.ref("generalChat").on("value", (snapshot) => {
                const messages = snapshot.val() || {};
                const messagesArray = Object.values(messages).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                chatMessagesDiv.innerHTML = messagesArray.map(msg => `
                    <div class="chat-message-item ${msg.authorCode === currentUser.code ? 'own-message' : ''}">
                        <strong>${msg.author}:</strong> ${msg.text}
                        <span class="chat-time">${FCWolvesUtils.formatDate(msg.timestamp)}</span>
                    </div>
                `).join("");
                
                chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll to bottom
            });
        }
    }

    async function loadPrivateChat() {
        const playerSearchInput = document.getElementById("playerSearchInput");
        const playerSearchResults = document.getElementById("playerSearchResults");
        
        if (playerSearchInput && !playerSearchInput.hasEventListener) {
            playerSearchInput.addEventListener("input", searchPlayers);
            playerSearchInput.hasEventListener = true;
        }
    }

    async function searchPlayers() {
        const searchTerm = document.getElementById("playerSearchInput").value.trim().toLowerCase();
        const playerSearchResults = document.getElementById("playerSearchResults");
        
        if (!searchTerm) {
            playerSearchResults.innerHTML = "";
            return;
        }

        try {
            const players = await FCWolvesUtils.loadData("players") || [];
            const filteredPlayers = players.filter(player => 
                player.name.toLowerCase().includes(searchTerm) && 
                player.code !== currentUser.code
            );

            if (filteredPlayers.length === 0) {
                playerSearchResults.innerHTML = "<div class='search-result-item'>لا توجد نتائج</div>";
                return;
            }

            playerSearchResults.innerHTML = filteredPlayers.map(player => `
                <div class="search-result-item" onclick="startPrivateChat('${player.code}', '${player.name}')">
                    <i class="fas fa-user"></i>
                    <span>${player.name} - ${player.position}</span>
                </div>
            `).join("");
        } catch (error) {
            console.error("Error searching players:", error);
        }
    }

    window.startPrivateChat = async (playerCode, playerName) => {
        const privateChatContainer = document.getElementById("privateChatContainer");
        const chatId = [currentUser.code, playerCode].sort().join("_");
        
        privateChatContainer.innerHTML = `
            <div class="private-chat-active">
                <div class="private-chat-header-info">
                    <i class="fas fa-user"></i>
                    <span>دردشة خاصة مع ${playerName}</span>
                </div>
                <div class="private-chat-messages" id="privateChatMessages-${chatId}"></div>
                <div class="chat-input">
                    <input type="text" id="privateChatInput-${chatId}" placeholder="اكتب رسالتك الخاصة...">
                    <button onclick="sendPrivateMessage('${chatId}', '${playerName}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // Load private messages
        loadPrivateMessages(chatId);
        
        // Clear search
        document.getElementById("playerSearchInput").value = "";
        document.getElementById("playerSearchResults").innerHTML = "";
    };

    window.sendPrivateMessage = async (chatId, receiverName) => {
        const privateChatInput = document.getElementById(`privateChatInput-${chatId}`);
        const messageText = privateChatInput.value.trim();
        if (!messageText) return;

        const newMessage = {
            sender: currentUser.name,
            senderCode: currentUser.code,
            receiver: receiverName,
            text: messageText,
            timestamp: new Date().toISOString(),
            chatId: chatId
        };

        try {
            await FCWolvesUtils.pushData(`privateChats/${chatId}`, newMessage);
            privateChatInput.value = "";
        } catch (error) {
            console.error("Error sending private message:", error);
            FCWolvesUtils.showMessage("حدث خطأ في إرسال الرسالة.", "error");
        }
    };

    async function loadPrivateMessages(chatId) {
        const privateChatMessages = document.getElementById(`privateChatMessages-${chatId}`);
        if (!privateChatMessages) return;

        // Listen for new messages in real-time
        if (FCWolvesUtils.db) {
            FCWolvesUtils.db.ref(`privateChats/${chatId}`).on("value", (snapshot) => {
                const messages = snapshot.val() || {};
                const messagesArray = Object.values(messages).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                privateChatMessages.innerHTML = messagesArray.map(msg => `
                    <div class="chat-message-item ${msg.senderCode === currentUser.code ? 'own-message' : ''}">
                        <strong>${msg.sender}:</strong> ${msg.text}
                        <span class="chat-time">${FCWolvesUtils.formatDate(msg.timestamp)}</span>
                    </div>
                `).join("");
                
                privateChatMessages.scrollTop = privateChatMessages.scrollHeight; // Scroll to bottom
            });
        }
    }

    function loadProfileContent() {
        const profileTab = document.getElementById("profile-tab");
        profileTab.innerHTML = `
            <h2>الملف الشخصي</h2>
            <div class="profile-card">
                <img src="images/default-avatar.png" alt="صورة اللاعب" class="profile-avatar" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZTk0NTYwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QujwvdGV4dD4KPHN2Zz4K'">
                <h3>${currentUser.name}</h3>
                <p><strong>رمز الدخول:</strong> ${currentUser.code}</p>
                <p><strong>المركز:</strong> ${currentUser.position}</p>
                <p><strong>رقم القميص:</strong> ${currentUser.number}</p>
                <p><strong>الوصف:</strong> لاعب أسطوري في فريق FC Wolves! 🐺⚽</p>
                <p><strong>الشعار:</strong> "الكوشه وطن و الوطن لا يُخان 😂💪"</p>
            </div>
        `;
    }
});

