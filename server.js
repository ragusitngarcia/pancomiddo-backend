const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Ampliamos el límite por si tu lista de clientes es muy larga
app.use(express.json({ limit: '10mb' }));

// Conectamos a Supabase usando las llaves ocultas de Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
    res.send('¡El servidor está online y tiene las llaves de Supabase!');
});

// --- RUTA DE VENTAS (Ajustada temporalmente para la nueva BD) ---
app.post('/guardar-venta', async (req, res) => {
    const venta = req.body;
    console.log("¡Nueva venta recibida desde el HTML!", venta);
    
    // ATENCIÓN: Ajustamos esto para que coincida con tu nueva estructura BIGINT.
    // Todavía no estamos guardando el cliente ni los ítems exactos (lo haremos
    // en el próximo paso una vez que tus productos y clientes ya estén en la nube).
    const { data, error } = await supabase
        .from('sales')
        .insert([
            { 
                id: Date.now(),
                total: venta.total, 
                payment_method: venta.metodoPago,
                sale_type: venta.tipo,
                notes: venta.nota,
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

// --- NUEVAS RUTAS PARA LA MIGRACIÓN INICIAL ---
app.post('/migrar-cliente', async (req, res) => {
    const cliente = req.body;
    const { error } = await supabase.from('clients').insert([{
        id: cliente.id,
        name: cliente.name,
        phone: cliente.phone || ''
    }]);
    
    if (error) console.error("Error guardando cliente:", error);
    res.json({ status: "ok" });
});

app.post('/migrar-producto', async (req, res) => {
    const producto = req.body;
    const { error } = await supabase.from('products').insert([{
        id: producto.id,
        name: producto.name,
        price: producto.price,
        active: true
    }]);
    
    if (error) console.error("Error guardando producto:", error);
    res.json({ status: "ok" });
});
// ----------------------------------------------

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
