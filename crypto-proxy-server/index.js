const express = require('express');
const request = require('request');
const app = express();

const API_KEY = process.env.COINMARKETCAP_API_KEY; // Store your API key in Heroku environment variables

app.get('/api/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=PHP`;

    request({ url, headers: { 'X-CMC_PRO_API_KEY': API_KEY } }, (error, response, body) => {
        if (error) {
            return res.status(500).send('Error fetching data.');
        }
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS
        res.send(body);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
