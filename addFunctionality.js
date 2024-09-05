const deletePopup = document.getElementById('deletePopup');
const closeDeletePopup = document.getElementById('closeDeletePopup');
const confirmDeleteButton = document.getElementById('confirmDelete');
const cancelDeleteButton = document.getElementById('cancelDelete');
function isMobile() {
    const mediaQuery = window.matchMedia('(max-width: 480px)');
    return mediaQuery.matches;
}
document.addEventListener('DOMContentLoaded', function() {
    const kyleGCashElement = document.getElementById('kyleGCash');
    const yongGCashElement = document.getElementById('yongGCash');
    const submitButton = document.querySelector('button[type="submit"]');
    const testButton = document.getElementById('test-submit');

    // Open popup when GCash cards are clicked
    kyleGCashElement.addEventListener('click', function() {
        openPopup('Kyle GCash', kyleGCashElement.querySelector('p'));
    });

    yongGCashElement.addEventListener('click', function() {
        openPopup('Yong GCash', yongGCashElement.querySelector('p'));
    });

    function openPopup(title, targetElement) {
        const popup = document.createElement('div');
        popup.classList.add('gcash-popup');

        popup.innerHTML = `
            <div class="popup-content" id="gcash-popup">
                <h2>${title}</h2>
                <label for="valueInput" id="gcash-input">Enter new value:</label>
                <input type="number" id="valueInput" placeholder="₱ 0.00">
                <div class="button-container">
                    <button id="confirmButton">Confirm</button>
                    <button id="cancelButton">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        const confirmButton = popup.querySelector('#confirmButton');
        const cancelButton = popup.querySelector('#cancelButton');

        confirmButton.addEventListener('click', function() {
            const value = parseFloat(document.getElementById('valueInput').value);
            if (!isNaN(value)) {
                targetElement.textContent = formatAsPeso(value);
                closeSourcePopup();
            } else {
                alert('Please enter a valid number.');
            }
        });

        cancelButton.addEventListener('click', closeSourcePopup);

        popup.style.display = 'block';
    }

    function closeSourcePopup() {
        const popup = document.querySelector('.gcash-popup');
        if (popup) {
            document.body.removeChild(popup);
        }
    }
});

document.getElementById('type').addEventListener('change', function() {
    var qtyInput = document.getElementById('qty');
    var qtyLabel = document.getElementById('qtyLabel');
    var valueInput = document.getElementById('value');
    var valueLabel = document.getElementById('valueLabel');
    var amount = document.getElementById('amount');
    const statusDropdown = document.getElementById('status');

    if (this.value === 'Cryptocurrency') {
        qtyInput.style.display = 'block';
        qtyLabel.style.display = 'block';
        valueInput.style.display = 'none';
        valueLabel.style.display = 'none';
        amount.placeholder = 'Amount in USDT';
        statusDropdown.innerHTML = `
            <option value="" disabled selected>Select Status</option>
            <option value="Holding">Holding</option>
            <option value="Staking">Staking</option>
            <option value="Liquidity Pool">Liquidity Pool</option>
        `;

    } else {
        qtyInput.style.display = 'none';
        qtyLabel.style.display = 'none';
        valueInput.style.display = 'block';
        valueLabel.style.place = 'block';
        statusDropdown.innerHTML = `
            <option value="" disabled selected>Select Status</option>
            <option value="Holding">Holding</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Available">Available</option>
        `;
    }
});



export function attachEditListeners(row, rowDetails = null) {
    const cell = row.cells;
    let isHolding = false;
    let holdTimer = '';
    const optionsPopup = document.getElementById('optionsPopup');
    let popupContent = document.getElementById('optionText');
    console.log(`[BACKEND CHECK] Row details: ${rowDetails}`);

    
    

    row.addEventListener('mousedown', (event) => {
        if (isMobile()) {
            isHolding = true;

            if (optionsPopup.style.display === 'none') {
            optionsPopup.style.display = 'flex'; }

            holdTimer = setTimeout(() => {
                if (isHolding) {
                    if (rowDetails) {
                        popupContent.textContent = rowDetails;
                    }

                    if (navigator.vibrate) {
                        navigator.vibrate(200);
                    }
                }
            }, 1500); 
        }
    });

    // Cancel the hold event if the user lifts the finger/mouse before 1.5 seconds
    row.addEventListener('mouseup', () => {
        isHolding = false;
        clearTimeout(holdTimer);
    });

    row.addEventListener('mouseleave', () => {
        isHolding = false;
        clearTimeout(holdTimer);
    });

    row.addEventListener('touchstart', (event) => {
        isHolding = true;

        // Start the hold timer for touch devices
        holdTimer = setTimeout(() => {
            if (isHolding && isMobile()) {
                // Show the popup after 1.5 seconds
                console.log("HOLDING me softly!");

                if (optionsPopup.style.display == 'none'){
                optionsPopup.style.display = 'flex'; }

                if (rowDetails) {
                    popupContent.textContent = rowDetails;
                }

                // Vibrate the device
                if (navigator.vibrate) {
                    navigator.vibrate(200); // Vibrate for 200 milliseconds
                }
            }
        }, 1500); // 1.5 seconds
    });

    // Cancel the hold event on touchend
    row.addEventListener('touchend', () => {
        isHolding = false;
        clearTimeout(holdTimer);
    });

    // Close popup if the user clicks outside
    window.addEventListener('click', (e) => {
        const popup = document.getElementById('actionPopup');
        if (popup && e.target === popup) {
            hidePopup();
        }
    });


    Array.from(row.cells).forEach(cell => {
        cell.addEventListener('input', () => {
            updateHoldings();
        });
    });

    /*
    let clicks = 0;
    let timeoutId;

    Array.from(row.cells).forEach(cell => {
        
        cell.addEventListener('click', (event) => {
        clicks++;
        clearTimeout(timeoutId);
            if (clicks === 3) {
                const assetName = row.cells[0].textContent.trim();
                window.openTradeToHistoryPopup(assetName);
            } else if (clicks === 4) {
                optionsPopup.style.display = 'flex'; 
                clicks = 0;
            }
        });
    });
    */
}

closeDeletePopup.onclick = function() {
    deletePopup.style.display = 'none';
}

function formatAsPeso(value) {
    return `₱ ${parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateForHistory(dateString) {
    const date = new Date(dateString);
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
}

document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date-input');
    const todayCheckbox = document.getElementById('todayCheckbox');

    // Function to toggle checkbox state
    function toggleCheckboxState() {
        if (todayCheckbox.checked) {
            dateInput.disabled = true;
            dateInput.value = new Date().toISOString().split('T')[0];
            dateInput.style.color = '#ccc';
        } else {
            dateInput.disabled = false;
            dateInput.style.color = '';
        }
    }

    // Add event listener to the checkbox
    todayCheckbox.addEventListener('change', toggleCheckboxState);

    // Initial state
    toggleCheckboxState();
});

function getRandomValue(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate() {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomNumber(min, max, decimalPlaces = 2) {
    const randomValue = Math.random() * (max - min) + min;
    return parseFloat(randomValue.toFixed(decimalPlaces));
}

function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}


document.getElementById('test-submit').addEventListener('click', function() {
    const assetNames = ['ETH', 'SOL', 'TON'];
    const types = ['Cryptocurrency'];
    const statuses = ['Holding', 'Available'];
    const sources = ['GCash Kyle', 'GCash Yong', 'Cryptocurrency'];

    // Generate random values
    const randomAsset = getRandomValue(assetNames);
    const randomType = getRandomValue(types);
    const randomStatus = getRandomValue(statuses);
    const randomDate = formatDate(getRandomDate());
    const randomQty = getRandomNumber(1, 100);  // Example quantity between 1 and 100
    const randomAmount = getRandomNumber(100, 10000); // Example amount between 100 and 10000
    const randomSource = getRandomValue(sources);

    // Fill in the form with the random values
    investmentForm.name.value = randomAsset;
    investmentForm.type.value = randomType;
    investmentForm.status.value = randomStatus;
    investmentForm.date.value = randomDate;
    investmentForm.qty.value = randomQty;
    investmentForm.amount.value = randomAmount;
    investmentForm.source.value = randomSource;

    // Submit the form
    investmentForm.dispatchEvent(new Event('submit'));
});
