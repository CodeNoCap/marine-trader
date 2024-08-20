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


document.addEventListener('DOMContentLoaded', () => {
    console.log("%c[LOADED] Version 0.9", "color: cyan");


    
    const elements = {
        activeInvestmentsTable: document.querySelector('#activeInvestmentsTable tbody'),
        investmentHistoryTable: document.querySelector('#investmentHistoryTable tbody'),
        availableBalance: document.querySelector('#availableBalance p'),
        totalInvestment: document.querySelector('#totalInvestment p'),
        profitLoss: document.querySelector('#profitLoss p'),
        loginPopup: document.getElementById("loginPopup"),
        blurBackground: document.getElementById("blurBackground"),
        loginButton: document.getElementById("loginButton")
    };
    let totalInvestment = 0, totalValue = 0;

    if (!localStorage.getItem("isLoggedIn")) {
        elements.loginPopup.style.display = "block";
        elements.blurBackground.style.display = "block";
    } else {
        elements.loginPopup.style.display = "none";
        elements.blurBackground.style.display = "none";
    }

    elements.loginButton.addEventListener("click", () => {
        const { value: username } = document.getElementById("username");
        const { value: password } = document.getElementById("password");
        if (username === "marinetrader" && password === "MarineTraderAdmin01!") {
            localStorage.setItem("isLoggedIn", true);
            elements.loginPopup.style.display = "none";
            elements.blurBackground.style.display = "none";
            console.log("%c[LOGIN SUCCESS] User logged in successfully", "color: limegreen");
        } else alert("Invalid credentials. Please try again.");
    });

    const saveDataToFirestore = async () => {
        const aiData = Array.from(elements.activeInvestmentsTable.rows).map(row => ({
            asset: row.cells[0].textContent,
            amount: parsePesoString(row.cells[1].textContent),
            value: parsePesoString(row.cells[2].textContent),
            pool: row.cells[3].textContent,
            status: row.cells[4].textContent,
            date: row.cells[5].textContent
        }));
        const ihData = Array.from(elements.investmentHistoryTable.rows).map(row => ({
            asset: row.cells[0].textContent,
            type: row.cells[1].textContent,
            amount: parsePesoString(row.cells[2].textContent),
            totalValue: parsePesoString(row.cells[3].textContent),
            timestamp: row.cells[4].textContent
        }));

        try {
            await setDoc(doc(db, 'user_data', 'activeInvestments'), { investments: aiData });
            await setDoc(doc(db, 'user_data', 'investmentHistory'), { history: ihData });
            await setDoc(doc(db, 'user_data', 'cards'), {
                availableBalance: parsePesoString(elements.availableBalance.textContent),
                totalInvestment: parsePesoString(elements.totalInvestment.textContent),
                profitLoss: parsePesoString(elements.profitLoss.textContent),
                profitLossColor: elements.profitLoss.style.color
            });
            console.log("%c[SAVED] Data successfully saved", "color: limegreen");
        } catch (error) {
            console.error("Error saving data to Firestore: ", error);
        }
    };

    const updateHoldings = () => {
        const rows = Array.from(elements.activeInvestmentsTable.rows);
        totalInvestment = rows.reduce((sum, row) => sum + parsePesoString(row.cells[1].textContent), 0);
        totalValue = rows.reduce((sum, row) => sum + parsePesoString(row.cells[2].textContent), 0);

        elements.availableBalance.textContent = formatAsPeso(totalValue.toFixed(2));
        elements.totalInvestment.textContent = formatAsPeso(totalInvestment.toFixed(2));
        const profitLoss = totalValue - totalInvestment;
        elements.profitLoss.textContent = formatAsPeso(profitLoss.toFixed(2));
        elements.profitLoss.style.color = profitLoss > 0 ? 'limegreen' : 'red';

        saveDataToFirestore();
    };

    const findRowByAsset = (table, asset) => Array.from(table.rows).find(row => row.cells[0].textContent === asset);

    investmentForm.addEventListener('submit', event => {
        event.preventDefault();
        const { asset, type, amount, value, status, date } = investmentForm;
        addOrUpdateActiveInvestment(asset.value, parseFloat(amount.value), parseFloat(value.value), status.value, date.value);
        addToInvestmentHistory(asset.value, type.value, parseFloat(amount.value), parseFloat(value.value), date.value);
        updateHoldings();
        closePopup();
    });

    const updateRow = (row, amount, value) => {
        row.cells[1].textContent = formatAsPeso(parseFloat(row.cells[1].textContent) + amount);
        row.cells[2].textContent = formatAsPeso(parseFloat(row.cells[2].textContent) + value);
    };

    const addOrUpdateActiveInvestment = (asset, amount, value, status, date) => {
        const existingRow = findRowByAsset(elements.activeInvestmentsTable, asset);
        const formattedDate = formatDateForAI(date);
        if (existingRow) updateRow(existingRow, amount, value);
        else {
            const newRow = elements.activeInvestmentsTable.insertRow();
            newRow.innerHTML = `
                <td contenteditable="true">${asset}</td>
                <td contenteditable="true">${formatAsPeso(amount)}</td>
                <td contenteditable="true">${formatAsPeso(value)}</td>
                <td contenteditable="true">0%</td>
                <td contenteditable="true">${status}</td>
                <td contenteditable="true">${formattedDate}</td>
                <td><span class="material-icons delete-icon">delete</span></td>
            `;
            attachEditListeners(newRow);
            addDeleteFunctionality(newRow, 'ai');
        }
        updatePools();
    };

    const addToInvestmentHistory = (asset, type, amount, value, date) => {
        const newRow = elements.investmentHistoryTable.insertRow();
        newRow.innerHTML = `
            <td>${asset}</td>
            <td>${type}</td>
            <td>${formatAsPeso(amount)}</td>
            <td>${formatAsPeso(value)}</td>
            <td>${formatDateForHistory(date)}</td>
            <td><span class="material-icons delete-icon">delete</span></td>
        `;
        addDeleteFunctionality(newRow, 'ih');
    };

    const updatePools = () => {
        const rows = Array.from(elements.activeInvestmentsTable.rows);
        const totalAmount = rows.reduce((sum, row) => sum + parsePesoString(row.cells[1].textContent), 0);

        rows.forEach(row => {
            const amount = parsePesoString(row.cells[1].textContent);
            row.cells[3].textContent = `${((amount / totalAmount) * 100).toFixed(2)}%`;
        });

        saveDataToFirestore();
    };

    const attachEditListeners = row => {
        Array.from(row.cells).forEach(cell => {
            cell.addEventListener('input', () => {
                updatePools();
                updateHoldings();
            });
        });
    };

    const loadFirestoreData = async () => {
        try {
            const aiSnapshot = await getDoc(doc(db, 'user_data', 'activeInvestments'));
            const ihSnapshot = await getDoc(doc(db, 'user_data', 'investmentHistory'));
            const cardsSnapshot = await getDoc(doc(db, 'user_data', 'cards'));

            if (aiSnapshot.exists()) {
                elements.activeInvestmentsTable.innerHTML = '';
                aiSnapshot.data().investments.forEach(investment => {
                    const newRow = elements.activeInvestmentsTable.insertRow();
                    newRow.innerHTML = `
                        <td contenteditable="true">${investment.asset}</td>
                        <td contenteditable="true">${formatAsPeso(investment.amount)}</td>
                        <td contenteditable="true">${formatAsPeso(investment.value)}</td>
                        <td contenteditable="true">${investment.pool}</td>
                        <td contenteditable="true">${investment.status}</td>
                        <td contenteditable="true">${investment.date}</td>
                        <td><span class="material-icons delete-icon">delete</span></td>
                    `;
                    attachEditListeners(newRow);
                    addDeleteFunctionality(newRow, 'ai');
                });
            }

            if (ihSnapshot.exists()) {
                elements.investmentHistoryTable.innerHTML = '';
                ihSnapshot.data().history.forEach(history => {
                    const newRow = elements.investmentHistoryTable.insertRow();
                    newRow.innerHTML = `
                        <td>${history.asset}</td>
                        <td>${history.type}</td>
                        <td>${formatAsPeso(history.amount)}</td>
                        <td>${formatAsPeso(history.totalValue)}</td>
                        <td>${history.timestamp}</td>
                        <td><span class="material-icons delete-icon">delete</span></td>
                    `;
                    addDeleteFunctionality(newRow, 'ih');
                });
            }

            if (cardsSnapshot.exists()) {
                elements.availableBalance.textContent = formatAsPeso(cardsSnapshot.data().availableBalance);
                elements.totalInvestment.textContent = formatAsPeso(cardsSnapshot.data().totalInvestment);
                elements.profitLoss.textContent = formatAsPeso(cardsSnapshot.data().profitLoss);
                elements.profitLoss.style.color = cardsSnapshot.data().profitLossColor;
            }

            updatePools();
            updateHoldings();
            console.log("%c[LOADED] Data successfully loaded", "color: cyan");
        } catch (error) {
            console.error("Error loading data from Firestore: ", error);
        }
    };

    const addDeleteFunctionality = (row, tableType) => {
        const deleteIcon = row.querySelector('.delete-icon');
        deleteIcon.addEventListener('click', () => {
            if (tableType === 'ai') {
                const asset = row.cells[0].textContent;
                addToInvestmentHistory(asset, 'Delete investment', -parsePesoString(row.cells[1].textContent), -parsePesoString(row.cells[2].textContent), new Date().toISOString());
                elements.activeInvestmentsTable.deleteRow(row.rowIndex - 1);
                updatePools();
                updateHoldings();
            } else if (tableType === 'ih') {
                const asset = row.cells[0].textContent;
                const type = row.cells[1].textContent;
                if (type === 'Delete investment') {
                    const correspondingRow = findRowByAsset(elements.activeInvestmentsTable, asset);
                    if (correspondingRow) {
                        updateRow(correspondingRow, parsePesoString(row.cells[2].textContent), parsePesoString(row.cells[3].textContent));
                        updatePools();
                        updateHoldings();
                    }
                }
                elements.investmentHistoryTable.deleteRow(row.rowIndex - 1);
            }
        });
    };

    const parsePesoString = str => parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0;

    const formatAsPeso = value => `₱${parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const formatDateForAI = isoDate => {
        const date = new Date(isoDate);
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
    };

    const formatDateForHistory = isoDate => {
        const date = new Date(isoDate);
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()} ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
    };

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


    loadFirestoreData();
});