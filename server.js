const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
    res.send('¡El servidor está online y sincronizando edición y borrado!');
});

// 1. RUTA: GUARDAR VENTA NUEVA
app.post('/guardar-venta', async (req, res) => {
    const venta = req.body;
    const saleId = Date.now(); 

    const { error: errorVenta } = await supabase.from('sales').insert([{ 
        id: saleId,
        client_id: venta.cliente_id,
        total: venta.total, 
        payment_method: venta.metodoPago,
        sale_type: venta.tipo,
        notes: venta.nota,
        pickup_info: venta.infoRetiro,
        picked_up: venta.entregado
    }]);

    if (errorVenta) return res.status(500).json({ error: "Fallo al guardar" });

    if (venta.items && venta.items.length > 0) {
        const saleItems = venta.items.map(item => ({
            sale_id: saleId,
            product_id: item.id,
            quantity: item.qty,
            unit_price: item.price,
            subtotal: item.qty * item.price
        }));
        await supabase.from('sale_items').insert(saleItems);
    }
    res.json({ status: "ok" });
});

// 2. RUTA: BORRAR VENTA
app.delete('/borrar-venta/:id', async (req, res) => {
    const saleId = req.params.id;
    console.log(`Borrando venta ID: ${saleId}`);
    
    // Supabase borra los ítems en cascada automáticamente
    const { error } = await supabase.from('sales').delete().eq('id', saleId);
    
    if (error) return res.status(500).json({ error: "Fallo al borrar" });
    res.json({ status: "ok" });
});

// 3. RUTA: ACTUALIZAR VENTA
app.put('/actualizar-venta/:id', async (req, res) => {
    const saleId = req.params.id;
    const venta = req.body;
    console.log(`Actualizando venta ID: ${saleId}`);

    // A. Actualizamos la cabecera
    const { error: errCab } = await supabase.from('sales').update({
        client_id: venta.cliente_id,
        total: venta.total,
        payment_method: venta.metodoPago,
        sale_type: venta.tipo,
        notes: venta.nota,
        pickup_info: venta.infoRetiro,
        picked_up: venta.entregado
    }).eq('id', saleId);

    if (errCab) return res.status(500).json({ error: "Fallo al actualizar cabecera" });

    // B. Si mandan ítems (edición completa), reemplazamos los viejos
    if (venta.items) {
        await supabase.from('sale_items').delete().eq('sale_id', saleId); 
        
        if (venta.items.length > 0) {
            const saleItems = venta.items.map(item => ({
                sale_id: saleId,
                product_id: item.id,
                quantity: item.qty,
                unit_price: item.price,
                subtotal: item.qty * item.price
            }));
            await supabase.from('sale_items').insert(saleItems);
        }
    }
    res.json({ status: "ok" });
});

// --- RUTAS DE MIGRACIÓN ---
app.post('/migrar-cliente', async (req, res) => {
    const c = req.body;
    await supabase.from('clients').insert([{ id: c.id, name: c.name, phone: c.phone || '' }]);
    res.json({ status: "ok" });
});

app.post('/migrar-producto', async (req, res) => {
    const p = req.body;
    await supabase.from('products').insert([{ id: p.id, name: p.name, price: p.price, active: true }]);
    res.json({ status: "ok" });
});

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
