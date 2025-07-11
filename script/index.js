document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const cargarBtn = document.getElementById('cargarBtn');
    const continuarBtn = document.getElementById('continuarBtn');
    const mensaje = document.getElementById('mensaje');

    // Inicialmente, el botón de continuar está deshabilitado
    continuarBtn.disabled = true;

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            mensaje.textContent = `Archivo seleccionado: ${fileInput.files[0].name}`;
            cargarBtn.disabled = false; // Habilitar el botón de cargar cuando hay un archivo
        } else {
            mensaje.textContent = 'Ningún archivo seleccionado.';
            cargarBtn.disabled = true;
            continuarBtn.disabled = true;
        }
    });

    cargarBtn.addEventListener('click', CargarArchivo);

    async function CargarArchivo() {
        const file = fileInput.files[0];
        if (!file) {
            mensaje.textContent = 'Por favor, selecciona un archivo Excel.';
            return;
        }

        mensaje.textContent = 'Procesando archivo...';
        cargarBtn.disabled = true; // Deshabilitar mientras procesa
        continuarBtn.disabled = true; // Deshabilitar también el de continuar

        try {
            const data = await window.readFileAsArrayBuffer(file);
            const workbook = XLSX.read(data, { type: 'array' });

            let demandaData = [];
            let capacidadData = [];

            // --- Procesar Pestaña "Demanda" ---
            const demandaSheetName = 'Demanda';
            if (workbook.SheetNames.includes(demandaSheetName)) {
                const worksheet = workbook.Sheets[demandaSheetName];
                // Aquí se va a leer toda la hoja de cálculo Demanda
                demandaData = window.processSheet(worksheet);
                console.log("Datos de la pestaña 'Demanda' extraídos:", demandaData);
            } else {
                console.warn(`La pestaña '${demandaSheetName}' no fue encontrada.`);
                mensaje.textContent = `Advertencia: La pestaña '${demandaSheetName}' no fue encontrada.`;
            }

            // --- Procesar Pestaña "Calculo de capacidad B5" ---
            // Asegúrate que este nombre coincida EXACTAMENTE con tu pestaña de Excel
            const capacidadSheetName = 'Calculo de capacidad B5'; 
            if (workbook.SheetNames.includes(capacidadSheetName)) {
                const worksheet = workbook.Sheets[capacidadSheetName];
                const columnsToExtract =[ 
                    'Largo Pallet (In)', // Añadí esta columna basada en tu última imagen
                    'Separación (In)',
                    'Largo + Separación (in)',
                    // CORREGIDO: Nombre de columna exacto y sin typo
                    'Velocidad de Conveyor (ft/min)', 
                    'Array',
                    'UPH Real'
                ];
                capacidadData = window.processSheet(worksheet, columnsToExtract);
                console.log("Datos de la pestaña 'Calculo de capacidad B5' extraídos:", capacidadData);
                
                if(capacidadData.length > 0) {
                    capacidadData.forEach(row => {
                        // Obtendrá los valores del excel y los convertirá a número
                        // Asegúrate que estos nombres de propiedades coincidan EXACTAMENTE con los encabezados de tu Excel
                        const largoSeparacionIn = parseFloat(row['Largo + Separación (in)']);
                        // CORREGIDO: Nombre de propiedad exacto del Excel
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
                        // Si se requiere sobrescribir 'UPH Real' de Excel con 'UPH 100' calculado, hazlo aquí:
                        // row['UPH Real'] = row['UPH 100']; 
                    });
                }
            } else { // Este 'else' es solo si la pestaña 'Calculo de capacidad B5'
                console.warn(`La pestaña '${capacidadSheetName}' no fue encontrada.`);
                if (!mensaje.textContent.includes('Advertencia')) {
                    mensaje.textContent += ` Advertencia: La pestaña '${capacidadSheetName}' no fue encontrada.`;
                }
            }

            // --- Guardar en IndexedDB ---
            if (demandaData.length > 0) {
                await window.addDataToIndexedDB(window.STORE_DEMANDA, demandaData);
            } else {
                console.warn("No hay datos para guardar 'Demanda'.");
            }

            if (capacidadData.length > 0) {
                await window.addDataToIndexedDB(window.STORE_CAPACIDAD, capacidadData);
            } else {
                console.warn("No hay datos para guardar 'Calculo de capacidad B5'.");
            }

            mensaje.textContent = `¡Archivo "${file.name}" procesado y datos guardados exitosamente! ✅`;
            continuarBtn.disabled = false; // Habilitar el botón de continuar
            continuarBtn.onclick = () => window.location.href = './3DatosCargados.html';

        } catch (error) {
            console.error("Error al procesar o guardar el archivo:", error);
            mensaje.textContent = `Error: ${error.message}. Verifica la consola para más detalles. ❌`;
        } finally {
            cargarBtn.disabled = false; // Volver a habilitar el botón de cargar
        }
    }
});