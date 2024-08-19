import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js" ;
import { getFirestore, doc, setDoc, getDoc, collection } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdkTTiJ1aU01BRtTJNSBTLgILGlrrjp_c",
  authDomain: "marine-trader-6aeaf.firebaseapp.com",
  projectId: "marine-trader-6aeaf",
  storageBucket: "marine-trader-6aeaf.appspot.com",
  messagingSenderId: "710444092896",
  appId: "1:710444092896:web:764efd3519d99960eb6f85",
  measurementId: "G-H5HWNEW6SD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


document.addEventListener('DOMContentLoaded', function() {
    console.log("%c[LOADED] Version 0.9", "color: cyan")
    const activeInvestmentsTable = document.getElementById('activeInvestmentsTable').getElementsByTagName('tbody')[0];
    const investmentHistoryTable = document.getElementById('investmentHistoryTable').getElementsByTagName('tbody')[0];
    const availableBalanceElement = document.getElementById('availableBalance').getElementsByTagName('p')[0];
    const totalInvestmentElement = document.getElementById('totalInvestment').getElementsByTagName('p')[0];
    const profitLossElement = document.getElementById('profitLoss').getElementsByTagName('p')[0];
    let totalInvestment = 0;
    let totalValue = 0;
    const loginPopup = document.getElementById("loginPopup");
    const blurBackground = document.getElementById("blurBackground");
    const loginButton = document.getElementById("loginButton");


    if (!localStorage.getItem("isLoggedIn")) {
        loginPopup.style.display = "block";
        blurBackground.style.display = "block";
    } else {
        loginPopup.style.display = "none";
        blurBackground.style.display = "none";
    }

    // Handle login button click
    loginButton.addEventListener("click", function () {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        // Simple validation (you can replace this with a real authentication check)
        if (username === "marinetrader" && password === "MarineTraderAdmin01!") {
            // Save login state to local storage
            localStorage.setItem("isLoggedIn", true);

            // Hide login popup and background blur
            loginPopup.style.display = "none";
            blurBackground.style.display = "none";

            console.log("%c[LOGIN SUCCESS] User logged in successfully", "color: limegreen");
        } else {
            alert("Invalid credentials. Please try again.");
        }
    });

    async function saveDataToFirestore() {
        const aiData = [];
        Array.from(activeInvestmentsTable.rows).forEach(row => {
            aiData.push({
                asset: row.cells[0].textContent,
                amount: parsePesoString(row.cells[1].textContent), // Parse peso string back to float
                value: parsePesoString(row.cells[2].textContent),  // Parse peso string back to float
                pool: row.cells[3].textContent,
                status: row.cells[4].textContent,
                date: row.cells[5].textContent
            });
        });

        const ihData = [];
        Array.from(investmentHistoryTable.rows).forEach(row => {
            ihData.push({
                asset: row.cells[0].textContent,
                type: row.cells[1].textContent,
                amount: parsePesoString(row.cells[2].textContent), // Parse peso string back to float
                totalValue: parsePesoString(row.cells[3].textContent), // Parse peso string back to float
                timestamp: row.cells[4].textContent
            });
        });

        // Save to Firestore
        try {
            const aiRef = doc(db, 'user_data', 'activeInvestments');
            await setDoc(aiRef, { investments: aiData });

            const ihRef = doc(db, 'user_data', 'investmentHistory');
            await setDoc(ihRef, { history: ihData });

            const cardsRef = doc(db, 'user_data', 'cards');
            await setDoc(cardsRef, {
                availableBalance: parsePesoString(availableBalanceElement.textContent), // Parse peso string back to float
                totalInvestment: parsePesoString(totalInvestmentElement.textContent), // Parse peso string back to float
                profitLoss: parsePesoString(profitLossElement.textContent), // Parse peso string back to float
                profitLossColor: profitLossElement.style.color
            });

            console.log("%c[SAVED] Data successfully saved", "color: limegreen");
        } catch (error) {
            console.error("Error saving data to Firestore: ", error);
        }
    }

    // Function to update the UI with formatted values but keep the calculations in float
    function updateHoldings() {
        const rows = Array.from(activeInvestmentsTable.rows);
        totalInvestment = rows.reduce((sum, row) => sum + parsePesoString(row.cells[1].textContent), 0); // Use float values for sum
        totalValue = rows.reduce((sum, row) => sum + parsePesoString(row.cells[2].textContent), 0); // Use float values for sum

        availableBalanceElement.textContent = `${formatAsPeso(totalValue.toFixed(2))}`;
        totalInvestmentElement.textContent = `${formatAsPeso(totalInvestment.toFixed(2))}`;
        const profitLoss = totalValue - totalInvestment;
        profitLossElement.textContent = `${formatAsPeso(profitLoss.toFixed(2))}`;
        profitLossElement.style.color = profitLoss > 0 ? 'limegreen' : 'red';

        // Save updated data
        saveDataToFirestore();
    }

    function findRowByAsset(table, asset) {
        return Array.from(table.rows).find(row => row.cells[0].textContent === asset);
    }

    investmentForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const asset = investmentForm.asset.value;
        const type = investmentForm.type.value;
        const amount = parseFloat(investmentForm.amount.value);
        const value = parseFloat(investmentForm.value.value);
        const status = investmentForm.status.value;
        const date = investmentForm.date.value;

        addOrUpdateActiveInvestment(asset, amount, value, status, date);
        addToInvestmentHistory(asset, type, amount, value, date);

        updateHoldings();

        closePopup();
    });

    function updateRow(row, amount, value) {
        const currentAmount = parseFloat(row.cells[1].textContent);
        const currentValue = parseFloat(row.cells[2].textContent);

        row.cells[1].textContent = formatAsPeso(currentAmount + amount);
        row.cells[2].textContent = formatAsPeso(currentValue + value);
    }

    function addOrUpdateActiveInvestment(asset, amount, value, status, date) {
        const existingRow = findRowByAsset(activeInvestmentsTable, asset);
        date = formatDateForAI(date);
        if (existingRow) {
            updateRow(existingRow, amount, value);
        } else {
            const newRow = activeInvestmentsTable.insertRow();
            newRow.innerHTML = `
                <td contenteditable="true">${asset}</td>
                <td contenteditable="true">${formatAsPeso(amount)}</td>
                <td contenteditable="true">${formatAsPeso(value)}</td>
                <td contenteditable="true">0%</td>
                <td contenteditable="true">${status}</td>
                <td contenteditable="true">${date}</td>
            `;
            attachEditListeners(newRow);
        }

        updatePools();
    }

    function addToInvestmentHistory(asset, type, amount, value, date) {
        const newRow = investmentHistoryTable.insertRow();
        newRow.innerHTML = `
            <td>${asset}</td>
            <td>${type}</td>
            <td>${formatAsPeso(amount)}</td>
            <td>${formatAsPeso(value)}</td>
            <td>${formatDateForHistory(date)}</td>
        `;
    }

    function updatePools() {
        const rows = Array.from(activeInvestmentsTable.rows);
        const totalAmount = rows.reduce((sum, row) => sum + parsePesoString(row.cells[1].textContent), 0);

        rows.forEach(row => {
            const amount = parsePesoString(row.cells[1].textContent);
            row.cells[3].textContent = ((amount / totalAmount) * 100).toFixed(2) + '%';
        });

        saveDataToFirestore();
    }

    function attachEditListeners(row) {
        Array.from(row.cells).forEach(cell => {
            cell.addEventListener('input', () => {
                updatePools();
                updateHoldings();
            });
        });
    }

    
    async function loadFirestoreData() {
        try {
            const aiRef = doc(db, 'user_data', 'activeInvestments');
            const ihRef = doc(db, 'user_data', 'investmentHistory');
            const cardsRef = doc(db, 'user_data', 'cards');

            const aiSnapshot = await getDoc(aiRef);
            const ihSnapshot = await getDoc(ihRef);
            const cardsSnapshot = await getDoc(cardsRef);

            if (aiSnapshot.exists()) {
                activeInvestmentsTable.innerHTML = '';
                aiSnapshot.data().investments.forEach(investment => {
                    const newRow = activeInvestmentsTable.insertRow();
                    newRow.innerHTML = `
                        <td contenteditable="true">${investment.asset}</td>
                        <td contenteditable="true">${formatAsPeso(investment.amount)}</td>
                        <td contenteditable="true">${formatAsPeso(investment.value)}</td>
                        <td contenteditable="true">${investment.pool}</td>
                        <td contenteditable="true">${investment.status}</td>
                        <td contenteditable="true">${investment.date}</td>
                    `;
                    attachEditListeners(newRow);
                });
            }

            if (ihSnapshot.exists()) {
                investmentHistoryTable.innerHTML = '';
                ihSnapshot.data().history.forEach(history => {
                    const newRow = investmentHistoryTable.insertRow();
                    newRow.innerHTML = `
                        <td>${history.asset}</td>
                        <td>${history.type}</td>
                        <td>${formatAsPeso(history.amount)}</td>
                        <td>${formatAsPeso(history.totalValue)}</td>
                        <td>${history.timestamp}</td>
                    `;
                });
            }

            if (cardsSnapshot.exists()) {
                availableBalanceElement.textContent = formatAsPeso(cardsSnapshot.data().availableBalance);
                totalInvestmentElement.textContent = formatAsPeso(cardsSnapshot.data().totalInvestment);
                profitLossElement.textContent = formatAsPeso(cardsSnapshot.data().profitLoss);
                profitLossElement.style.color = cardsSnapshot.data().profitLossColor;
            }

            console.log("%c[LOADED] Data successfully loaded from Firestore", "color: limegreen");
        } catch (error) {
            console.error("Error loading data from Firestore: ", error);
        }
    }

    window.openPopup = function(type) {
        const titleMap = {
            ai: 'Add Active Investment',
            ih: 'Add Investment History'
        };

        document.getElementById('popupTitle').textContent = titleMap[type];
        investmentForm.reset();
        popup.style.display = 'block';
    }

    window.closePopup = function() {
        popup.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target === popup) {
            closePopup();
        }
    }

    // Load data from Firestore when the page loads
    loadFirestoreData();

    function formatDateForAI(dateString) {
        const date = new Date(dateString);
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
    }
    
    function formatDateForHistory(dateString) {
        const date = new Date(dateString);
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }

    function formatAsPeso(value) {
        return `₱ ${parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function parsePesoString(pesoString) {
        // Removes ₱ and commas, then converts to float
        return parseFloat(pesoString.replace('₱', '').replace(/,/g, '').trim());
    }

});