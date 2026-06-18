<script>
    import { page } from '$app/state';

    let regionName = page.params.region;
    let dateN = page.params.date;

    import { dev } from '$app/environment';
    import { onMount } from 'svelte';
    import { Button } from '@sveltestrap/sveltestrap';
    import { goto } from '$app/navigation';

    let API = '/api/v1/online-sales-popular-marketplaces';
    if (dev){
        API = '' + API;
    }

    // @ts-ignore
    let sale = $state({});
    let resultStatusCode = $state(0);
    let informationText = $state("");

    let newRegion = $state("newRegion");
    let newDate = $state("newDate");
    let newCategory = $state("newCategory");
    let newProduct = $state("newProduct");
    let newQuantity = $state(0);
    let newPrice = $state(0);
    let newTotal = $state(0);
    let newPaymentMethod = $state("newPaymentMethod");

    async function getSale(){
        const res = await fetch(API + "/" + regionName + "/" + dateN, {
            method: "GET"
        });

        if (res.status === 404) {
            sessionStorage.setItem('mensajeError', `No existe el registro de ${regionName} en ${dateN}, créalo.`);
            goto('/MRR'); 
            return;
        }

        if (res.status === 200) {
            const sale = await res.json();
            newRegion = sale.region;
            newDate = sale.date;
            newCategory = sale.product_category;
            newProduct = sale.product_name;
            newQuantity = sale.quantity_sold;
            newPrice = sale.unit_price;
            newTotal = sale.total;
            newPaymentMethod = sale.payment_method;
        }
    }

    async function updateSale(){
        informationText = "";
        let updatedSale = {
            region: newRegion,
            date: newDate,
            product_category: newCategory,
            product_name: newProduct,
            quantity_sold: newQuantity,
            unit_price: newPrice,
            total: newTotal,
            payment_method: newPaymentMethod
        };
        const res = await fetch(API  + "/" + regionName + "/" + dateN, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedSale)
        });
        resultStatusCode = await res.status;
        if (resultStatusCode == 200){
            getSale();
            informationText = "¡Dato actualizado con éxito!";
        } else if (resultStatusCode == 400){
            const data = await res.json();
            if (data.message.includes("falte algún elemento")) {
                informationText = "No puedes dejar campos vacíos en el formulario.";
            } else if (data.message.includes("No coincide")) {
                informationText = "La región o fecha del formulario no coinciden con el recurso que intentas editar.";
            } else {
                informationText = "Error 400: Petición incorrecta.";
            }      
        } else {
            informationText = `Error inesperado`;
        }
    }

    onMount(() => {
        getSale();
    });
</script>

<svelte:head>
    <title>Online Sale update</title>
    <meta name="description" content="Actualización de la venta online en el proyecto SOS2526-23"/>
</svelte:head> 

<div class="sales-dashboard">
    <div class="dashboard-header">
        <div>
            <h1>Sale Details</h1>
            <h3 class="subtitle">{regionName} &rarr; {dateN}</h3>
        </div>
        
        <div class="header-actions">
            <Button href="/MRR" color="secondary" outline>
                &larr; Volver a la lista
            </Button>
        </div>
    </div>

    {#if informationText != ""}
        <div class="info-panel">
            <div class="info-message">
                <strong>Información:</strong> {informationText}
            </div>
        </div>
    {/if}

    <div class="table-container">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Región</th>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Total</th>
                    <th>Método de pago</th>
                    <th class="text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr class="input-row">
                    <td><input type="text" bind:value={newRegion}></td>
                    <td><input type="text" bind:value={newDate}></td>
                    <td><input type="text" bind:value={newCategory}></td>
                    <td><input type="text" bind:value={newProduct}></td>
                    <td><input type="number" bind:value={newQuantity}></td>
                    <td><input type="number" bind:value={newPrice}></td>
                    <td><input type="number" bind:value={newTotal}></td>
                    <td><input type="text" bind:value={newPaymentMethod}></td>
                    <td class="text-center">
                        <Button color="primary" onclick={updateSale}>Actualizar</Button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<style>
    .sales-dashboard {
        max-width: 1400px;
        margin: 2rem auto;
        padding: 0 1.5rem;
        font-family: '-apple-system', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #334155;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e2e8f0;
    }

    h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        background: linear-gradient(to right, #0284c7, #6366f1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .subtitle {
        color: #64748b;
        margin: 0.35rem 0 0 0;
        font-size: 1.05rem;
        font-weight: 500;
    }

    .info-panel {
        background-color: #eff6ff;
        border-left: 4px solid #3b82f6;
        border-radius: 8px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
    }
    
    .info-message {
        font-size: 0.95rem;
        color: #1e3a8a;
    }

    .table-container {
        overflow-x: auto;
        background: white;
        border-radius: 12px;
        padding: 0;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;
        font-size: 0.9rem;
    }

    .data-table thead {
        background-color: #f1f5f9;
        border-bottom: 2px solid #e2e8f0;
    }

    .data-table th {
        padding: 1rem 0.75rem;
        text-align: left;
        color: #475569;
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .data-table td {
        padding: 0.85rem 0.75rem;
        vertical-align: middle;
        border-bottom: 1px solid #f1f5f9;
    }

    .input-row {
        background-color: #f8fafc;
    }

    .input-row input {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.9rem;
        color: #334155;
        background-color: #ffffff;
        box-sizing: border-box;
        transition: all 0.15s ease;
    }

    .input-row input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .text-center {
        text-align: center !important;
    }

    :global(.btn) {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: inherit !important;
        padding: 0.55rem 1.2rem !important;
        font-size: 0.9rem !important;
        font-weight: 600 !important;
        border-radius: 8px !important;
        border: 1px solid transparent !important;
        cursor: pointer !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        user-select: none !important;
    }

    :global(.btn-primary) {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
        border-color: #3b82f6 !important;
        color: #ffffff !important;
        box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.15) !important;
    }
    :global(.btn-primary:hover) {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 12px -2px rgba(37, 99, 235, 0.25) !important;
        filter: brightness(1.05);
    }

    :global(.btn-outline-secondary) {
        color: #475569 !important;
        border-color: #cbd5e1 !important;
        background-color: transparent !important;
    }
    :global(.btn-outline-secondary:hover) {
        background-color: #f1f5f9 !important;
        color: #1e293b !important;
        border-color: #94a3b8 !important;
    }
</style>