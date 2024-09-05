import { db } from './firebase.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";
import { fetchCryptoPrice, updateCryptocurrencyValues } from './crypto.js'
import { attachEditListeners } from './addFunctionality.js';


document.addEventListener('DOMContentLoaded', function() {
    //console.log("%c[LOADED] Version 0.9", "color: cyan")
    const activeInvestmentsTable = document.getElementById('activeInvestmentsTable').getElementsByTagName('tbody')[0];
    const investmentHistoryTable = document.getElementById('investmentHistoryTable').getElementsByTagName('tbody')[0];
    let profitLossElement = document.getElementById('profitLoss');
    let totalCardElement = document.getElementById('totalCard').querySelector('p');
    let kyleGCashElement = document.getElementById('kyleGCash').querySelector('p');
    let yongGCashElement = document.getElementById('yongGCash').querySelector('p');
    let cryptoWalletElement = document.getElementById('cryptoWallet').querySelector('p');
    let totalInvestment = 0;
    let totalValue = 0;
    let profitLoss = 0;
    const hiddenStorage = new Map();

    
    investmentForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const asset = investmentForm.name.value;
        const type = investmentForm.type.value;
        const status = investmentForm.status.value;
        const date = investmentForm.date.value;
        const qty = parseFloat(investmentForm.qty.value); 
        var amount = parseFloat(investmentForm.amount.value); 
        const source = investmentForm.source.value;
        console.log(`Source value: ${source}`);
        let sourceValue = 0;
        sourceValue = getWalletValue(source);
        
        if (sourceValue < amount) {
            showPopupMessage("The amount exceeds your balance!")
        } else {
            popupMessage.style.display = 'none';
        }
        
    
        if (!isNaN(amount) && sourceValue >= amount) {
            try {
                let cryptoPrice = 1;
                let usdtPrice = 1;
                if (type === 'Cryptocurrency') {
                    cryptoPrice = await fetchCryptoPrice(asset); 
                    usdtPrice = await fetchCryptoPrice('USDT');
                    
                }
                const value = (cryptoPrice * qty);
                amount = (amount * usdtPrice); 
                const pnl = (value - amount).toFixed(2);
                
                hiddenStorage.set(asset, { qty, type, amount, pnl });
                // console.log(`Hidden storage is of type ${typeof(hiddenStorage)}`);
                console.log(`Set ${hiddenStorage[asset]}`);

                showStorage(hiddenStorage);
                addOrUpdateActiveInvestment(asset, pnl, value, status, date);
                addToInvestmentHistory(asset, type, pnl, value, date);
    
                // Deduct amount from selected source
                if (source === "GCash Kyle") {
                    kyleGCashElement.textContent = formatAsPeso((parsePesoString(kyleGCashElement.textContent) - amount).toFixed(2));
                } else if (source === "GCash Yong") {
                    yongGCashElement.textContent = formatAsPeso((parsePesoString(yongGCashElement.textContent) - amount).toFixed(2));
                } else if (source === "Cryptocurrency") {
                    cryptoWalletElement.textContent = formatAsPeso((parsePesoString(cryptoWalletElement.textContent) - amount).toFixed(2));
                }
    
                updateHoldings();
                closePopup();
            } catch (error) {
                console.error("Error processing investment:", error);
            }
        } else {
            console.error("Invalid quantity or amount.");
        }

        function showPopupMessage(message) {
            popupMessage.textContent = message;
            popupMessage.style.display = 'block';
        }
    });
    

    

    function addOrUpdateActiveInvestment(asset, pnl, value, status, date) {
        const existingRow = findRowByAsset(activeInvestmentsTable, asset);
        const deleteColumn = !isMobile() ? '<td><span class="material-icons delete-icon">delete</span></td>' : '';
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
                <td contenteditable="true"><span>${asset}</span>
                </td>
                <td contenteditable="true">
                    <span style="color:${getPnlColor(parseFloat(pnl))};">${formatAsPeso(pnl)}</span>
                </td>
                <td contenteditable="true">${formatAsPeso(value)}</td>
                <td><span class="chip ${statusChipClass}">${status}</span></td>
                <td contenteditable="true">${date}</td>
                ${deleteColumn}    
            `;

            console.log(`[BACKEND CHECK (1)] ${hiddenStorage[asset]}`);
            attachEditListeners(newRow, hiddenStorage[asset]);
            addDeleteFunctionality(newRow, 'ai');
            updateCryptoWallet();
            updateTotalCard();
        }

    }

    function addToInvestmentHistory(asset, type, pnl, value, date) {
        const newRow = investmentHistoryTable.insertRow();
        const deleteColumn = !isMobile() ? '<td><span class="material-icons delete-icon">delete</span></td>' : '';
        const typeChipClass = {
            'Cryptocurrency': 'chip-cryptocurrency',
            'On-hand': 'chip-on-hand',
            'Business': 'chip-business',
            'In wallet': 'chip-in-wallet',
            'Payment': 'chip-payment'
        }[type];


        newRow.innerHTML = `
            <td>${asset}</td>
            <td><span class="chip ${typeChipClass}">${type}</span></td>
            <td>
                <span style="color:${getPnlColor(pnl)};">${formatAsPeso(pnl)}</span>
            </td>
            <td>${formatAsPeso(value)}</td>
            <td>${formatDateForHistory(date)}</td>
            ${deleteColumn}
        `;
        addDeleteFunctionality(newRow, 'ih');
    }

    

    async function saveDataToFirestore() {
        const aiData = [];
        Array.from(activeInvestmentsTable.rows).forEach(row => {
            const asset = row.cells[0].textContent;
            const tablePnl = parsePesoString(row.cells[1].textContent);
            const value = parsePesoString(row.cells[2].textContent);
            const status = row.cells[3].textContent;
            const date = row.cells[4].textContent;
            
            let qty = null;
            let type = null;
            let amount = null;
            let pnl = null;
            if (hiddenStorage.has(asset)) {
                const storageData = hiddenStorage.get(asset);
                qty = storageData.qty || 0;
                type = storageData.type;
                amount = storageData.amount || 0;
                pnl = tablePnl;
            }


            aiData.push({
                asset,
                tablePnl,
                value,
                status,
                date,
                qty,
                type,
                amount
            });
        });

        const ihData = [];
        Array.from(investmentHistoryTable.rows).forEach(row => {
            
            ihData.push({
                asset: row.cells[0].textContent,
                type: row.cells[1].textContent,
                pnl: parsePesoString(row.cells[2].textContent), // Parse peso string back to float
                totalValue: parsePesoString(row.cells[3].textContent), // Parse peso string back to float
                date: row.cells[4].textContent
            });
        });

        let kyleGCashElement = document.getElementById('kyleGCash').querySelector('p');
        let yongGCashElement = document.getElementById('yongGCash').querySelector('p');
        try {
            const aiRef = doc(db, 'user_data', 'activeInvestments');
            await setDoc(aiRef, { investments: aiData });

            const ihRef = doc(db, 'user_data', 'investmentHistory');
            await setDoc(ihRef, { history: ihData });

            const cardsRef = doc(db, 'user_data', 'cards');
            await setDoc(cardsRef, {
                availableBalance: parsePesoString(totalCardElement.textContent), 
                totalInvestment: calculateTotalInvestment(),
                profitLoss: (profitLoss.toFixed(2)),
                profitLossColor: profitLoss > 0? 'limegreen' : 'red',
                totalCard: parsePesoString(totalCardElement.textContent),
                kyleGCash: parsePesoString(kyleGCashElement.textContent),
                yongGCash: parsePesoString(yongGCashElement.textContent),
                cryptoWallet: parsePesoString(cryptoWalletElement.textContent),
            });

            //console.log("%c[SAVED] Data successfully saved", "color: limegreen");
        } catch (error) {
            console.error("Error saving data to Firestore: ", error);
        }
    }

    function updateHoldings() {
        totalInvestment = calculateTotalInvestment();
        profitLoss = totalValue - totalInvestment;
        profitLossElement.textContent = `${formatAsPeso(profitLoss)} (${(profitLoss/totalInvestment * 100).toFixed(2)}%)`;
        profitLossElement.style.color = profitLoss > 0 ? 'limegreen' : 'red';

        // Save updated data
        saveDataToFirestore();
        updateCryptoWallet();
    }
    
    async function loadFirestoreData() {
        const deleteColumn = !isMobile() ? `<td><span class="material-icons delete-icon">delete</span></td>` : '';
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

                    hiddenStorage.set(investment.asset, {
                        qty: investment.qty || 0,
                        type: investment.type,
                        amount: investment.amount || 0,
                        pnl: investment.tablePnl || 0
                    });
                
                    totalInvestment += investment.amount;
                    totalValue += investment.value;
                    profitLoss += investment.tablePnl;
                    //console.log(`Hidden storage is of type ${typeof(hiddenStorage)}`);
                    showStorage(hiddenStorage);
    
                    totalInvestment = calculateTotalInvestment();
                
                    const statusChipClass = {
                        'Holding': 'chip-holding',
                        'Pending Payment': 'chip-pending',
                        'Available': 'chip-available'
                    }[investment.status];
                    
                    const newRow = activeInvestmentsTable.insertRow();
                    newRow.innerHTML = `
                        <td contenteditable="true">${investment.asset}</td>
                        <td contenteditable="true">
                            <span style="color:${getPnlColor(investment.tablePnl)};">${formatAsPeso(investment.tablePnl)}</span>
                        </td>
                        <td contenteditable="true">${formatAsPeso(investment.value)}</td>
                        <td contenteditable="true"><span class="chip ${statusChipClass}">${investment.status}</span></td>
                        <td contenteditable="true">${investment.date}</td>
                        ${deleteColumn}
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
                        'In wallet': 'chip-in-wallet',
                        'Payment': 'chip-payment'
                    }[history.type];
                    const newRow = investmentHistoryTable.insertRow();
                    newRow.innerHTML = `
                        <td>${history.asset}</td>
                        <td><span class="chip ${typeChipClass}">${history.type}</span></td>
                        <td>
                            <span style="color:${getPnlColor(history.pnl)};">${formatAsPeso(history.pnl)}</span>
                        </td>
                        <td>${formatAsPeso(history.value)}</td>
                        <td>${formatDateForHistory(history.date)}</td>
                        ${deleteColumn}
                    `;
                    addDeleteFunctionality(newRow, 'ih');
                });
            }
            
    
            if (cardsSnapshot.exists()) {
                const cardData = cardsSnapshot.data();
                totalCardElement.textContent = formatAsPeso(cardData.totalCard || "0");
                kyleGCashElement.textContent = formatAsPeso(cardData.kyleGCash || "0");
                yongGCashElement.textContent = formatAsPeso(cardData.yongGCash || "0");
                cryptoWalletElement.textContent = formatAsPeso(cardData.cryptoWallet || "0");
                profitLossElement.textContent = `${formatAsPeso(profitLoss)} (${(profitLoss/calculateTotalInvestment() * 100).toFixed(2)}%)`;
                profitLossElement.style.color = profitLoss > 0 ? 'limegreen' : 'red';
    
            }
            
            
            console.log("%c[LOADED] Data successfully loaded from Firestore", "color: limegreen");
        } catch (error) {
            console.error(`%c[LOADING ERROR] Error loading data from Firestore: ${error}`, "color: red");
        }
        updateCryptocurrencyValues(activeInvestmentsTable, hiddenStorage);
        await updateCryptoWallet();
        updateTotalCard();
    }

    async function updateCryptoWallet() {
        const cryptoAssets = [];
        let cryptoTotal = 0;
        //console.log("Running updateCryptoWallet()");
    
        for (const [asset, data] of hiddenStorage.entries()) {
            //console.log(`${asset} with ${data.type}`)
            if (data.type === "Cryptocurrency") {
                //console.log(`%c[CRYPTO FOUND] Found ${asset}`, "color:cyan");
                const cryptoPrice = await fetchCryptoPrice(asset);
                const assetTotal = cryptoPrice * data.qty;
                cryptoTotal += assetTotal;
    
                cryptoAssets.push({
                    asset,
                    qty: data.qty,
                    total: formatAsPeso(assetTotal.toFixed(2))
                });
            }
        }
    
        const cryptoWalletElement = document.getElementById('cryptoWallet');
        cryptoWalletElement.querySelector('p').textContent = formatAsPeso(cryptoTotal.toFixed(2));
    
        const breakdownTableBody = cryptoWalletElement.querySelector('.crypto-breakdown tbody');
        breakdownTableBody.innerHTML = cryptoAssets.map(crypto => `
            <tr>
                <td>${crypto.asset}</td>
                <td>${crypto.qty}</td>
                <td>${crypto.total}</td>
            </tr>
        `).join('');
    }
    
    // Update the total card and GCash wallets as well
    function updateTotalCard() {
        let profitLossElement = document.getElementById('profitLoss');
        let totalCardElement = document.getElementById('totalCard').querySelector('p');
        let kyleGCashElement = document.getElementById('kyleGCash').querySelector('p');
        let yongGCashElement = document.getElementById('yongGCash').querySelector('p');
        let cryptoWalletElement = document.getElementById('cryptoWallet').querySelector('p');
        
        // Ensure elements exist
        const kyleGCashText = kyleGCashElement ? String(kyleGCashElement.textContent) : "₱ 0.00";
        const yongGCashText = yongGCashElement ? String(yongGCashElement.textContent) : "₱ 0.00";
        const cryptoWalletText = cryptoWalletElement ? String(cryptoWalletElement.textContent) : "₱ 0.00";
        
        // Parse the values
        let totalHoldings = parsePesoString(kyleGCashText) + parsePesoString(yongGCashText) + parsePesoString(cryptoWalletText);

        // Update the total card element
        totalCardElement.textContent = formatAsPeso(totalHoldings.toFixed(2));
        
        // Assuming pnl is calculated somewhere
        for (const [asset, data] of hiddenStorage.entries()) {
            profitLoss += data.pnl;
        }
        
        profitLossElement.textContent = `${formatAsPeso(profitLoss)} (${(profitLoss/totalInvestment * 100).toFixed(2)}%)`;
        profitLossElement.style.color = profitLoss > 0 ? 'limegreen' : 'red';

    }


    // Aux functions
    function updateRow(row, value) {
        const currentValue = parseFloat(row.cells[2].textContent);

        row.cells[2].textContent = formatAsPeso(currentValue + value);
    }

    function findRowByAsset(table, asset) {
        return Array.from(table.rows).find(row => row.cells[0].textContent === asset);
    }

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

    function getWalletValue(wallet) {
        const source = wallet;
        if (source === 'GCash Kyle') {
            console.log(`Returning ${parsePesoString(kyleGCashElement.textContent)} from func getWalletValue(${source})`);
            return parsePesoString(kyleGCashElement.textContent);
        } else if (source === 'GCash Yong') {
            console.log(`Returning ${parsePesoString(yongGCashElement.textContent)} from func getWalletValue(${source})`);
            return parsePesoString(yongGCashElement.textContent);
        } else {
            console.log(`%c[LOG] Wallet value is ${wallet}`, "color: cyan");
            return 143.50;
        }
        
    }

    function parsePesoString(pesoString) {
        if (typeof pesoString !== 'string') {
            console.error(`Expected a string but got ${typeof pesoString}`, pesoString);
            return 0;
        }
        return parseFloat(pesoString.replace('₱', '').replace(/,/g, '').trim());
    }

    function calculateTotalInvestment() {
        hiddenStorage.forEach((value, key) => {
            totalInvestment += value.amount;
        });

        return totalInvestment;
    }

    function getPnlColor(pnl) {
        if (typeof pnl !== 'number' || isNaN(pnl)) {
            return 'white';
        }
        return pnl < 0 ? 'red' : 'limegreen';
    }
    
    window.openPopup = function(type) {
        const titleMap = {
            ai: 'Add Active Investment',
            ih: 'Add Investment History'
        };
        if (!document.getElementById('popup')) {
            console.error('Popup element not found in the DOM');
            return;
        }
        //console.log(document.getElementById('popupTitle')); // Check if this logs the correct element or null

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

    window.openTradeToHistoryPopup = function(investmentName) {
        document.getElementById('tradeHistoryForm').onsubmit = function(event) {
            event.preventDefault();
            finalizeTradeToHistory(investmentName);
        };
        document.getElementById('tradeToHistoryPopup').style.display = 'block';
    };
    
    // Function to close the trade to history popup
    window.closeTradePopup = function() {
        document.getElementById('tradeToHistoryPopup').style.display = 'none';
    };

    function showStorage(hiddenStorage) {
        if (!hiddenStorage || typeof hiddenStorage.entries !== 'function') {
            throw new Error('Input must be an iterable object');
        }
    
        //console.log("Contents of hiddenStorage:");
        
        for (let entry of hiddenStorage.entries()) {
            let [key, value] = entry;
            
            //console.log(`Key: ${JSON.stringify(key)}, Value: ${JSON.stringify(value)}`);
            
            if (typeof key === 'object' && key !== null) {
                //console.log(`  Key details: ${JSON.stringify(key, null, 2)}`);
            }
            
            if (typeof value === 'object' && value !== null) {
                //console.log(`  Value details: ${JSON.stringify(value, null, 2)}`);
            }
        }
    }
    
    // Example usage:
    // const hiddenStorage = new Map([/* ... */]);
    // printHiddenStorageContents(hiddenStorage);
    

    function addDeleteFunctionality(row, tableType) {
        const deleteIcon = row.querySelector('.delete-icon');
        const confirmDeleteButton = document.getElementById('confirmDelete');
        const deleteColumn = isMobile() ? '' : '<td><span class="material-icons delete-icon">delete</span></td>' ;
        const deletePopup = document.getElementById('deletePopup');


        let caller = isMobile() ? confirmDeleteButton : deleteIcon;
        caller.addEventListener('click', function () {
            console.log(`Clicked ${caller.id}/nRow is ${row} with asset ${row.cells[0].textContent} and the date is ${row.cells[5]}!`)
            const cells = row.cells;

    
            if (tableType === 'ai') {
                const asset = cells[0].textContent;
                const pnl = cells[1].textContent;
                const value = parseFloat(cells[2].textContent.replace(/[^0-9.-]+/g,""));
                const status = cells[3].textContent;
                const date = cells[4].textContent;
                
                
                // Add to Investment History
                const historyRow = investmentHistoryTable.insertRow();
                historyRow.innerHTML = `
                    <td>${asset}</td>
                    <td>Delete</td>
                    <td>${pnl}</td>
                    <td>${formatAsPeso(value.toFixed(2))}</td>
                    <td>${formatDateForHistory(new Date())}</td>
                    ${deleteColumn}
                `;
                addDeleteFunctionality(historyRow, 'ih');
            }
            
            row.remove();
            saveDataToFirestore();
            updateCryptoWallet()
            updateTotalCard();
            deletePopup.style.display = 'none';
        });    
    }

    function finalizeTradeToHistory(investmentName) {
        // Get final price, date, and time from the form
        const finalDateTime = document.getElementById('finalDateTime').value;
        const timestamp = new Date(finalDateTime).getTime();
    
        // Find the investment in hiddenStorage
        if (hiddenStorage.has(investmentName)) {
            // Calculate final value
            let investment = hiddenStorage.get(investmentName);
    
            // Use .then() to handle the async operation
            fetchCryptoPrice(investmentName, timestamp)
                .then(price => {
                    const finalValue = price * investment.qty;
                    const finalPnL = parseFloat((finalValue - investment.amount).toFixed(2));
    
                    addToInvestmentHistory(investmentName, 'Close Trade', finalPnL, finalValue, finalDateTime);
                    delete hiddenStorage[investmentName];
                    closeTradePopup();
                })
                .catch(error => {
                    console.error(`Error fetching crypto price: ${error}`);
                    // Handle error appropriately (e.g., show error message to user)
                });
        } else {
            //console.log(`${investmentName} not found`);
        }
    }

    loadFirestoreData();

    function onContentChange(mutationsList) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                saveDataToFirestore();
            }
        }
    }
    
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(onContentChange);
    
    // Configuration of the observer
    const config = { childList: true };
    
    // Start observing the target elements for changes
    observer.observe(kyleGCashElement, config);
    observer.observe(yongGCashElement, config);
    observer.observe(cryptoWalletElement, config);



    function isMobile() {
        const mediaQuery = window.matchMedia('(max-width: 480px)');
        return mediaQuery.matches;
    }

});



