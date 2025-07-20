document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const cargarBtn = document.getElementById('cargarBtn');
    const continuarBtn = document.getElementById('continuarBtn');
    const mensaje = document.getElementById('mensaje');
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            mensaje.textContent = `Archivo seleccionado: ${fileInput.files[0].name}`;
            cargarBtn.disabled = false;
        } else {
            mensaje.textContent = '';
            cargarBtn.disabled = true;
        }
    });
    
    cargarBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            mensaje.textContent = 'Por favor, selecciona un archivo Excel.';
            return;
        }
        
        mensaje.textContent = 'Procesando archivo...';
        cargarBtn.disabled = true;
        
        try {
            const data = await window.readFileAsArrayBuffer(file);
            const workbook = XLSX.read(data, { type: 'array' });
            
            let demandaData = [];
            let capacidadData = [];
            
            // Procesar Demanda
            if (workbook.SheetNames.includes('Demanda')) {
                demandaData = window.processSheet(workbook.Sheets['Demanda']);
            }
            
            // Procesar Capacidad
            if (workbook.SheetNames.includes('Calculo de capacidad B5')) {
                capacidadData = window.processSheet(workbook.Sheets['Calculo de capacidad B5'], [
                    'Separación (In)', 'Largo + Separación (in)', 
                    'Velocidad de Conveyor (ft/min)', 'Array', 'UPH Real'
                ]);
                
                // Realizar cálculos
                capacidadData.forEach(row => {
                    // ... (tus cálculos aquí) ...
                });
            }
            
            // Guardar datos
            if (demandaData.length > 0) await window.addDataToIndexedDB(window.STORE_DEMANDA, demandaData);
            if (capacidadData.length > 0) await window.addDataToIndexedDB(window.STORE_CAPACIDAD, capacidadData);
            
            mensaje.textContent = '¡Archivo procesado exitosamente! ✅';
            continuarBtn.disabled = false;
            continuarBtn.classList.add('btn-primary');
            continuarBtn.onclick = () => window.location.href = './formulario.html';
            
        } catch (error) {
            console.error("Error al procesar el archivo:", error);
            mensaje.textContent = `Error: ${error.message}`;
            cargarBtn.disabled = false;
        }
    });
});