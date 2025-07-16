document.addEventListener('DOMContentLoaded', () => {
    const dtAdicionalesForm = document.getElementById('dtAdicionales');
    const mensajeParrafo = document.getElementById('Mensaje'); // Asegúrate que el ID sea correcto
    const continuarResultadosBtn = document.getElementById('continuarResultadosBtn');

    continuarResultadosBtn.disabled = true; // Deshabilitar por defecto

    dtAdicionalesForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita el envío tradicional del formulario y la recarga de la página <---- No lo borren ---->

        mensajeParrafo.textContent = 'Validando y guardando datos adicionales...';

        const formData = new FormData(dtAdicionalesForm);
        const formAnswers = {}; // Objeto para almacenar los datos del formulario y cálculos

        // Recolectar datos del formulario y convertirlos a tipos numéricos
        // Se asume que los campos con 'required' en HTML aseguran que no estén vacíos.
        formAnswers.Turno1Obligatorio = parseInt(formData.get('Turno1Obligatorio'));
        formAnswers.turno2 = parseInt(formData.get('turno2'));
        formAnswers.turno3 = parseInt(formData.get('turno3'));
        formAnswers.Modelos = parseFloat(formData.get('Modelos'));
        formAnswers.Xdia = parseFloat(formData.get('Xdia'));
        formAnswers.YIResultado = parseFloat(formData.get('YI'));

        // *** Lógica de Cálculos (adaptada de tu función Calcular) ***
        let turno1Hrs = 0;
        let turno2Hrs = 0;
        let turno3Hrs = 0;

        if (formAnswers.Turno1Obligatorio === 1) {
            turno1Hrs = 432;
        }
        if (formAnswers.turno2 === 1) {
            turno2Hrs = 408;
        }
        if (formAnswers.turno3 === 1) {
            turno3Hrs = 468; // se cambio por min , TODO A MINUTOS
        }

        // Almacenar las horas de turno directamente en formAnswers si son útiles
        formAnswers.turno1Hrs = turno1Hrs;
        formAnswers.turno2Hrs = turno2Hrs;
        formAnswers.turno3Hrs = turno3Hrs;

        let SumaPrimeros2Turnos = 0;
        if (formAnswers.Turno1Obligatorio === 1 || formAnswers.turno2 === 1) {
            SumaPrimeros2Turnos = turno1Hrs + turno2Hrs;
        }
        formAnswers.SumaPrimeros2Turnos = SumaPrimeros2Turnos; // Guardar resultado

        let SumaTurnos13 = 0;
        if (formAnswers.Turno1Obligatorio === 1 || formAnswers.turno3 === 1) {
            SumaTurnos13 = turno1Hrs + turno3Hrs;
        }
        formAnswers.SumaTurnos13 = SumaTurnos13; // Guardar resultado

        let SumatotalTurnos = 0;
        // Asegúrate que la condición sea correcta, tu original tenía un espacio extra "1 "
        if (formAnswers.Turno1Obligatorio === 1 || formAnswers.turno2 === 1 || formAnswers.turno3 === 1) {
            SumatotalTurnos = turno1Hrs + turno2Hrs + turno3Hrs;
        }
        formAnswers.SumatotalTurnos = SumatotalTurnos; // Guardar resultado


        if (!isNaN(formAnswers.Modelos)) {
            formAnswers.Cambiomodelo = formAnswers.Modelos * 0.3; // Guardar resultado
        }
        if (!isNaN(formAnswers.Xdia)) {
            formAnswers.Cambioxdia = turno1Hrs - formAnswers.Xdia; // Guardar resultado
        }
        if (!isNaN(formAnswers.YI)) {
            formAnswers.Cambioyi = formAnswers.YIResultado * 0.95; // Guardar resultado
        }
        // *** Fin de la lógica de Cálculos ***

        // Opcional: Agregar una marca de tiempo
        formAnswers.timestamp = new Date().toISOString();

        console.log("Datos y cálculos del formulario a guardar:", formAnswers);

        try {
            // Guardar las respuestas del formulario (incluyendo cálculos) en IndexedDB
            await window.addDataToIndexedDB(window.STORE_FORM_ADICIONAL, [formAnswers]);
            mensajeParrafo.textContent = 'Datos adicionales guardados exitosamente. ✅';
            continuarResultadosBtn.disabled = false; // Habilitar el botón para ir a resultados
            continuarResultadosBtn.onclick = () => window.location.href = './Resultados.html';

        } catch (error) {
            console.error("Error al guardar datos adicionales:", error);
            mensajeParrafo.textContent = `Error al guardar datos adicionales: ${error.message} ❌`;
            continuarResultadosBtn.disabled = true; // Asegurarse de que esté deshabilitado si falla
        }
    });

    // Opcional: Verificar si ya hay datos adicionales para habilitar el botón al recargar la página
    async function checkExistingFormData() {
        try {
            const data = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);
            if (data && data.length > 0) {
                mensajeParrafo.textContent = 'Datos adicionales previos encontrados. Puedes continuar a resultados. ✅';
                continuarResultadosBtn.disabled = false;
                continuarResultadosBtn.onclick = () => window.location.href = './Resultados.html';
            }
        } catch (error) {
            console.warn("No se pudieron verificar datos adicionales previos:", error);
        }
    }
    checkExistingFormData();
});