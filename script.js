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
    const hiddenQtyStorage = {};
    const hiddenTypeStorage = {};
    
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

    // Handle login button click
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

    async function saveDataToFirestore() {
        const aiData = [];
        Array.from(activeInvestmentsTable.rows).forEach(row => {
            const asset = row.cells[0].textContent;
            const amount = parsePesoString(row.cells[1].textContent);
            const value = parsePesoString(row.cells[2].textContent);
            const pool = row.cells[3].textContent;
            const status = row.cells[4].textContent;
            const date = row.cells[5].textContent;
            
            let qty = null;
            let type = null;
            if (hiddenTypeStorage[asset] === 'Cryptocurrency') {
                qty = hiddenQtyStorage[asset] || 0; 
            }

            type = hiddenTypeStorage[asset];

            aiData.push({
                asset,
                amount,
                value,
                pool,
                status,
                date,
                qty,
                type
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

        const asset = investmentForm.name.value;
        const type = investmentForm.type.value;
        const amount = parseFloat(investmentForm.amount.value);
        const value = parseFloat(investmentForm.value.value);
        const status = investmentForm.status.value;
        const date = investmentForm.date.value;
        const qty = investmentForm.qty.value;

        hiddenQtyStorage[asset] = qty;
        hiddenTypeStorage[asset] = type;
        
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
        const statusChipClass = {
            'Holding': 'chip-holding',
            'Pending Payment': 'chip-pending',
            'Available': 'chip-available'
        }[status];
        if (existingRow) {
            updateRow(existingRow, amount, value);
        } else {
            const newRow = activeInvestmentsTable.insertRow();
            newRow.innerHTML = `
                <td contenteditable="true">${asset}</td>
                <td contenteditable="true">${formatAsPeso(amount)}</td>
                <td contenteditable="true">${formatAsPeso(value)}</td>
                <td contenteditable="true">0%</td>
                <td><span class="chip ${statusChipClass}">${status}</span></td>
                <td contenteditable="true">${date}</td>
                <td><span class="material-icons delete-icon">delete</span></td>
            `;
            attachEditListeners(newRow);
            addDeleteFunctionality(newRow, 'ai');
        }

        updatePools();
    }

    function addToInvestmentHistory(asset, type, amount, value, date) {
        const newRow = investmentHistoryTable.insertRow();
        const typeChipClass = {
            'Cryptocurrency': 'chip-cryptocurrency',
            'On-hand': 'chip-on-hand',
            'Business': 'chip-business',
            'In wallet': 'chip-in-wallet'
        }[type];
        newRow.innerHTML = `
            <td>${asset}</td>
            <td><span class="chip ${typeChipClass}">${type}</span></td>
            <td>${formatAsPeso(amount)}</td>
            <td>${formatAsPeso(value)}</td>
            <td>${formatDateForHistory(date)}</td>
            <td><span class="material-icons delete-icon">delete</span></td>
        `;
        addDeleteFunctionality(newRow, 'ih');
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
                hiddenTypeStorage[investment.asset] = investment.type;
                if (investment.type === 'Cryptocurrency' && investment.qty) {
                    hiddenQtyStorage[investment.asset] = investment.qty;
                }

                const statusChipClass = {
                    'Holding': 'chip-holding',
                    'Pending Payment': 'chip-pending',
                    'Available': 'chip-available'
                }[investment.status];
        
                const newRow = activeInvestmentsTable.insertRow();
                newRow.innerHTML = `
                    <td contenteditable="true">${investment.asset}</td>
                    <td contenteditable="true">${formatAsPeso(investment.amount)}</td>
                    <td contenteditable="true">${formatAsPeso(investment.value)}</td>
                    <td contenteditable="true">${investment.pool}</td>
                    <td contenteditable="true"><span class="chip ${statusChipClass}">${investment.status}</span></td>
                    <td contenteditable="true">${investment.date}</td>
                    <td><span class="material-icons delete-icon">delete</span></td>
                `;
                attachEditListeners(newRow);
                addDeleteFunctionality(newRow, 'ai');
            });
        }
        
        if (ihSnapshot.exists()) {
            investmentHistoryTable.innerHTML = '';
            ihSnapshot.data().history.forEach(history => {
                const typeChipClass = {
                    'Cryptocurrency': 'chip-cryptocurrency',
                    'On-hand': 'chip-on-hand',
                    'Business': 'chip-business',
                    'In wallet': 'chip-in-wallet'
                }[history.type];
        
                const newRow = investmentHistoryTable.insertRow();
                newRow.innerHTML = `
                    <td>${history.asset}</td>
                    <td><span class="chip ${typeChipClass}">${history.type}</span></td>
                    <td>${formatAsPeso(history.amount)}</tdW>
                    <td>${formatAsPeso(history.totalValue)}</td>
                    <td>${history.timestamp}</td>
                    <td><span class="material-icons delete-icon">delete</span></td>
                `;
                addDeleteFunctionality(newRow, 'ih');
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
    updateCryptocurrencyValues();
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

    document.getElementById('type').addEventListener('change', function() {
        var qtyInput = document.getElementById('qty');
        var qtyLabel = document.getElementById('qtyLabel');
        if (this.value === 'Cryptocurrency') {
            qtyInput.style.display = 'block';
            qtyLabel.style.display = 'block';
        } else {
            qtyInput.style.display = 'none';
            qtyLabel.style.display = 'none';
        }
    });
    
    function addDeleteFunctionality(row, tableType) {
        const deleteIcon = row.querySelector('.delete-icon');
        deleteIcon.addEventListener('click', function () {
            const cells = row.cells;

            if (tableType === 'ai') {
                const asset = cells[0].textContent;
                const amount = parseFloat(cells[1].textContent.replace(/[^0-9.-]+/g,""));
                const value = parseFloat(cells[2].textContent.replace(/[^0-9.-]+/g,""));
                const pool = cells[3].textContent;
                const status = cells[4].textContent;
                const date = cells[5].textContent;


                // Add to Investment History
                const historyRow = investmentHistoryTable.insertRow();
                historyRow.innerHTML = `
                    <td>${asset}</td>
                    <td>Delete investment</td>
                    <td>${formatAsPeso(amount.toFixed(2))}</td>
                    <td>${formatAsPeso(value.toFixed(2))}</td>
                    <td>${formatDateForHistory(new Date())}</td>
                    <td><span class="material-icons delete-icon">delete</span></td>
                `;
                addDeleteFunctionality(historyRow, 'ih');
            }
            
            row.remove();
            updatePools();
            updateHoldings();
            saveDataToFirestore();
        });
    }

    async function fetchCryptoPrice(asset) {
        const url = `https://coinmarketcap-proxy-374e97342789.herokuapp.com/api/${asset}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.data[asset].quote.PHP.price;
        } catch (error) {
            console.error("Error fetching cryptocurrency data: ", error);
            return null;
        }
    }
    

    async function updateCryptocurrencyValues() {
        for (const asset in hiddenTypeStorage) {
            if (hiddenTypeStorage[asset] === 'Cryptocurrency') {
                
                const qty = hiddenQtyStorage[asset];
                if (qty) {
                    const tokenPrice = await fetchCryptoPrice(asset); // Function to fetch price from API
                    const currentValue = tokenPrice * qty;
                    console.log(`%c[CRYPTO PRICE]: ${asset} is now of ${currentValue}`, "color: blue");

                    // Find the corresponding row and update the value
                    const row = findRowByAsset(activeInvestmentsTable, asset);
                    if (row) {
                        row.cells[2].textContent = formatAsPeso(currentValue.toFixed(2));
                    }
                }
            }
        }
        
        updateHoldings(); // Update overall holdings
    }
    /*
    // Responsive behavior to hide columns
    function updateTableLayout() {
        const screenWidth = window.innerWidth;
        const rows = document.querySelectorAll('#active-investments-table tr');
        
        rows.forEach(row => {
            const amountCell = row.querySelector('.amount');
            const poolCell = row.querySelector('.pool');
            const deleteCell = row.querySelector('.delete');
            
            if (screenWidth <= 480) {
                amountCell.style.display = 'none';
                poolCell.style.display = 'none';
                deleteCell.style.display = 'none';
                
                // Show amount and pool% on hover
                row.addEventListener('mouseenter', () => {
                    row.setAttribute('data-hover', `Amount: ${amountCell.textContent}, Pool: ${poolCell.textContent}`);
                });
                
                row.addEventListener('mouseleave', () => {
                    row.removeAttribute('data-hover');
                });
                console.log("%c[LOAD SUCCESSFUL] Table updated!", "color: pink");
            } else {
                amountCell.style.display = '';
                poolCell.style.display = '';
                deleteCell.style.display = '';
                
                row.removeEventListener('mouseenter', null);
                row.removeEventListener('mouseleave', null);
            }
        });
    }
    
    
    // Calculate and display profit percentage
    function calculateAndDisplayProfit() {
        const rows = document.querySelectorAll('#active-investments-table tr');
        
        rows.forEach(row => {
            const amount = parseFloat(row.querySelector('.amount').textContent.replace(/[^0-9.-]+/g, ""));
            const value = parseFloat(row.querySelector('.value').textContent.replace(/[^0-9.-]+/g, ""));
            
            const profitPercent = ((value - amount) / amount) * 100;
            const profitCell = document.createElement('div');
            profitCell.textContent = `Profit: ${profitPercent.toFixed(2)}%`;
            profitCell.style.color = profitPercent > 0 ? 'limegreen' : 'red';
            
            row.querySelector('.value').appendChild(profitCell);
        });
    }
    
    // Delete toggle functionality
    let deleteMode = false;
    
    function toggleDeleteMode() {
        deleteMode = !deleteMode;
        const deleteButton = document.querySelector('#delete-toggle-button');
        deleteButton.classList.toggle('active', deleteMode);
        
        const rows = document.querySelectorAll('#active-investments-table tr');
        
        rows.forEach(row => {
            if (deleteMode) {
                row.addEventListener('click', handleRowDelete);
            } else {
                row.removeEventListener('click', handleRowDelete);
            }
        });
    }
    
    function handleRowDelete(event) {
        if (deleteMode) {
            const row = event.currentTarget;
            const confirmed = confirm('Are you sure you want to delete this row?');
            
            if (confirmed) {
                row.remove();
                // You may also need to handle moving the row to 'Investment History' if applicable
            }
        }
    }
    
    // Event listeners
    window.addEventListener('resize', updateTableLayout);
    window.addEventListener('DOMContentLoaded', () => {
        updateTableLayout();
        calculateAndDisplayProfit();
    });
    
    document.querySelector('#delete-toggle-button').addEventListener('click', toggleDeleteMode);
    */

    
});

// 2680c8e8-dd06-4c5b-8751-57824a0c8a88

