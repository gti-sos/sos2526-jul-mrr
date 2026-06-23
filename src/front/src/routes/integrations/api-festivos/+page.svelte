<script>
    import { onMount, tick } from 'svelte';

    let cargando = $state(true);
    let errorMensaje = $state("");
    let chartElement = $state();

    const configPaises = {
        "North America": { paisCodigo: "US" },
        "Europe":        { paisCodigo: "ES" },
        "Asia":          { paisCodigo: "JP" }
    };

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

            // 2. ACUMULAR TOTALES ANUALES POR REGIÓN
            let totalesVentas = { "North America": 0, "Europe": 0, "Asia": 0 };
            let totalesFestivos = { "North America": 0, "Europe": 0, "Asia": 0 };

            salesData.forEach(dato => {
                let region = dato.region;
                if (totalesVentas[region] !== undefined) {
                    totalesVentas[region] += (Number(dato.total) || 0);
                }
            });

            // 3. LLAMADAS A LA API EXTERNA (Nager.Date 2024)
            const promesasFestivos = Object.keys(configPaises).map(async (region) => {
                const { paisCodigo } = configPaises[region];
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/2024/${paisCodigo}`);
                if (!res.ok) throw new Error(`API de festivos falló para ${region}`);
                const listaFestivos = await res.json();
                totalesFestivos[region] = listaFestivos.length; // Guardamos el total de días del año
            });

            await Promise.all(promesasFestivos);

            // Redondear ventas para el gráfico
            let vNA = Math.round(totalesVentas["North America"]);
            let vEU = Math.round(totalesVentas["Europe"]);
            let vAS = Math.round(totalesVentas["Asia"]);

            // 4. IMPORTACIÓN BÁSICA COMPATIBLE
            const Highcharts = (await import('highcharts')).default;

            cargando = false;
            await tick();

            // 5. RENDERIZADO CON HIGHCHARTS (Tipo: Semicircle Pie/Donut Doble)
            Highcharts.chart(chartElement, {
                chart: {
                    type: 'pie' // ¡Tipo Tarta/Donut, totalmente nuevo y permitido!
                },
                title: {
                    text: 'Distribución Global 2024: Volumen de Ventas vs Densidad de Festivos',
                    align: 'left'
                },
                subtitle: {
                    text: 'Comparativa proporcional anualizada por regiones',
                    align: 'left'
                },
                tooltip: {
                    valueSuffix: ''
                },
                plotOptions: {
                    pie: {
                        startAngle: -90, // Convierte la tarta en una semicircunferencia muy elegante
                        endAngle: 90,
                        center: ['50%', '75%'],
                        size: '110%'
                    }
                },
                series: [
                    {
                        name: 'Ventas Anuales (Anillo Interior)',
                        data: [
                            { name: 'Ventas NA', y: vNA, color: '#1e3a8a' },
                            { name: 'Ventas Europe', y: vEU, color: '#10b981' },
                            { name: 'Ventas Asia', y: vAS, color: '#d97706' }
                        ],
                        size: '60%',
                        dataLabels: {
                            formatter: function () {
                                return this.y > 0 ? `${this.point.name}: $${this.y}` : null;
                            },
                            color: '#ffffff',
                            distance: -30
                        },
                        tooltip: { pointFormat: '<b>{point.y} USD</b> ({point.percentage:.1f}%)' }
                    },
                    {
                        name: 'Días Festivos (Anillo Exterior)',
                        data: [
                            { name: 'Festivos EE.UU.', y: totalesFestivos["North America"], color: '#3b82f6' },
                            { name: 'Festivos España', y: totalesFestivos["Europe"], color: '#34d399' },
                            { name: 'Festivos Japón', y: totalesFestivos["Asia"], color: '#fbbf24' }
                        ],
                        size: '85%',
                        innerSize: '65%',
                        dataLabels: {
                            formatter: function () {
                                return `${this.point.name}: ${this.y} días`;
                            },
                            distance: 10
                        },
                        tooltip: { pointFormat: '<b>{point.y} días</b> ({point.percentage:.1f}%)' }
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
        📅 Integración Externa: Estructura Proporcional de Festivos y Ventas
    </h2>
    
    <p style="color: #475569; line-height: 1.6; font-size: 1.05rem; margin-bottom: 20px;">
        Esta vista analiza la correlación anual global mediante un gráfico de doble anillo semicircular. El semicírculo interno desglosa el origen de tus ingresos en dólares, mientras que el arco externo muestra la cantidad de días festivos anuales proporcionados por <strong>Nager.Date</strong>.
    </p>

    {#if cargando}
        <div style="text-align: center; padding: 4rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 1.2rem; color: #3b82f6; font-weight: bold; margin: 0;">
                📊 Generando proporciones de mercado y cargando gráfica limpia...
            </p>
        </div>
    {:else if errorMensaje}
        <div style="background-color: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 20px; border-radius: 8px; font-weight: 500;">
            ❌ <strong>Error de conexión:</strong> {errorMensaje}
        </div>
    {:else}
        <div style="width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <div bind:this={chartElement} style="height: 400px;"></div>
        </div>
    {/if}
</main>