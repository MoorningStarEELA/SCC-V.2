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
            Xdia: parseFloat(formData.get('Xdia')),
            Yield: parseFloat(formData.get('Yield')),
            timestamp: new Date().toISOString()
        };
        
        // Realizar cálculos
        formAnswers.Cambiomodelo = formAnswers.Modelos * 15;
        formAnswers.Cambioxdia = (formAnswers.Turno1Obligatorio ? 432 : 0) - formAnswers.Xdia;
        formAnswers.Cambioyi = formAnswers.Yield;
        
        try {
            await window.addDataToIndexedDB(window.STORE_FORM_ADICIONAL, [formAnswers]);
            mensaje.textContent = '¡Datos guardados exitosamente! ✅';
            setTimeout(() => window.location.href = './Resultados.html', 1000);
        } catch (error) {
            console.error("Error al guardar datos:", error);
            mensaje.textContent = `Error: ${error.message}`;
        }
    });
});