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

// --- RUTA DE VENTAS (Versión Relacional Definitiva) ---
app.post('/guardar-venta', async (req, res) => {
    const venta = req.body;
    console.log("¡Nueva venta recibida desde el HTML!", venta);
    
    // 1. Generamos un ID único para esta venta usando la fecha/hora
    const saleId = Date.now(); 

    // 2. Guardamos la "Cabecera" en la tabla 'sales'
    const { error: errorVenta } = await supabase
        .from('sales')
        .insert([
            { 
                id: saleId,
                client_id: venta.cliente_id, // ¡Ahora recibimos el ID, no el nombre!
                total: venta.total, 
                payment_method: venta.metodoPago,
                sale_type: venta.tipo,
                notes: venta.nota,
                pickup_info: venta.infoRetiro,
                picked_up: venta.entregado
            }
        ]);

    if (errorVenta) {
        console.error("Error guardando cabecera de venta:", errorVenta);
        return res.status(500).json({ error: "Fallo al guardar la venta" });
    }

    // 3. Guardamos el "Detalle" en la tabla 'sale_items'
    if (venta.items && venta.items.length > 0) {
        // Armamos la listita para Supabase
        const saleItems = venta.items.map(item => ({
            sale_id: saleId,
            product_id: item.id, // Necesitamos el ID del producto
            quantity: item.qty,
            unit_price: item.price,
            subtotal: item.qty * item.price
        }));

        const { error: errorItems } = await supabase
            .from('sale_items')
            .insert(saleItems);

        if (errorItems) console.error("Error guardando ítems:", errorItems);
    }

    console.log("¡Venta y detalles guardados en Supabase con éxito!");
    res.json({ mensaje: "Ticket completo guardado en BD", status: "ok" });
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

