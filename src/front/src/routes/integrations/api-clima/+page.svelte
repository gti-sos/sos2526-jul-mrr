<script>
    import { onMount, tick } from 'svelte';

    // Estados reactivos de Svelte 5
    let cargando = $state(true);
    let errorMensaje = $state("");
    let chartElement = $state();

    // DICCIONARIO: Asociamos cada región a una ciudad representativa y sus coordenadas
    const configRegiones = {
        "North America": { ciudad: "Nueva York", lat: 40.7128, lon: -74.0060 },
        "Europe":        { ciudad: "Londres",    lat: 51.5074, lon: -0.1278 },
        "Asia":          { ciudad: "Tokio",     lat: 35.6895, lon: 139.6917 }
    };

    // Nombres de los meses para el eje X
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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

            // 2. ESTRUCTURAR ACUMULADORES MENSUALES (Ene=0, Feb=1...)
            // Crearemos un mapa mensual para ingresos y otro para temperaturas por región
            let ventasMensuales = { "North America": Array(12).fill(0), "Europe": Array(12).fill(0), "Asia": Array(12).fill(0) };
            let tempMensuales = { "North America": Array(12).fill(0), "Europe": Array(12).fill(0), "Asia": Array(12).fill(0) };
            let conteoDiasMes = { "North America": Array(12).fill(0), "Europe": Array(12).fill(0), "Asia": Array(12).fill(0) };

            // Procesar tus datos de ventas asignándolos a su mes correspondiente
            salesData.forEach(dato => {
                let region = dato.region;
                if (ventasMensuales[region] !== undefined && dato.date) {
                    let mes = new Date(dato.date).getMonth(); // Obtiene el mes (0-11)
                    ventasMensuales[region][mes] += (Number(dato.total) || 0);
                }
            });

            // 3. LLAMADAS A LA API EXTERNA (Open-Meteo Histórico para el año 2024)
            // Hacemos las peticiones en paralelo para las 3 regiones
            const promesasClima = Object.keys(configRegiones).map(async (region) => {
                const { lat, lon } = configRegiones[region];
                const urlClima = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2024-01-01&end_date=2024-12-31&daily=temperature_2m_mean&timezone=auto`;
                
                const res = await fetch(urlClima);
                if (!res.ok) throw new Error(`API de clima falló para ${region}`);
                const climaData = await res.json();
                
                // Open-Meteo devuelve un array 'time' (fechas) y otro 'temperature_2m_mean' (valores diarios)
                const fechas = climaData.daily.time;
                const tempsDiarias = climaData.daily.temperature_2m_mean;

                fechas.forEach((fechaStr, index) => {
                    let mes = new Date(fechaStr).getMonth();
                    let temp = tempsDiarias[index];
                    if (temp !== null && temp !== undefined) {
                        tempMensuales[region][mes] += temp;
                        conteoDiasMes[region][mes] += 1;
                    }
                });

                // Calcular la media real por mes dividiendo el acumulado entre los días del mes
                for (let mes = 0; mes < 12; mes++) {
                    if (conteoDiasMes[region][mes] > 0) {
                        tempMensuales[region][mes] = Number((tempMensuales[region][mes] / conteoDiasMes[region][mes]).toFixed(1));
                    }
                }
            });

            await Promise.all(promesasClima);

            // Importar Highcharts de forma dinámica para evitar problemas con SSR
            const Highcharts = (await import('highcharts')).default;

            cargando = false;
            await tick();

            // 4. RENDERIZADO CON HIGHCHARTS
            Highcharts.chart(chartElement, {
                chart: { zoomType: 'xy' },
                title: { text: 'Impacto del Clima Histórico (2024) en las Ventas Online', align: 'left' },
                subtitle: { text: 'Comparativa de Ingresos vs Temperatura Media de Ciudades de Referencia', align: 'left' },
                xAxis: [{
                    categories: mesesNombres,
                    crosshair: true
                }],
                yAxis: [
                    { // Eje Y Primario (Izquierda) - Ventas
                        labels: {
                            format: '${value}',
                            style: { color: '#2b2b2b' }
                        },
                        title: {
                            text: 'Ingresos Online (USD)',
                            style: { color: '#2b2b2b' }
                        }
                    }, 
                    { // Eje Y Secundario (Derecha) - Temperatura
                        title: {
                            text: 'Temperatura Media (°C)',
                            style: { color: '#f43f5e' }
                        },
                        labels: {
                            format: '{value}°C',
                            style: { color: '#f43f5e' }
                        },
                        opposite: true
                    }
                ],
                tooltip: { shared: true },
                legend: { layout: 'horizontal', align: 'center', verticalAlign: 'bottom' },
                series: [
                    // --- Series de Ventas (Barras) ---
                    {
                        name: 'Ventas North America (NY)',
                        type: 'column',
                        data: ventasMensuales["North America"],
                        tooltip: { valuePrefix: '$' },
                        color: '#3b82f6'
                    },
                    {
                        name: 'Ventas Europe (Londres)',
                        type: 'column',
                        data: ventasMensuales["Europe"],
                        tooltip: { valuePrefix: '$' },
                        color: '#10b981'
                    },
                    {
                        name: 'Ventas Asia (Tokio)',
                        type: 'column',
                        data: ventasMensuales["Asia"],
                        tooltip: { valuePrefix: '$' },
                        color: '#f59e0b'
                    },
                    // --- Series de Temperatura (Líneas) ---
                    {
                        name: 'Temp North America (NY)',
                        type: 'spline',
                        yAxis: 1,
                        data: tempMensuales["North America"],
                        tooltip: { valueSuffix: ' °C' },
                        color: '#93c5fd',
                        dashStyle: 'ShortDot'
                    },
                    {
                        name: 'Temp Europe (Londres)',
                        type: 'spline',
                        yAxis: 1,
                        data: tempMensuales["Europe"],
                        tooltip: { valueSuffix: ' °C' },
                        color: '#6ee7b7',
                        dashStyle: 'ShortDot'
                    },
                    {
                        name: 'Temp Asia (Tokio)',
                        type: 'spline',
                        yAxis: 1,
                        data: tempMensuales["Asia"],
                        tooltip: { valueSuffix: ' °C' },
                        color: '#fde047',
                        dashStyle: 'ShortDot'
                    }
                ]
            });

        } catch (error) {
            console.error("Error en la integración:", error);
            errorMensaje = error.message;
            cargando = false;
        }
    });
</script>

<main style="padding: 2rem; max-width: 1200px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
        📊 Estacionalidad: Ventas Online vs Clima Histórico
    </h2>
    
    <p style="color: #475569; line-height: 1.6; font-size: 1.05rem; margin-bottom: 20px;">
        Esta gráfica combina los ingresos mensuales agregados de tu API de ventas (columnas) con las fluctuaciones de temperatura media del año 2024 obtenidas de la API histórica de <strong>Open-Meteo</strong> (líneas) para las principales ciudades de cada región.
    </p>

    {#if cargando}
        <div style="text-align: center; padding: 4rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 1.2rem; color: #f43f5e; font-weight: bold; margin: 0;">
                🌡️ Extrayendo registros meteorológicos del 2024 y calculando medias mensuales...
            </p>
        </div>
    {:else if errorMensaje}
        <div style="background-color: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 20px; border-radius: 8px; font-weight: 500;">
            ❌ <strong>Error de conexión:</strong> {errorMensaje}
        </div>
    {:else}
        <div style="width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <div bind:this={chartElement}></div>
        </div>
    {/if}
</main>