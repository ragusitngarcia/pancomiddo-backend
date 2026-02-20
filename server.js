const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Conectamos a Supabase usando las llaves ocultas de Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
    res.send('¡El servidor está online y tiene las llaves de Supabase!');
});

app.post('/guardar-venta', async (req, res) => {
    const venta = req.body;
    console.log("¡Nueva venta recibida desde el HTML!", venta);
    
// Guardamos en la tabla 'sales' de Supabase
    const { data, error } = await supabase
        .from('sales')
        .insert([
            { 
                client: venta.cliente, 
                total: venta.total, 
                payment_method: venta.metodoPago,
                type: venta.tipo,
                details: venta.detalles,
                items: venta.items,
                note: venta.nota,
                pickup_info: venta.infoRetiro,
                picked_up: venta.entregado
            }
        ]);
    
    if (error) {
        console.error("Error guardando en la caja fuerte:", error);
        return res.status(500).json({ error: "Fallo al guardar en BD" });
    }

    console.log("¡Venta guardada en Supabase con éxito!");
    res.json({ mensaje: "Guardado 100% exitoso en BD", status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

