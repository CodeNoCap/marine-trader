document.addEventListener('DOMContentLoaded', function() {
    const loginPopup = document.getElementById("loginPopup");
    const blurBackground = document.getElementById("blurBackground");
    const loginButton = document.getElementById("loginButton");
    
    document.getElementById('closePopup').addEventListener('click', function() {
        closePopup();
    })

    if (!localStorage.getItem("isLoggedIn")) {
        loginPopup.style.display = "block";
        blurBackground.style.display = "block";
    } else {
        loginPopup.style.display = "none";
        blurBackground.style.display = "none";
    }

    loginButton.addEventListener("click", function () {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        // Simple validation (you can replace this with a real authentication check)
        if (username === "marinetrader" && password === "MarineTraderAdmin01!") {
            localStorage.setItem("isLoggedIn", true);

            loginPopup.style.display = "none";
            blurBackground.style.display = "none";

            console.log("%c[LOGIN SUCCESS] User logged in successfully", "color: limegreen");
        } else {
            alert("Invalid credentials. Please try again.");
        }
    });
});