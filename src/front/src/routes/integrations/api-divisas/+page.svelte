<script>
    import { onMount, tick } from 'svelte';

    let cargando = $state(true);
    let errorMensaje = $state("");
    let chartElement = $state();

    // Solo procesamos hasta agosto por el límite del 27/08/2024
    const mesesFiltrados = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"];

    onMount(async () => {
        try {
            // 1. OBTENER TUS DATOS DE VENTAS
            let salesData = [];
            let resSales = await fetch("/api/v1/online-sales-popular-marketplaces");
            if (resSales.status === 200) {
                let data = await resSales.json();
                if (data.length === 0) {
                    const resLoad = await fetch("/api/v1/online-sales-popular-marketplaces/loadInitialData");
                    if (resLoad.ok) { 
                        await new Promise(r => setTimeout(r, 1000));
                        const resFinal = await fetch("/api/v1/online-sales-popular-marketplaces"); 
                        salesData = await resFinal.json();
                    }
                } else {
                    salesData = data;
                }
            } else {
                throw new Error("Tu API de Ventas falló con código " + resSales.status);
            }

            // Acumular ventas totales globales por mes (solo hasta agosto: índices 0 al 7)
            let ventasMensuales = Array(8).fill(0);
            salesData.forEach(dato => {
                if (dato.date) {
                    let fecha = new Date(dato.date);
                    let mes = fecha.getMonth();
                    // Filtramos: año 2024 y antes del 28 de agosto
                    if (fecha.getFullYear() === 2024 && mes <= 7) {
                        ventasMensuales[mes] += (Number(dato.total) || 0);
                    }
                }
            });

            // 2. OBTENER DATOS EXTERNOS DESDE TU PROPIO PROXY
            let resProxy = await fetch("/api/v1/proxy-divisas");
            if (!resProxy.ok) throw new Error("Tu proxy de divisas respondió con error");
            let datosDivisas = await resProxy.json();

            // Procesar el histórico diario del proxy para sacar la media mensual (USD -> EUR)
            let cotizacionesPorMes = Array(8).fill().map(() => []);
            Object.keys(datosDivisas.rates).forEach(fechaStr => {
                let fecha = new Date(fechaStr);
                let mes = fecha.getMonth();
                if (mes <= 7 && datosDivisas.rates[fechaStr].EUR) {
                    cotizacionesPorMes[mes].push(datosDivisas.rates[fechaStr].EUR);
                }
            });

            // Calcular el valor medio de cotización por mes
            let mediasDivisas = cotizacionesPorMes.map(valoresDiarios => {
                if (valoresDiarios.length === 0) return 0;
                let suma = valoresDiarios.reduce((a, b) => a + b, 0);
                return Number((suma / valoresDiarios.length).toFixed(4));
            });

            // 3. ESTRUCTURAR DATOS PARA LA PIRÁMIDE (Calculando el valor en Euros)
            let datosPiramide = mesesFiltrados.map((mes, i) => {
                let ventasUSD = Math.round(ventasMensuales[i]);
                let cotizacionEUR = mediasDivisas[i];
                // Calculamos el equivalente en euros multiplicando tus ventas por la tasa de ese mes
                let ventasEUR = Math.round(ventasUSD * cotizacionEUR);

                return {
                    name: mes,
                    y: ventasUSD,          // Highcharts usa 'y' para calcular el tamaño geométrico (Ventas USD)
                    ventasEuros: ventasEUR, // Guardamos el valor en euros como una propiedad personalizada
                    tasa: cotizacionEUR     // Guardamos la tasa del mes para el tooltip
                };
            });

            // 4. IMPORTACIÓN DINÁMICA DEL MÓDULO FUNNEL/PYRAMID (Seguro con Vite)
            const Highcharts = (await import('highcharts')).default;
            await import('highcharts/modules/funnel');

            cargando = false;
            await tick();

            // 5. RENDERIZADO CON HIGHCHARTS (Con etiquetas dobles de divisa)
            Highcharts.chart(chartElement, {
                chart: {
                    type: 'pyramid'
                },
                title: {
                    text: 'Impacto de Divisas: Evolución de Ventas según la Fuerza del Dólar (2024)',
                    align: 'left'
                },
                subtitle: {
                    text: 'Periodo: 01/01/2024 al 27/08/2024 | Conversión de moneda integrada vía Proxy',
                    align: 'left'
                },
                plotOptions: {
                    pyramid: {
                        dataLabels: {
                            enabled: true,
                            // Usamos una función format para pintar las dos monedas en la etiqueta del bloque
                            formatter: function () {
                                return `<b>${this.point.name}</b><br/>` +
                                    `🇺🇸 USD: $${this.y.toLocaleString()}<br/>` +
                                    `🇪🇺 EUR: €${this.point.ventasEuros.toLocaleString()}`;
                            },
                            softConnector: true
                        },
                        center: ['40%', '50%'],
                        width: '65%'
                    }
                },
                legend: { enabled: false },
                tooltip: {
                    // Mejoramos el cartelito flotante para que te explique el tipo de cambio aplicado
                    pointFormat: '<b>Tasa de cambio aplicada:</b> 1 USD = {point.tasa} EUR'
                },
                series: [{
                    name: 'Ingresos Online',
                    data: datosPiramide
                }]
            });

        } catch (error) {
            console.error("Error en la integración:", error);
            errorMensaje = error.message;
            cargando = false;
        }
    });
</script>

<main style="padding: 2rem; max-width: 1200px; margin: 0 auto; font-family: 'Segoe UI', sans-serif;">
    <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
        💱 Integración con Proxy: Correlación USD/EUR e Ingresos
    </h2>
    
    <p style="color: #475569; line-height: 1.6; font-size: 1.05rem; margin-bottom: 20px;">
        Este módulo analiza de forma escalonada el impacto del valor del Euro respecto a tus ingresos en dólares estadounidenses durante el año 2024. Los datos de cotización diaria se recuperan de manera segura a través de un <strong>endpoint proxy desarrollado en nuestro backend</strong>.
    </p>

    {#if cargando}
        <div style="text-align: center; padding: 4rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 1.2rem; color: #4f46e5; font-weight: bold; margin: 0;">
                🔒 Conectando al proxy local y procesando tipos de cambio históricos...
            </p>
        </div>
    {:else if errorMensaje}
        <div style="background-color: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 20px; border-radius: 8px; font-weight: 500;">
            ❌ <strong>Error de configuración:</strong> {errorMensaje}
        </div>
    {:else}
        <div style="width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <div bind:this={chartElement} style="height: 500px;"></div>
        </div>
    {/if}
</main>