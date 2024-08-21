const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get('/crypto-price', async (req, res) => {
    const { symbol } = req.query;
    const apiKey = '2680c8e8-dd06-4c5b-8751-57824a0c8a88'; // Your CoinMarketCap API key

    try {
        const response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=PHP`, {
            headers: {
                'X-CMC_PRO_API_KEY': apiKey
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from CoinMarketCap API' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
