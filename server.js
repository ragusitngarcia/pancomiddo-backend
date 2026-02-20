const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que tu HTML de Netlify se comunique con este servidor sin bloqueos de seguridad
app.use(cors());
app.use(express.json());

// Una ruta de prueba para saber si el servidor está vivo
app.get('/', (req, res) => {
    res.send('¡El servidor de Pancomiddo está online y funcionando!');
});

// Acá es donde en el futuro recibiremos las ventas desde tu HTML
app.post('/guardar-venta', (req, res) => {
    const venta = req.body;
    console.log("¡Nueva venta recibida!", venta);
    
    // Por ahora solo respondemos que llegó bien
    res.json({ mensaje: "Venta procesada correctamente", status: "ok" });
});

// Encendemos el motor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});