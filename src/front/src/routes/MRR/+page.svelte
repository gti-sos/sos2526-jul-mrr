<script>
    import { dev } from '$app/environment';
    import { onMount } from 'svelte';
    import { Button } from '@sveltestrap/sveltestrap';
    import { SvelteURLSearchParams } from 'svelte/reactivity';

    let API = '/api/v1/online-sales-popular-marketplaces';
    if (dev){
        API = '' + API;
    }

    // @ts-ignore
    let sales = $state([]);
    let resultStatusCode = $state(0);
    let informationText = $state("");

    let newRegion = $state("");
    let newDate = $state("");
    let newCategory = $state("");
    let newProduct = $state("");
    let newQuantity = $state(0);
    let newPrice = $state(0);
    let newTotal = $state(0);
    let newPaymentMethod = $state("");

    let searchRegion = $state("");
    let searchDateFrom = $state("");
    let searchDateTo = $state("");
    let searchCategory = $state("");
    let searchProduct = $state("");
    let searchMinQuantity = $state("");
    let searchMaxQuantity = $state("");
    let searchMinPrice = $state("");
    let searchMaxPrice = $state("");
    let searchMinTotal = $state("");
    let searchMaxTotal = $state("");
    let searchPayment = $state("");
    let searchLimit = $state("");
    let searchOffset = $state("");

    async function loadInitialData() {
        await deleteAll();
        informationText = "";
        const res = await fetch(API + "/loadInitialData", {
            method: "GET"
        });
        resultStatusCode = await res.status;
        if (resultStatusCode == 200){
            await getSales();
            informationText = "¡Datos cargados con éxito!"
        } else if (resultStatusCode == 409){
            informationText = "¡Ya existen datos!";
        } else {
            informationText = `Error inesperado`;
        }
    }

    async function getSales(esBusqueda = false){
        let queryParams = new SvelteURLSearchParams();
        if (searchRegion) queryParams.append("region", searchRegion);
        if (searchDateFrom) queryParams.append("from", searchDateFrom);
        if (searchDateTo) queryParams.append("to", searchDateTo);
        if (searchCategory) queryParams.append("product_category", searchCategory);
        if (searchProduct) queryParams.append("product_name", searchProduct);
        if (searchMinQuantity) queryParams.append("min_quantity_sold", searchMinQuantity);
        if (searchMaxQuantity) queryParams.append("max_quantity_sold", searchMaxQuantity);
        if (searchMinPrice) queryParams.append("min_unit_price", searchMinPrice);
        if (searchMaxPrice) queryParams.append("max_unit_price", searchMaxPrice);
        if (searchMinTotal) queryParams.append("min_total", searchMinTotal);
        if (searchMaxTotal) queryParams.append("max_total", searchMaxTotal);
        if (searchPayment) queryParams.append("payment_method", searchPayment);
        if (searchLimit) queryParams.append("limit", searchLimit);
        if (searchOffset) queryParams.append("offset", searchOffset);

        const queryString = queryParams.toString();
        const url = API + (queryString ? `?${queryString}` : "");

        const res = await fetch(url, { method: "GET" });
        if (res.ok) {
            sales = await res.json();
            if (esBusqueda) {
                informationText = `Búsqueda completada. Se encontraron ${sales.length} resultados.`;
            }
        } else {
            informationText = "Error al realizar la búsqueda.";
        }
    }

    async function deleteAll(){
        informationText = "";
        const res = await fetch(API, {
            method: "DELETE"
        });
        resultStatusCode = await res.status;
        if (resultStatusCode == 200){
            await getSales();
            informationText = "Datos eliminados.";
        }
    }

    async function insertSale(){
        informationText = "";
        let missingFields = [];

        if (!newRegion) missingFields.push("Región"); 
        if (!newDate) missingFields.push("Fecha"); 
        if (!newCategory) missingFields.push("Categoría"); 
        if (!newProduct) missingFields.push("Producto");
        if (newQuantity <= 0) missingFields.push("Cantidad"); 
        if (newPrice <= 0) missingFields.push("Precio"); 
        if (newTotal <= 0) missingFields.push("Total"); 
        if (!newPaymentMethod) missingFields.push("Método de pago");

        let newSale = {
            region: newRegion,
            date: newDate,
            product_category: newCategory,
            product_name: newProduct,
            quantity_sold: newQuantity,
            unit_price: newPrice,
            total: newTotal,
            payment_method: newPaymentMethod
        };

        const res = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newSale)
        });
        resultStatusCode = await res.status;
        if (resultStatusCode == 201){
            getSales();
            informationText = `Dato creado con ${newRegion} y ${newDate}.`;
        } else if (resultStatusCode == 409){
            informationText = "Ya existe un dato con esa misma región y fecha al que se quiere añadir.";
        } else if (resultStatusCode == 400){
            informationText = `Faltan los siguientes campos por rellenar: ${missingFields.join(", ")}.`;
        } else {
            informationText = `Error inesperado`;
        }
    }

    // @ts-ignore
    async function deleteSale(regionName, dateN){
        informationText = "";
        const res = await fetch(API + "/" + regionName + "/" + dateN, {
            method: "DELETE"
        });
        resultStatusCode = await res.status;
        if (resultStatusCode == 200){
            await getSales();
            informationText = `El dato con ${regionName} y ${dateN} como region y fecha, respectivamente, ha sido eliminado.`
        }
    }
   
    // @ts-ignore
    async function goToUpdate(regionName, dateN) {
        informationText = "";
        const res = await fetch(API + "/" + regionName + "/" + dateN, {
            method: "GET" 
        });
        resultStatusCode = await res.status;
        if (resultStatusCode == 200) {
            window.location.href = `MRR/${regionName}/${dateN}`;
        } else if (resultStatusCode === 404) {
            informationText = `Error: No se puede actualizar porque el registro de ${regionName} en ${dateN} no existe.`;
        } else {
            informationText = `Error inesperado al verificar el recurso`;
        }
    }

    function clearSearch() {
        searchRegion = "";
        searchDateFrom = ""; searchDateTo = "";
        searchCategory = ""; searchProduct = ""; searchMinQuantity = "";
        searchMaxQuantity = "";
        searchMinPrice = ""; searchMaxPrice = "";
        searchMinTotal = ""; searchMaxTotal = ""; searchPayment = "";
        searchLimit = "";
        searchOffset = "";
        getSales(); 
    }

    onMount(async () => {
        getSales(); 
        const mensajePendiente = sessionStorage.getItem('mensajeError');
        if (mensajePendiente) {
            informationText = mensajePendiente;
            sessionStorage.removeItem('mensajeError');
        }
    });
