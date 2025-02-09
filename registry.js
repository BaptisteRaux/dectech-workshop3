const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/getServer', (req, res) => {
    res.json({
        code: 200,
        server: "localhost:3001"
    });
});

app.listen(PORT, () => {
    console.log(`📋 Registre DNS démarré sur http://localhost:${PORT}`);
});