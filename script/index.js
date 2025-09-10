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
            console.log('Workbook leído. Hojas encontradas:', workbook.SheetNames); // Nuevo log

            let demandaData = [];
            let capacidadData = [];

            // Procesar Demanda
            if (workbook.SheetNames.includes('Demanda')) {
                demandaData = window.processSheet(workbook.Sheets['Demanda'], null, 1, 0);
                console.log('Datos de Demanda extraídos:', demandaData); // Nuevo log

                let demandaPorMes = {};
                demandaData.forEach(row => {
                    const mes = row['Mes'];
                    const demanda = parseFloat(row['Demanda']);
                    if(mes && !isNaN(demanda)){
                        demandaPorMes[mes] = (demandaPorMes[mes] || 0) + demanda;
                    }
                });
                await window.addDataToIndexedDB(window.STORE_DEMANDA, [{demandaPorMes : demandaPorMes}])
                
            }

            // Procesar Capacidad
            if (workbook.SheetNames.includes('Informacion de los modelos')) {
                // MODIFICACIÓN CRUCIAL: Cambiado a [] para extraer TODAS las columnas
                // Esto es vital para asegurar que todos los datos necesarios para los cálculos
                // sean extraídos correctamente, sin importar el orden o si hay columnas adicionales.
                capacidadData = window.processSheet(workbook.Sheets['Informacion de los modelos'], [], 1, 0);
                console.log('Datos ANTES de cálculos (Capacidad):', capacidadData); // Nuevo log

                const totalModelos = capacidadData [0]['Total Modelos: '];

                

                capacidadData.forEach(row => {
                    // Corregir nombres de columnas y conversión numérica
                    const largoSeparacionIn = parseFloat(String(row['Largo Pallet (In)']).trim()) || 0;
                    const velocidadConveyorFtMin = parseFloat(String(row['Velocidad de Conveyor (ft/min)']).trim()) || 0;
                    const arrayValue = parseFloat(String(row['Array']).trim()) || 0;
                    const uphReal = parseFloat(String(row['UPH Real']).trim()) || 0;

                    
                    // Cálculos corregidos
                    const sumaseparacion=largoSeparacionIn + 6;
                    const largoMasSeparacionFt = sumaseparacion / 12;
                    const tiempoMin = (largoMasSeparacionFt && velocidadConveyorFtMin) 
                        ? largoMasSeparacionFt / velocidadConveyorFtMin 
                        : 0;
                    
                    const tiempoSeg = tiempoMin * 60;
                    const palletPorHora = (tiempoSeg !== 0) ? 3600 / tiempoSeg : 0;
                    const uph100 = palletPorHora * arrayValue;
                    
                    // Eficiencia corregida (usando UPH Real y UPH 100%)
                    const eficiencia = (uphReal !== 0 && uph100 !== 0) 
                        ? uphReal / uph100 
                        : 0;


                    
                    
                    // Actualizar los valores en la fila
                    row['Largo + Separación (ft)'] = largoMasSeparacionFt;
                    row['Tiempo (min)'] = tiempoMin;
                    row['Tiempo (seg)'] = tiempoSeg;
                    row['Pallet por hora'] = palletPorHora;
                    row['UPH 100%'] = uph100;
                    row['Eficiencia'] = eficiencia;
                    row['OEE'] = row['OEE'] || 0;  // Se calculará después
                });

            }

            // Guardar datos en IndexedDB
            if (demandaData.length > 0) await window.addDataToIndexedDB(window.STORE_DEMANDA, demandaData);
            if (capacidadData.length > 0) await window.addDataToIndexedDB(window.STORE_INFORMACION, capacidadData);

            // Mostrar resultados preliminares en index.html
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
        if (!resultadosDiv) { // Añade esta verificación por si acaso
            console.error("El div con id 'resultados' no fue encontrado en el DOM.");
            return;
        }
        resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores
        if (capacidadData.length === 0) {
            resultadosDiv.innerHTML = '<p>No hay datos de capacidad para mostrar.</p>';
            return;
        }

        // Solo muestra los resultados de la primera fila o un resumen si hay muchas
        const firstRow = capacidadData[0];
        resultadosDiv.innerHTML += `
            <h3>Resumen de Cálculos (De manera General)</h3>
            <p>Performance: ${firstRow['Eficiencia'] ? (firstRow['Eficiencia'] * 100).toFixed(2) + '%' : 'N/A'}</p>
            <p>OEE (Inicial): ${firstRow['OEE'] ? (firstRow['OEE'] * 100).toFixed(2) + '%' : 'N/A'}</p>
            <p>Pallet por hora: ${firstRow['Pallet por hora'] ? firstRow['Pallet por hora'].toFixed(2) : 'N/A'}</p>
            <p>UPH 100%: ${firstRow['UPH 100%'] ? firstRow['UPH 100%'].toFixed(2) : 'N/A'}</p>
        `;
        // Puedes añadir más detalles si es necesario o un bucle para todas las filas
       
    }
});