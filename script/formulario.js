document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dtAdicionales');
    const mensaje = document.querySelector('.message');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        mensaje.textContent = 'Guardando datos...';

        const formData = new FormData(form);
        const formAnswers = {}; // Objeto para almacenar los datos del formulario y cálculos

        // Recolectar datos del formulario y convertirlos a tipos numéricos
        formAnswers.Turno1Obligatorio = parseInt(formData.get('Turno1Obligatorio'));
        formAnswers.turno2 = parseInt(formData.get('turno2'));
        formAnswers.turno3 = parseInt(formData.get('turno3'));
        formAnswers.Modelos = parseFloat(formData.get('Modelos'));
        formAnswers.Xdia = parseFloat(formData.get('Xdia'));
        formAnswers.Yield = parseFloat(formData.get('Yield'));

        // *** Lógica de Cálculos ***
        let turno1Hrs = 0;
        let turno2Hrs = 0;
        let turno3Hrs = 0;

        if (formAnswers.Turno1Obligatorio === 1) {
            turno1Hrs = 432; // Minutos
        }
        if (formAnswers.turno2 === 1) {
            turno2Hrs = 408; // Minutos
        }
        if (formAnswers.turno3 === 1) {
            turno3Hrs = 468; // Minutos
        }

        // Almacenar las horas de turno (en minutos)
        formAnswers.turno1Hrs = turno1Hrs;
        formAnswers.turno2Hrs = turno2Hrs;
        formAnswers.turno3Hrs = turno3Hrs;

        // Sumas de turnos
        formAnswers.SumaPrimeros2Turnos = 0;
        if (formAnswers.Turno1Obligatorio === 1 || formAnswers.turno2 === 1) {
            formAnswers.SumaPrimeros2Turnos = turno1Hrs + turno2Hrs;
        }

        formAnswers.SumaTurnos13 = 0;
        if (formAnswers.Turno1Obligatorio === 1 || formAnswers.turno3 === 1) {
            formAnswers.SumaTurnos13 = turno1Hrs + turno3Hrs;
        }

        formAnswers.SumatotalTurnos = 0;
        if (formAnswers.Turno1Obligatorio === 1 || formAnswers.turno2 === 1 || formAnswers.turno3 === 1) {
            formAnswers.SumatotalTurnos = turno1Hrs + turno2Hrs + turno3Hrs;
        }

        // Otros cálculos
        formAnswers.Cambiomodelo = formAnswers.Modelos * 18;
        formAnswers.Cambioxdia = turno1Hrs - formAnswers.Xdia;
        formAnswers.Cambioyi = formAnswers.Yield * 0.95;

        // Cálculo de Variability
        const mes = 43200; // Mes en minutos (30 días * 24 horas * 60 minutos/hora)
        const mantenimiento = 5760; // Mantenimiento en minutos (4 días * 24 horas * 60 minutos/hora)

        // Asegúrate de usar los valores correctos de formAnswers para el cálculo
        formAnswers.Variabylity = mes - formAnswers.Cambiomodelo - formAnswers.SumatotalTurnos - formAnswers.Cambioxdia - mantenimiento;

        // Opcional: Agregar una marca de tiempo
        formAnswers.timestamp = new Date().toISOString();

        console.log("Datos y cálculos del formulario a guardar:", formAnswers);

        try {
            // Guardar las respuestas del formulario (incluyendo cálculos) en IndexedDB
            await window.addDataToIndexedDB(window.STORE_FORM_ADICIONAL, [formAnswers]);
            mensaje.textContent = '¡Datos guardados exitosamente! ✅';
            setTimeout(() => window.location.href = './Resultados.html', 1000);
        } catch (error) {
            console.error("Error al guardar datos adicionales:", error);
            mensaje.textContent = `Error al guardar datos adicionales: ${error.message} ❌`;
        }
    });

    // Opcional: Verificar si ya hay datos adicionales para habilitar el botón al recargar la página
    async function checkExistingFormData() {
        try {
            const data = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);
            if (data && data.length > 0) {
                mensaje.textContent = 'Datos adicionales previos encontrados. Puedes continuar a resultados. ✅';
                // Solo habilitamos el botón si estamos en la página del formulario
                const continuarResultadosBtn = document.getElementById('continuarResultadosBtn');
                if (continuarResultadosBtn) {
                    continuarResultadosBtn.disabled = false;
                    continuarResultadosBtn.onclick = () => window.location.href = './Resultados.html';
                }
            }
        } catch (error) {
            console.warn("No se pudieron verificar datos adicionales previos:", error);
        }
    }
    checkExistingFormData();
});