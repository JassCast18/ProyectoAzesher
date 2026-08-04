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

    if (Number.isFinite(Number(selectedProduct.stock)) && Number(quantity) > Number(selectedProduct.stock)) {
        return `Solo hay ${selectedProduct.stock} unidades disponibles en esta sucursal.`;
    }

    return null;
}

export function validateGenerateReceipt({ cartItems, customer, paymentMethod, paymentDetails, selectedSeller }) {
    const trimmedNit = customer.nit.trim() || 'CF';
    const trimmedName = customer.nombre.trim();
    const trimmedAddress = customer.domicilio.trim();

    if (cartItems.length === 0) {
        return { isValid: false, message: 'Agrega al menos un producto para generar el recibo.' };
    }

    if (!selectedSeller?.idVendedor) {
        return { isValid: false, message: 'Selecciona un vendedor.' };
    }

    const branchIds = [...new Set(cartItems.map((item) => item.idSucursal).filter(Boolean).map(String))];
    if (branchIds.length > 1) {
        return { isValid: false, message: 'Todos los productos del recibo deben pertenecer a la misma sucursal.' };
    }

    if (!trimmedName) {
        return { isValid: false, message: 'El nombre del cliente es obligatorio.' };
    }

    if (paymentMethod === 'efectivo' && !paymentDetails.currencyId) {
        return { isValid: false, message: 'Selecciona la moneda del pago en efectivo.' };
    }

    if (paymentMethod === 'tarjeta' && (!paymentDetails.posId || !paymentDetails.reference.trim())) {
        return { isValid: false, message: 'Selecciona el POS e ingresa el número de voucher.' };
    }

    if (paymentMethod === 'transferencia' && (!paymentDetails.reference.trim() || !paymentDetails.transferDate)) {
        return { isValid: false, message: 'Ingresa el número y la fecha de transferencia.' };
    }

    const credit = paymentDetails.credit;
    if (paymentMethod === 'credito' && !credit.customer) {
        return {
            isValid: false,
            message: 'Selecciona un cliente autorizado para cuentas por cobrar.',
        };
    }
    if (paymentMethod === 'credito') {
        const pending = Number(paymentDetails.total ?? 0) || credit.schedule.reduce((sum, row) => sum + Number(row.amount), 0);
        if (!credit.installments || credit.schedule.length !== Number(credit.installments)) {
            return { isValid: false, message: 'Completa el número de cuotas y su calendario.' };
        }
        if (credit.schedule.some((row) => !row.date)) {
            return { isValid: false, message: 'Cada cuota debe tener una fecha.' };
        }
        if (pending > Number(credit.customer.disponible)) {
            return { isValid: false, message: 'El saldo pendiente supera el crédito disponible del cliente.' };
        }
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

export function buildReceiptPreview({ customer, paymentMethod, paymentDetails, total, cartItems, selectedSeller, selectedClient, selectedBranch }) {
    const saleBranchId = selectedBranch?.idSucursal ?? cartItems[0]?.idSucursal ?? null;
    const saleBranchName = selectedBranch?.nombreSuc ?? cartItems[0]?.nombreSucursal ?? '';
    return {
        numeroRecibo: '',
        numeroFactura: 'PENDIENTE',
        fecha: new Date().toLocaleString('es-GT'),
        idCliente: paymentMethod === 'credito' ? paymentDetails.credit.customer?.idCliente : selectedClient?.idCliente ?? customer.idCliente ?? null,
        idSucursal: saleBranchId,
        sucursalNombre: saleBranchName,
        cliente: customer,
        telefono: customer.telefono,
        metodoPago: paymentMethod,
        referencia: paymentDetails.reference.trim(),
        paymentDetails,
        total,
        items: cartItems,
        idVendedor: selectedSeller.idVendedor,
        vendedor: selectedSeller.nombre,
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
        idVendedor: receipt.idVendedor,
        vendedorNombre: receipt.vendedor,
        metodoPago: receipt.metodoPago,
        referenciaPago: receipt.referencia,
        idMoneda: receipt.paymentDetails.currencyId,
        monedaNombre: receipt.paymentDetails.currencyCode,
        idTipoPos: receipt.paymentDetails.posId,
        tipoPosNombre: receipt.paymentDetails.posName,
        fechaTransferencia: receipt.paymentDetails.transferDate || null,
        comprobanteBase64: receipt.paymentDetails.transferBase64,
        comprobanteMime: receipt.paymentDetails.transferMime,
        numeroCuotas: receipt.paymentDetails.credit.installments,
        montoInicial: receipt.paymentDetails.credit.hasInitialPayment ? Number(receipt.paymentDetails.credit.initialAmount || 0) : 0,
        cuotas: receipt.paymentDetails.credit.schedule.map((row) => ({
            numeroCuota: row.number,
            fechaVencimiento: row.date,
            monto: row.amount,
        })),
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