</script>

<svelte:head>
    <title>Online Sales List</title>
    <meta name="description" content="Ventas online en marcas populares en el proyecto SOS2526-23"/>
</svelte:head> 

<div class="sales-dashboard">
    <div class="dashboard-header">
        <h1>Online Sales</h1>
        <div class="main-actions">
            <Button color="primary" onclick={loadInitialData}>Cargar los datos originales</Button>
            <Button color="danger" onclick={deleteAll}>Eliminar todos los datos</Button>
        </div>
    </div>

    {#if informationText != ""}
        <div class="info-panel">
            <div class="info-message">
                <strong>Información:</strong> {informationText}
            </div>
        </div>
    {/if}

    <div class="search-panel">
        <h4>Filtros de Búsqueda</h4>
        <div class="search-grid">
            <input type="text" placeholder="Región" bind:value={searchRegion}>
            
            <div><small>Fecha Desde</small><input type="date" bind:value={searchDateFrom}></div>
            <div><small>Fecha Hasta</small><input type="date" bind:value={searchDateTo}></div>
            
            <input type="text" placeholder="Categoría" bind:value={searchCategory}>
            <input type="text" placeholder="Producto" bind:value={searchProduct}>
            <input type="number" placeholder="Cant. Mínima" bind:value={searchMinQuantity}>
            <input type="number" placeholder="Cant. Máxima" bind:value={searchMaxQuantity}>
            <input type="number" placeholder="Precio Mín." bind:value={searchMinPrice}>
            <input type="number" placeholder="Precio Máx." bind:value={searchMaxPrice}>
            <input type="number" placeholder="Total Mín." bind:value={searchMinTotal}>
            <input type="number" placeholder="Total Máx." bind:value={searchMaxTotal}>
            <input type="text" placeholder= "Método de Pago" bind:value={searchPayment}>
            <input type="number" placeholder="Límite (Paginación)" bind:value={searchLimit}>
            <input type="number" placeholder="Offset (Paginación)" bind:value={searchOffset}>
        </div>
        <div class="search-actions">
            <Button color="primary" onclick={() => getSales(true)}>Buscar</Button>
            <Button color="secondary" outline onclick={clearSearch}>Limpiar Filtros</Button>
        </div>
    </div>

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
                    <td><input type="text" bind:value={newRegion} placeholder="newRegion"></td>
                    <td><input type="text" bind:value={newDate} placeholder="newDate"></td>
                    <td><input type="text" bind:value={newCategory} placeholder="newCategory"></td>
                    <td><input type="text" bind:value={newProduct} placeholder="newProduct"></td>
                    <td><input type="number" bind:value={newQuantity}></td>
                    <td><input type="number" bind:value={newPrice}></td>
                    <td><input type="number" bind:value={newTotal}></td>
                    <td><input type="text" bind:value={newPaymentMethod} placeholder="newPaymentMethod"></td>
                    <td class="text-center">
                        <Button color="success" size="sm" onclick={insertSale}>Insertar</Button>
                    </td>
                </tr>

                {#each sales as sale (sale.region + sale.date)}
                    <tr class="data-row">
                        <td>{sale.region}</td>
                        <td>{sale.date}</td>
                        <td>{sale.product_category}</td>
                        <td>{sale.product_name}</td>
                        <td>{sale.quantity_sold}</td>
                        <td>${sale.unit_price}</td>
                        <td class="total-cell">${sale.total}</td>
                        <td>{sale.payment_method}</td>
                        <td class="action-buttons">
                            <Button color="danger" outline size="sm" onclick={() => deleteSale(sale.region, sale.date)}>Eliminar</Button>
                            <Button color="info" outline size="sm" onclick={() => goToUpdate(sale.region, sale.date)}>Actualizar</Button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    /* --- Contenedor Principal --- */
    .sales-dashboard {
        max-width: 1400px;
        margin: 2rem auto;
        padding: 0 1.5rem;
        font-family: '-apple-system', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #334155;
    }

    /* --- Cabecera --- */
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

    .main-actions {
        display: flex;
        gap: 0.75rem;
    }

    /* --- Paneles --- */
    .info-panel {
        background-color: #eff6ff;
        border-left: 4px solid #3b82f6;
        border-radius: 8px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.5rem;
    }
    
    .info-message {
        font-size: 0.95rem;
        color: #1e3a8a;
    }

    .search-panel, .table-container {
        background-color: #ffffff;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
    }

    .search-panel h4 {
        margin-top: 0;
        margin-bottom: 1.25rem;
        color: #0f172a;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .search-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.85rem;
        margin-bottom: 1.25rem;
        align-items: end;
    }

    .search-grid input, .input-row input {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.9rem;
        color: #334155;
        background-color: #f8fafc;
        box-sizing: border-box;
        transition: all 0.15s ease;
    }

    .search-grid input:focus, .input-row input:focus {
        outline: none;
        border-color: #3b82f6;
        background-color: #ffffff;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .search-grid small {
        display: block;
        color: #64748b;
        font-weight: 500;
        margin-bottom: 0.25rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .search-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }

    /* --- Tabla --- */
    .table-container {
        padding: 0;
        overflow-x: auto;
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
    }

    .data-table td {
        padding: 0.85rem 0.75rem;
        vertical-align: middle;
        border-bottom: 1px solid #f1f5f9;
    }

    .data-row:hover {
        background-color: #f8fafc;
    }

    .input-row {
        background-color: #f8fafc;
    }

    .input-row input {
        background-color: #ffffff;
    }

    .total-cell {
        font-weight: 700;
        color: #0f172a;
    }

    .text-center {
        text-align: center !important;
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }

    /* ==========================================================================
       ESTRUCTURA DE BOTONES COMPARTIDA CON LA PÁGINA PRINCIPAL
       ========================================================================== */
    :global(.btn) {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: inherit !important;
        padding: 0.55rem 1.2rem !important; /* Espaciado interno elegante */
        font-size: 0.9rem !important;
        font-weight: 600 !important;
        border-radius: 8px !important;    /* Bordes redondeados modernos */
        border: 1px solid transparent !important;
        cursor: pointer !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        user-select: none !important;
    }

    /* Ajuste para botones pequeños de la tabla (Insertar, Eliminar, Actualizar) */
    :global(.btn-sm) {
        padding: 0.35rem 0.75rem !important;
        font-size: 0.8rem !important;
        border-radius: 6px !important;
    }

    /* --- Variaciones de Colores Modernizados --- */
    
    /* Botón Primario (Cargar originales / Buscar) */
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

    /* Botón Secundario Outline (Limpiar Filtros) */
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

    /* Botón Danger Sólido (Eliminar todos los datos) */
    :global(.btn-danger:not(.btn-outline-danger)) {
        background-color: #fef2f2 !important;
        border-color: #fee2e2 !important;
        color: #ef4444 !important;
    }
    :global(.btn-danger:not(.btn-outline-danger):hover) {
        background-color: #fee2e2 !important;
        border-color: #fca5a5 !important;
        color: #b91c1c !important;
        transform: translateY(-1px) !important;
    }

    /* Botón Success Sólido (Insertar en tabla) */
    :global(.btn-success) {
        background-color: #10b981 !important;
        border-color: #10b981 !important;
        color: #ffffff !important;
    }
    :global(.btn-success:hover) {
        background-color: #059669 !important;
        border-color: #059669 !important;
    }

    /* Botón Danger Outline (Eliminar fila) */
    :global(.btn-outline-danger) {
        color: #ef4444 !important;
        border-color: #fca5a5 !important;
        background-color: transparent !important;
    }
    :global(.btn-outline-danger:hover) {
        background-color: #fef2f2 !important;
        color: #b91c1c !important;
        border-color: #ef4444 !important;
    }

    /* Botón Info Outline (Actualizar fila) */
    :global(.btn-outline-info) {
        color: #0284c7 !important;
        border-color: #bae6fd !important;
        background-color: transparent !important;
    }
    :global(.btn-outline-info:hover) {
        background-color: #f0f9ff !important;
        color: #0369a1 !important;
        border-color: #0284c7 !important;
    }

    @media (max-width: 768px) {
        .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        .main-actions {
            width: 100%;
            justify-content: space-between;
        }
    }
</style>