<footer>
    <div class="footer-container">
        <p>&copy; 2026 Equipo SOS2526-JUL-MRR</p>
        <p class="tech-stack">Built with <span>Svelte</span></p>
    </div>
</footer>

<style>
    footer {
        background-color: #f8fafc; /* Color idéntico al fondo de la página */
        border-top: 1px solid #e2e8f0;
        padding: 1.5rem 0;
        margin-top: auto; /* Mantiene el footer abajo */
    }

    .footer-container {
        max-width: 1400px; /* Sincronizado con el max-width del nuevo dashboard */
        margin: 0 auto;
        padding: 0 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #94a3b8; /* Gris tenue sofisticado */
        font-size: 0.85rem;
    }

    .footer-container p {
        margin: 0;
    }

    .tech-stack span {
        color: #ea580c; /* Naranja corporativo Svelte suavizado */
        font-weight: 600;
    }
</style>