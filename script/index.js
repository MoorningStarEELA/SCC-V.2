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
                        const largoSeparacionIn = parseFloat(row['Largo + Separación (in)']);
                        
                        const velocidadConveyorFtMin = parseFloat(row['Velocidad de Conveyor (ft/min)']); 
                        const arrayValue = parseFloat(row['Array']); // Usar 'arrayValue' como variable
                        

                        // Cálculo 1: Largo + Separación (ft)
                        if(!isNaN(largoSeparacionIn)){
                            row['Largo + Separación (ft)'] = largoSeparacionIn / 12 ;
                        } else {
                            row['Largo + Separación (ft)'] = 0 ;
                        }

                        // Cálculo 2: Tiempo (t) min
                        const largoSeparacionFt = row['Largo + Separación (ft)']; // Usar el valor recién calculado
                        if(!isNaN(largoSeparacionFt) && !isNaN(velocidadConveyorFtMin) && velocidadConveyorFtMin !== 0){
                            row['Tiempo (t) min'] = largoSeparacionFt / velocidadConveyorFtMin ;
                        } else {
                            row['Tiempo (t) min'] = 0 ;
                        }

                        // Cálculo 3: Tiempo (t) seg
                        const tiempoMin = row['Tiempo (t) min']; // Usar el valor recién calculado
                        if(!isNaN(tiempoMin)){
                            row['Tiempo (t) seg'] = tiempoMin * 60 ;
                        } else {
                            row['Tiempo (t) seg'] = 0;
                        }

                        // Cálculo 4: Pallet * Hora
                        const tiempoSeg = row['Tiempo (t) seg']; // Usar el valor recién calculado
                        if(!isNaN(tiempoSeg) && tiempoSeg !== 0){
                            row['Pallet * Hora'] = 3600 / tiempoSeg;
                        } else {
                            row['Pallet * Hora'] = 0 ;
                        }
                        
                        // Cálculo 5: UPH 100
                        const palletPorHora = row['Pallet * Hora']; // Usar el valor recién calculado
                        if(!isNaN(palletPorHora) && !isNaN(arrayValue) && arrayValue !== 0){
                            row['UPH 100'] = palletPorHora * arrayValue ;
                        } else {
                            row['UPH 100'] = 0 ;
                        }
                        //Calculo 6: Eficiencia
                        const uphReal = parseFloat(row['UPH Real']);
                        if(!isNaN(uphReal) &&  row['UPH 100'] !== 0) {
                            row['Eficiencia'] = uphReal / row['UPH 100'];
                        }
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