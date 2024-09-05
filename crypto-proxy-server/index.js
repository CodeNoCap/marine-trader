const express = require('express');
const request = require('request');
const app = express();

const API_KEY = process.env.COINMARKETCAP_API_KEY; // Ensure this is set correctly

app.get('/api/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    const timestamp = req.query.timestamp || Date.now();
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&timestamp=${timestamp}convert=PHP`;

    console.log(`Fetching data for symbol: ${symbol} with URL: ${url}`);

    request({ url, headers: { 'X-CMC_PRO_API_KEY': API_KEY } }, (error, response, body) => {
        if (error) {
            console.error("Error fetching data from CoinMarketCap:", error);
            return res.status(500).send('Error fetching data.');
        }

        console.log("Received response from CoinMarketCap:", body);
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS
        res.send(body);
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
