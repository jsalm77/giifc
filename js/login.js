// ===== Login Page Logic =====
document.addEventListener("DOMContentLoaded", () => {
    const accessCodeInput = document.getElementById("accessCode");
    const loginBtn = document.getElementById("loginBtn");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");
    const loadingSpinner = document.getElementById("loadingSpinner");

    // Check if user is already logged in
    const currentUser = FCWolvesUtils.getFromLocalStorage("currentUser");
    const currentUserType = FCWolvesUtils.getFromLocalStorage("currentUserType");

    if (currentUser && currentUserType) {
        if (currentUserType === "admin") {
            window.location.href = "admin.html";
        } else if (currentUserType === "player") {
            window.location.href = "player.html";
        }
    }

    loginBtn.addEventListener("click", handleLogin);
    accessCodeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    });

    async function handleLogin() {
        const accessCode = accessCodeInput.value.trim();
        errorMessage.style.display = "none";
        successMessage.style.display = "none";
        loadingSpinner.style.display = "inline-block";
        loginBtn.disabled = true;

        if (!accessCode) {
            errorMessage.style.display = "flex";
            errorMessage.querySelector("#errorText").textContent = "الرجاء إدخال رمز الدخول!";
            loadingSpinner.style.display = "none";
            loginBtn.disabled = false;
            return;
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const validationResult = FCWolvesUtils.validateAccessCode(accessCode);

        if (validationResult) {
            FCWolvesUtils.saveToLocalStorage("currentUser", validationResult.user);
            FCWolvesUtils.saveToLocalStorage("currentUserType", validationResult.type);
            successMessage.style.display = "flex";
            successMessage.querySelector("#successText").textContent = "تم تسجيل الدخول بنجاح!";
            
            setTimeout(() => {
                if (validationResult.type === "admin") {
                    window.location.href = "admin.html";
                } else if (validationResult.type === "player") {
                    window.location.href = "player.html";
                }
            }, 1000);
        } else {
            errorMessage.style.display = "flex";
            errorMessage.querySelector("#errorText").textContent = "رمز الدخول غير صحيح!";
            loadingSpinner.style.display = "none";
            loginBtn.disabled = false;
        }
    }
});

