<svelte:head>
    <title>Análisis</title>
    <meta name="description" content="Página de inicio del proyecto SOS2526-JUL-MRR>" />
</svelte:head>

<div class="container">
    <h1>SOS2526-JUL-MRR</h1>

    <h2>Team</h2>
    <ul class="team-list">
        <li><strong>María Rodríguez Romero</strong> - online-sales-popular-marketplaces</li>
    </ul>

    <h2>Visualizaciones de los datos</h2>
    <div class="button-group">
        <a class="buttonEnlace" href="/analytics/online-sales-popular-marketplaces" target="_blank">online-sales-popular-marketplaces</a>
        <a class="buttonEnlace" href="/analytics/online-sales-popular-marketplaces/map" target="_blank">map online-sales-popular-marketplaces</a>
    </div>
</div>

<style>
    /* Configuración del layout claro base para todo el sitio */
    :global(body) {
        margin: 0;
        font-family: '-apple-system', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        /* Fondo general gris muy claro */
        color: #334155;
        /* Texto principal gris oscuro, suave para la vista */
    }

    .container {
        max-width: 800px;
        margin: 2.5rem auto;
        padding: 0 1.5rem;
        flex: 1;
    }

    h1 {
        font-size: 2.25rem;
        font-weight: 800;
        background: linear-gradient(to right, #0284c7, #6366f1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 2rem;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
    }

    h2 {
        font-size: 1.1rem;
        color: #64748b;
        margin-top: 2.5rem;
        margin-bottom: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .team-list {
        list-style: none;
        padding: 0;
        margin: 0 0 1.5rem 0;
    }

    .team-list li {
        background-color: #ffffff;
        padding: 1rem 1.25rem;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        color: #475569;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .team-list strong {
        color: #0f172a;
    }

    .button-group {
        margin-bottom: 1.25rem;
    }

    .buttonEnlace {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: #ffffff;
        padding: 0.7rem 1.4rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.15);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .buttonEnlace:hover {
        transform: translateY(-1.5px);
        box-shadow: 0 6px 12px -2px rgba(37, 99, 235, 0.3);
    }

    .buttonEnlace:active {
        transform: translateY(0);
    }
</style>