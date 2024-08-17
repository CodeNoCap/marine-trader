document.addEventListener('DOMContentLoaded', function () {
    const popup = document.getElementById('popup');
    const investmentForm = document.getElementById('investmentForm');
    const activeInvestmentsTable = document.getElementById('activeInvestmentsTable').getElementsByTagName('tbody')[0];
    const investmentHistoryTable = document.getElementById('investmentHistoryTable').getElementsByTagName('tbody')[0];
    const availableBalanceElement = document.getElementById('availableBalance').getElementsByTagName('p')[0];
    const totalInvestmentElement = document.getElementById('totalInvestment').getElementsByTagName('p')[0];
    const profitLossElement = document.getElementById('profitLoss').getElementsByTagName('p')[0];
    let totalInvestment = 0;
    let totalValue = 0;

    // Load data when the page loads
    loadData();

    investmentForm.addEventListener('submit', function (event) {
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
        saveData(); // Save data after updating

        closePopup();
    });

    function addOrUpdateActiveInvestment(asset, amount, value, status, date) {
        const existingRow = findRowByAsset(activeInvestmentsTable, asset);

        if (existingRow) {
            updateRow(existingRow, amount, value);
        } else {
            const newRow = activeInvestmentsTable.insertRow();
            newRow.innerHTML = `
                <td contenteditable="true">${asset}</td>
                <td contenteditable="true">${amount}</td>
                <td contenteditable="true">${value}</td>
                <td contenteditable="true">0%</td>
                <td contenteditable="true">${status}</td>
                <td contenteditable="true">${date}</td>
            `;
            attachEditListeners(newRow);
        }

        updatePools();
        saveData(); // Save data after updating
    }

    function addToInvestmentHistory(asset, type, amount, value, date) {
        const newRow = investmentHistoryTable.insertRow();
        newRow.innerHTML = `
            <td>${asset}</td>
            <td>${type}</td>
            <td>${amount}</td>
            <td>${value}</td>
            <td>${date}</td>
        `;
        saveData(); // Save data after updating
    }

    function findRowByAsset(table, asset) {
        return Array.from(table.rows).find(row => row.cells[0].textContent === asset);
    }

    function updateRow(row, amount, value) {
        const currentAmount = parseFloat(row.cells[1].textContent);
        const currentValue = parseFloat(row.cells[2].textContent);

        row.cells[1].textContent = currentAmount + amount;
        row.cells[2].textContent = currentValue + value;
    }

    function updatePools() {
        const rows = Array.from(activeInvestmentsTable.rows);
        const totalAmount = rows.reduce((sum, row) => sum + parseFloat(row.cells[1].textContent), 0);

        rows.forEach(row => {
            const amount = parseFloat(row.cells[1].textContent);
            row.cells[3].textContent = ((amount / totalAmount) * 100).toFixed(2) + '%';
        });
    }

    function updateHoldings() {
        const rows = Array.from(activeInvestmentsTable.rows);
        totalInvestment = rows.reduce((sum, row) => sum + parseFloat(row.cells[1].textContent), 0);
        totalValue = rows.reduce((sum, row) => sum + parseFloat(row.cells[2].textContent), 0);

        availableBalanceElement.textContent = `$${totalValue.toFixed(2)}`;
        totalInvestmentElement.textContent = `$${totalInvestment.toFixed(2)}`;
        const profitLoss = totalValue - totalInvestment;
        profitLossElement.textContent = `$${profitLoss.toFixed(2)}`;
        profitLossElement.style.color = profitLoss > 0 ? 'limegreen' : 'red';
    }

    function attachEditListeners(row) {
        Array.from(row.cells).forEach(cell => {
            cell.addEventListener('input', () => {
                updatePools();
                updateHoldings();
                saveData(); // Save data after editing
            });
        });
    }

    // Function to save data to local storage
    function saveData() {
        const activeInvestments = Array.from(activeInvestmentsTable.rows).map(row => {
            return Array.from(row.cells).map(cell => cell.textContent);
        });

        const investmentHistory = Array.from(investmentHistoryTable.rows).map(row => {
            return Array.from(row.cells).map(cell => cell.textContent);
        });

        const holdings = {
            availableBalance: availableBalanceElement.textContent,
            totalInvestment: totalInvestmentElement.textContent,
            profitLoss: profitLossElement.textContent,
            profitLossColor: profitLossElement.style.color
        };

        localStorage.setItem('activeInvestments', JSON.stringify(activeInvestments));
        localStorage.setItem('investmentHistory', JSON.stringify(investmentHistory));
        localStorage.setItem('holdings', JSON.stringify(holdings));

        console.log("%c[SAVED] Data successfully saved", "color: limegreen");
    }

    // Function to load data from local storage
    function loadData() {
        const activeInvestments = JSON.parse(localStorage.getItem('activeInvestments') || '[]');
        const investmentHistory = JSON.parse(localStorage.getItem('investmentHistory') || '[]');
        const holdings = JSON.parse(localStorage.getItem('holdings') || '{}');

        activeInvestments.forEach(rowData => {
            const newRow = activeInvestmentsTable.insertRow();
            newRow.innerHTML = rowData.map(cellData => `<td contenteditable="true">${cellData}</td>`).join('');
            attachEditListeners(newRow);
        });

        investmentHistory.forEach(rowData => {
            const newRow = investmentHistoryTable.insertRow();
            newRow.innerHTML = rowData.map(cellData => `<td>${cellData}</td>`).join('');
        });

        if (holdings.availableBalance) {
            availableBalanceElement.textContent = holdings.availableBalance;
            totalInvestmentElement.textContent = holdings.totalInvestment;
            profitLossElement.textContent = holdings.profitLoss;
            profitLossElement.style.color = holdings.profitLossColor;
        }
    }

    window.openPopup = function (type) {
        const titleMap = {
            ai: 'Add Active Investment',
            ih: 'Add Investment History'
        };

        document.getElementById('popupTitle').textContent = titleMap[type];
        investmentForm.reset();
        popup.style.display = 'block';
    }

    window.closePopup = function () {
        popup.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target === popup) {
            closePopup();
        }
    }
});
