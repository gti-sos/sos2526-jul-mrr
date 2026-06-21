<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    import Highcharts from 'highcharts/highmaps';

    let chartContainer;
    let informationText = $state("Cargando mapa de regiones...");

    const API = '/api/v1/online-sales-popular-marketplaces';

    const regionKeys = {
        "North America": "na",
        "South America": "sa",
        "Europe": "eu",
        "Asia": "as",
        "Africa": "af",
        "Oceania": "oc"
    };

    onMount(async () => {
        if (!browser) return;

        try {
            const topoRes = await fetch('https://code.highcharts.com/mapdata/custom/world-continents.topo.json');
            const topology = await topoRes.json();

            const res = await fetch(API);
            if (!res.ok) throw new Error("Error al obtener los datos de la API");
            const sales = await res.json();

            if (sales.length === 0) {
                informationText = "No hay datos disponibles.";
                return;
            }

            let regionTotals = {};
            sales.forEach(sale => {
                const key = regionKeys[sale.region];
                if (key) {
                    regionTotals[key] = (regionTotals[key] || 0) + sale.total;
                }
            });

            const mapData = Object.keys(regionTotals).map(key => ({
                "hc-key": key,
                "value": Math.round(regionTotals[key])
            }));

            informationText = ""; 

            Highcharts.mapChart(chartContainer, {
                chart: { 
                    map: topology,
                    style: {
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }
                },
                title: { text: 'Distribución Global de Ventas por Región', align: 'left' },
                
                colorAxis: {
                    min: 0,
                    minColor: '#f1f5f9',
                    maxColor: '#1d4ed8', 
                },

                tooltip: {
                    headerFormat: '',
                    pointFormat: '<b>Región: {point.name}</b><br>Ventas Totales: <b>${point.value}</b>'
                },

                series: [{
                    data: mapData,
                    name: 'Ventas por Región',
                    states: {
                        hover: {
                            color: '#6366f1' 
                        }
                    },
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}' 
                    }
                }]
            });
        } catch (err) {
            console.error(err);
            informationText = "Error al cargar el mapa: " + err.message;
        }
    });
</script>

<svelte:head>
    <title>Map Analytics - Online Sales</title>
    <meta name="description" content="Mapa de distribución global de ventas online en el proyecto SOS2526-23"/>
</svelte:head> 

<div class="map-container">
    <div class="dashboard-header">
        <h2>Mapa de Ventas por Región</h2>
        <div class="main-actions">
            <a href="/analytics/online-sales-popular-marketplaces" class="btn btn-secondary">
                &larr; Volver a la gráfica
            </a>
        </div>
    </div>

    {#if informationText !== ""}
        <div class="info-panel {informationText.includes('Error') ? 'panel-error' : 'panel-info'}">
            <div class="info-message">
                <strong>Información:</strong> {informationText}
            </div>
        </div>
    {/if}

    <div class="chart-box">
        <div bind:this={chartContainer} style="width: 100%; height: 600px;"></div>
    </div>
</div>

<style>
    /* --- Contenedor Principal --- */
    .map-container {
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

    /* --- Paneles de Información (Info y Error) --- */
    .info-panel {
        border-radius: 8px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
    }
    
    .panel-info {
        background-color: #eff6ff;
        border-left: 4px solid #3b82f6;
    }
    
    .panel-info .info-message {
        color: #1e3a8a;
    }

    .panel-error {
        background-color: #fef2f2;
        border-left: 4px solid #ef4444;
    }
    
    .panel-error .info-message {
        color: #991b1b;
    }

    .info-message {
        font-size: 0.95rem;
    }

    /* --- Caja Contenedora del Mapa --- */
    .chart-box {
        width: 100%;
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

    /* Botón Secundario Outline (Volver a la gráfica) */
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
        }
        .btn {
            width: 100%;
        }
    }
</style>