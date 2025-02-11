const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// OAuth Redirect Endpoint
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ message: "Kein Authorization-Code erhalten!" });
    }

    try {
        const response = await axios.post("https://api.clickup.com/api/v2/oauth/token", {
            client_id: process.env.CLICKUP_CLIENT_ID,
            client_secret: process.env.CLICKUP_CLIENT_SECRET,
            code: code
        });

        const accessToken = response.data.access_token;
        console.log("✅ OAuth-Token erhalten:", accessToken);

        // Speichere den Token (zum Beispiel in der Datenbank oder `.env`)
        res.json({ message: "OAuth-Token erfolgreich gespeichert!", token: accessToken });

    } catch (error) {
        console.error("❌ Fehler beim Abrufen des OAuth-Tokens:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Fehler beim Abrufen des Tokens" });
    }
});

module.exports = router;