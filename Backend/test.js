const express = require('express');
const app = express();

app.get('/api/test', (req, res) => {
    res.json({ mensaje: 'Funciona!' });
});

app.listen(3000, () => {
    console.log('Test servidor en puerto 3000');
});