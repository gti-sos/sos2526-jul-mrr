<script>
    import Highcharts from 'highcharts';
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    let API = '/api/v1/online-sales-popular-marketplaces';
    if (dev) {
        API = '' + API;
    }

    let informationText = $state("");

    // 1. Función para cargar los datos en el backend
    async function loadInitialData() {
        informationText = "Cargando datos en la base de datos...";
        try {
            const res = await fetch(API + "/loadInitialData", { method: "GET" });
            const resultStatusCode = await res.status;
            
            if (resultStatusCode == 200 || resultStatusCode == 409) {
                // Primero dibujamos la gráfica con los nuevos datos
                await getSalesAndRender();
                // DESPUÉS ponemos el mensaje de éxito
                if (resultStatusCode == 200) {
                    informationText = "¡Datos cargados con éxito!";
                } else {
                    informationText = "Los datos ya estaban cargados en el sistema.";
                }

                // Hacemos que el mensaje desaparezca a los 3.5 segundos
                setTimeout(() => {
                    informationText = "";
                }, 3500);
            } else {
                informationText = "Error inesperado al cargar los datos iniciales.";
            }
        } catch (error) {
            informationText = "Error de conexión con el servidor.";
        }
    }

    async function getSalesAndRender() {
        try {
            const res = await fetch(API, { method: "GET" });
            if (!res.ok) {
                informationText = "Error al obtener los datos de la API.";
                return;
            }
            
            const apiData = await res.json();
            if (apiData.length === 0) {
                informationText = "La base de datos está vacía. Pulsa 'Cargar los datos originales'.";
                document.getElementById('container').innerHTML = '';
                return;
            }

            if (informationText === "Cargando gráfica...") {
                informationText = "";
            }

            // 1. OBTENER TODOS LOS MESES (Para que no se salte Junio ni meses vacíos)
            const fechas = apiData.map(item => item.date.substring(0, 7)).sort();
            const minMes = fechas[0];
            const maxMes = fechas[fechas.length - 1];

            const mesesCompletos = [];
            let [year, month] = minMes.split('-').map(Number);
            const [maxYear, maxMonth] = maxMes.split('-').map(Number);

            while (year < maxYear || (year === maxYear && month <= maxMonth)) {
                const mesStr = month.toString().padStart(2, '0');
                mesesCompletos.push(`${year}-${mesStr}`);
                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
            }

            // 2. ORDENAR REGIONES POR TAMAÑO (Para que América sea la base y no flote encima)
            const volumenPorRegion = {};
            apiData.forEach(item => {
                if (!volumenPorRegion[item.region]) {
                    volumenPorRegion[item.region] = 0;
                }
                volumenPorRegion[item.region] += item.total;
            });
            // Ordenamos de mayor a menor. La región con más ventas irá en el índice 0 (abajo del stack)
            const regionesUnicas = Object.keys(volumenPorRegion).sort((a, b) => volumenPorRegion[a] - volumenPorRegion[b]);
            // 3. GENERAR LAS SERIES
            const seriesData = regionesUnicas.map(region => {
                const dataPorMes = mesesCompletos.map(mes => {
                    const totalMes = apiData
                        .filter(item => item.region === region && item.date.startsWith(mes))
                        .reduce((suma, item) => suma + item.total, 0);
                    return Math.round(totalMes * 100) / 100;
                });

                return {
                    name: region,
                    data: dataPorMes,
                    fillOpacity: 0.2
                };
            });
            // 4. PINTAR LA GRÁFICA
            Highcharts.chart('container', {
                chart: { type: 'area' },
                title: { text: 'Ingresos Mensuales por Región', align: 'left' },
                xAxis: {
                    categories: mesesCompletos.map(m => {
                        const [y, mth] = m.split('-');
                        const fecha = new Date(y, mth - 1, 1);
                        return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                    }),
                    tickmarkPlacement: 'on'
                },
                yAxis: {
                    title: { text: 'Total Ventas ($)' },
                    labels: { format: '${value}' }
                },
                tooltip: {
                    shared: true,
                    headerFormat: '<b>{point.key}</b><br/>',
                    valuePrefix: '$',
                    valueDecimals: 2
                },
                plotOptions: {
                    area: {
                        pointPlacement: 'on',
                        lineColor: '#ffffff',
                        lineWidth: 2,
                        marker: { enabled: true, radius: 4 }
                    }
                },
                series: seriesData
            });
        } catch (error) {
            informationText = "No se pudo conectar con el servidor para pintar la gráfica.";
        }
    }

    onMount(() => {
        informationText = "Cargando gráfica...";
        getSalesAndRender();
    });
</script>

<svelte:head>
    <title>Analytics - Online Sales</title>
    <meta name="description" content="Analítica de ventas online en el proyecto SOS2526-23"/>
</svelte:head> 

<div class="analytics-container">
    <div class="dashboard-header">
        <h2>Analítica Mensual de Ventas</h2>
        <div class="main-actions">
            <button class="btn btn-primary" onclick={loadInitialData}>Cargar los datos originales</button>
            <a href="/analytics/online-sales-popular-marketplaces/map" class="btn btn-secondary">Ver Mapa de Ventas</a>
        </div>
    </div>
    
    {#if informationText}
        <div class="info-panel">
            <div class="info-message">
                <strong>Información:</strong> {informationText}
            </div>
        </div>
    {/if}

    <div id="container" class="chart-box"></div>
</div>

<style>
    /* --- Contenedor Principal --- */
    .analytics-container {
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

    h2 {
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

    /* --- Panel de Información --- */
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

    /* --- Contenedor de la Gráfica --- */
    .chart-box {
        width: 100%;
        height: 500px;
        background: white;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
        padding: 1.5rem;
        box-sizing: border-box;
    }

    /* ==========================================================================
       FORMA Y COLORES DE BOTONES COMPARTIDOS CON LA PÁGINA PRINCIPAL
       ========================================================================== */
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: inherit;
        padding: 0.55rem 1.2rem;
        font-size: 0.9rem;
        font-weight: 600;
        border-radius: 8px;
        border: 1px solid transparent;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
    }

    /* Botón Primario (Cargar datos) */
    .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-color: #3b82f6;
        color: #ffffff;
        box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.15);
    }
    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 12px -2px rgba(37, 99, 235, 0.25);
        filter: brightness(1.05);
        color: #ffffff;
    }

    /* Botón Secundario (Ver Mapa de Ventas) */
    .btn-secondary {
        color: #475569;
        border-color: #cbd5e1;
        background-color: transparent;
    }
    .btn-secondary:hover {
        background-color: #f1f5f9;
        color: #1e293b;
        border-color: #94a3b8;
        transform: translateY(-1px);
    }

    @media (max-width: 640px) {
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