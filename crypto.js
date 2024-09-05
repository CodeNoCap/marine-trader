export async function fetchCryptoPrice(asset, timestamp = null) {
    const url = `https://marine-trader.onrender.com/api/${asset}?timestamp${timestamp || Date.now()}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.data[asset].quote.PHP.price;
    } catch (error) {
        console.error("Error fetching cryptocurrency data: ", error);
        return null;
    }
}


export async function updateCryptocurrencyValues(table, hiddenStorage) {
    for (const asset in hiddenStorage) {
        assetInfo = hiddenStorage.get(asset);
        type = assetInfo.type;
        qty = assetInfo.qty;

        if (type === 'Cryptocurrency') {
            if (qty) {
                const tokenPrice = await fetchCryptoPrice(asset); // Function to fetch price from API
                const currentValue = tokenPrice * qty;

                // Find the corresponding row and update the value
                const row = findRowByAsset(table, asset);
                if (row) {
                    row.cells[2].textContent = formatAsPeso(currentValue.toFixed(2));
                }
            }
        }
    }
    

}

function findRowByAsset(table, asset) {
    return Array.from(table.rows).find(row => row.cells[0].textContent === asset);
}

function formatAsPeso(value) {
    return `₱ ${parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
