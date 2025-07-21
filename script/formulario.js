document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dtAdicionales');
    const mensaje = document.querySelector('.message');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        mensaje.textContent = 'Guardando datos...';

        const formData = new FormData(form);
        const formAnswers = {
            Turno1Obligatorio: parseInt(formData.get('Turno1Obligatorio')),
            turno2: parseInt(formData.get('turno2')),
            turno3: parseInt(formData.get('turno3')),
            Modelos: parseFloat(formData.get('Modelos')),
            Xdia: parseFloat(formData.get('Xdia')), // NPI en minutos
            Yield: parseFloat(formData.get('Yield')),
            timestamp: new Date().toISOString()
        };

        // *** Lógica de Cálculos ***
        let turno1Hrs = 0; // Se mantiene el nombre de la variable pero ahora representa minutos
        let turno2Hrs = 0; // Se mantiene el nombre de la variable pero ahora representa minutos
        let turno3Hrs = 0; // Se mantiene el nombre de la variable pero ahora representa minutos

        if (formAnswers.Turno1Obligatorio === 1) {
            turno1Hrs = 432; // Minutos del Turno 1
        }
        if (formAnswers.turno2 === 1) {
            turno2Hrs = 408; // Minutos del Turno 2
        }
        if (formAnswers.turno3 === 1) {
            turno3Hrs = 380; // Minutos del Turno 3
        }

        // Cálculos ya ajustados a minutos
        formAnswers.Cambiomodelo = formAnswers.Modelos * 15; // Horas por cambio de modelo al día (se mantiene en 15 minutos por cambio)
        formAnswers.Cambioxdia = formAnswers.Xdia; // NPI en minutos, ya no es una resta de horas.

        // Convert Yield to a decimal for calculation
        formAnswers.Cambioyi = formAnswers.Yield / 100;

        // New calculation for Mantenimiento (4 days * 24 hours/day * 60 minutes/hour)
        formAnswers.Mantenimiento = 4 * 24 * 60; // 5760 minutos

        // Calculate total shift hours in minutes based on selected shifts
        let totalShiftMinutes = 0;
        if (formAnswers.Turno1Obligatorio === 1) {
            totalShiftMinutes += 432;
        }
        if (formAnswers.turno2 === 1) {
            totalShiftMinutes += 408;
        }
        if (formAnswers.turno3 === 1) {
            totalShiftMinutes += 380;
        }

        // calcular los dias del mes de forma dinamica
        
        const daysInMonth = 30; // Assuming a 30-day month for the calculation
        
        formAnswers.Variability = (totalShiftMinutes * daysInMonth) - (formAnswers.Cambiomodelo * daysInMonth) - (formAnswers.Cambioxdia * daysInMonth) - formAnswers.Mantenimiento;

        // Placeholder for Productivity (Eficiencia).
        // If you have a specific formula for Productivity, replace this.
        // For now, let's keep it as a placeholder or a default value if not calculated.
        formAnswers.Eficiencia = 0.872; // Placeholder for 87.2% EJEMPLO

        // Calculate OEE
        formAnswers.OEE = formAnswers.Variability * formAnswers.Eficiencia * formAnswers.Cambioyi;


        try {
            await window.addDataToIndexedDB(window.STORE_FORM_ADICIONAL, [formAnswers]);
            mensaje.textContent = '¡Datos guardados exitosamente! ✅';
            setTimeout(() => window.location.href = './Resultados.html', 1000);
        } catch (error) {
            console.error("Error al guardar datos adicionales:", error);
            mensaje.textContent = `Error al guardar datos adicionales: ${error.message} ❌`;
        }
    });

    async function checkExistingFormData() {
        try {
            const data = await window.getAllDataFromIndexedDB(window.STORE_FORM_ADICIONAL);
            if (data && data.length > 0) {
                mensaje.textContent = 'Datos adicionales previos encontrados. Puedes continuar a resultados. ✅';
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