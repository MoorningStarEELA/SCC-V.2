document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const cargarBtn = document.getElementById('cargarBtn');
    const continuarBtn = document.getElementById('continuarBtn');
    const mensaje = document.getElementById('mensaje');
    const resultadosDiv = document.getElementById('resultados'); // Div para mostrar resultados

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
                demandaData = window.processSheet(workbook.Sheets['Demanda'], null, 1, 0);
            }

            // Procesar Capacidad
            if (workbook.SheetNames.includes('Calculo de capacidad B5')) {
                capacidadData = window.processSheet(workbook.Sheets['Calculo de capacidad B5'], [
                    'Separación (In)', 'Largo + Separación (in)', 
                    'Velocidad de Conveyor (ft/min)', 'Array', 'UPH Real'
                ], 1, 0);

                // Realizar cálculos
                capacidadData.forEach(row => {
                    const largoSeparacionIn = parseFloat(row['Largo + Separación (in)']);
                    const velocidadConveyorFtMin = parseFloat(row['Velocidad de Conveyor (ft/min)']);
                    const arrayValue = parseFloat(row['Array']);
                    const uphReal = parseFloat(row['UPH Real']);

                    // Cálculo 1: Largo + Separación (ft)
                    row['Largo + Separación (ft)'] = !isNaN(largoSeparacionIn) ? largoSeparacionIn / 12 : 0;

                    // Cálculo 2: Tiempo (min)
                    row['Tiempo (min)'] = (row['Largo + Separación (ft)'] && velocidadConveyorFtMin) ? row['Largo + Separación (ft)'] / velocidadConveyorFtMin : 0;

                    // Cálculo 3: Tiempo (seg)
                    row['Tiempo (seg)'] = row['Tiempo (min)'] * 60;

                    // Cálculo 4: Pallet por hora
                    row['Pallet por hora'] = row['Tiempo (seg)'] ? 3600 / row['Tiempo (seg)'] : 0;

                    // Cálculo 5: UPH 100%
                    row['UPH 100%'] = row['Pallet por hora'] * arrayValue;

                    // Cálculo 6: Eficiencia
                    row['Eficiencia'] = (uphReal && row['UPH 100%']) ? row['UPH 100%'] / uphReal : 0;

                    // Aquí puedes calcular el OEE si tienes los valores de Variabilidad y Yield
                    const variabilidad = 1; // Cambia esto por el valor real de variabilidad
                    const yieldValue = 1; // Cambia esto por el valor real de yield
                    row['OEE'] = variabilidad * row['Eficiencia'] * yieldValue;
                });
            }

            // Guardar datos
            if (demandaData.length > 0) await window.addDataToIndexedDB(window.STORE_DEMANDA, demandaData);
            if (capacidadData.length > 0) await window.addDataToIndexedDB(window.STORE_CAPACIDAD, capacidadData);

            // Mostrar resultados
            mostrarResultados(capacidadData);

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

    function mostrarResultados(capacidadData) {
        resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores
        capacidadData.forEach(row => {
            const resultItem = document.createElement('div');
            resultItem.innerHTML = `
                <p>Eficiencia: ${row['Eficiencia'] ? (row['Eficiencia'] * 100).toFixed(2) + '%' : 'N/A'}</p>
                <p>OEE: ${row['OEE'] ? (row['OEE'] * 100).toFixed(2) + '%' : 'N/A'}</p>
            `;
            resultadosDiv.appendChild(resultItem);
        });
    }
});
