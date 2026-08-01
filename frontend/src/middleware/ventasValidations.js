export const paymentReferenceLabels = {
    tarjeta: 'Nro. voucher',
    transferencia: 'Nro. de transferencia',
    cheque: 'Nro. de cheque',
};

export function validateAddItem({ selectedProduct, quantity }) {
    if (!selectedProduct) {
        return 'Selecciona un producto antes de agregarlo.';
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
        return 'La cantidad debe ser mayor que cero.';
    }

    return null;
}

export function validateGenerateReceipt({ cartItems, customer, paymentMethod, selectedClient, paymentReference }) {
    const trimmedNit = customer.nit.trim() || 'CF';
    const trimmedName = customer.nombre.trim();
    const trimmedAddress = customer.domicilio.trim();

    if (cartItems.length === 0) {
        return { isValid: false, message: 'Agrega al menos un producto para generar el recibo.' };
    }

    if (!trimmedName) {
        return { isValid: false, message: 'El nombre del cliente es obligatorio.' };
    }

    if (paymentMethod === 'credito' && !selectedClient) {
        return {
            isValid: false,
            message: 'Para pagar por cobrar debes seleccionar un cliente existente del catálogo.',
        };
    }

    if ((paymentMethod === 'tarjeta' || paymentMethod === 'transferencia' || paymentMethod === 'cheque') && !paymentReference.trim()) {
        return {
            isValid: false,
            message: `Debes ingresar el ${paymentReferenceLabels[paymentMethod].toLowerCase()}.`,
        };
    }

    return {
        isValid: true,
        customer: {
            nit: trimmedNit,
            nombre: trimmedName,
            domicilio: trimmedAddress,
            telefono: customer.telefono.trim(),
        },
    };
}

export function buildReceiptPreview({ customer, paymentMethod, paymentReference, total, cartItems, sellerName, selectedClient, selectedBranch }) {
    return {
        numeroRecibo: '',
        numeroFactura: 'PENDIENTE',
        fecha: new Date().toLocaleString('es-GT'),
        idCliente: selectedClient?.idCliente ?? customer.idCliente ?? null,
        idSucursal: selectedBranch?.idSucursal ?? customer.idSucursal ?? null,
        sucursalNombre: selectedBranch?.nombreSuc ?? customer.sucursalNombre ?? '',
        cliente: customer,
        telefono: customer.telefono,
        metodoPago: paymentMethod,
        referencia: paymentReference.trim(),
        total,
        items: cartItems,
        vendedor: sellerName,
    };
}

export function buildReceiptPdfPayload({ receipt }) {
    return {
        idCliente: receipt.idCliente ?? null,
        idSucursal: receipt.idSucursal ?? null,
        sucursalNombre: receipt.sucursalNombre ?? '',
        numeroRecibo: receipt.numeroRecibo,
        numeroFactura: receipt.numeroFactura,
        fechaPago: new Date().toISOString(),
        fechaVenta: new Date().toISOString(),
        clienteNombre: receipt.cliente.nombre,
        clienteNit: receipt.cliente.nit,
        clienteDomicilio: receipt.cliente.domicilio,
        clienteTelefono: receipt.cliente.telefono,
        vendedorNombre: receipt.vendedor,
        metodoPago: receipt.metodoPago,
        referenciaPago: receipt.referencia,
        total: receipt.total,
        detalles: receipt.items.map((item) => ({
            idProducto: item.idProducto,
            productoNombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
        })),
    };
}
