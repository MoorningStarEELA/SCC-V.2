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

            // --- Procesar Pestaña "demanda" ---
            const demandaSheetName = 'Demanda';
            if (workbook.SheetNames.includes(demandaSheetName)) {
                const worksheet = workbook.Sheets[demandaSheetName];
                // Aqui se va a leer toda la hoja de cálculo Demanda
                demandaData = window.processSheet(worksheet);
                console.log("Datos de la pestaña 'Demanda' extraídos:", demandaData);
            } else {
                console.warn(`La pestaña '${demandaSheetName}' no fue encontrada.`);
                mensaje.textContent = `Advertencia: La pestaña '${demandaSheetName}' no fue encontrada.`;
            }

            // --- Procesar Pestaña "capacidad" ---
            const capacidadSheetName = 'Calculo de capacidad B5';
            if (workbook.SheetNames.includes(capacidadSheetName)) {
                const worksheet = workbook.Sheets[capacidadSheetName];
                const columnsToExtract =[ 
                'Separación (In)',
                'Largo + Separación (in)',
                'Velocidad de Conyedor(ft/min)',
                'Array',
                'UPH Real'
                ];
                capacidadData = window.processSheet(worksheet, columnsToExtract);
                console.log("Datos de la pestaña 'Calculo de capacidad B5' extraídos:", capacidadData);
                
                if(capacidadData.length > 0) {
                    capacidadData.forEach(row => {
                    
                        const LargoSeparacionIn = parseFloat(row['Largo + Separación (in)']);
                        const VelocidadConyedorFtMin = parseFloat(row['Velocidad de Conyedor']);
                        const arrayValue = parseFloat(row['Array']);
                        // Calculo 1 Largo +  Separación (ft)
                        if(!isNaN(LargoSeparacionIn)){
                            row['Largo +  Separación (ft)'] = LargoSeparacionIn / 12 ;
                        } else {
                            row[ 'Largo +  Separación (ft)'] = 0 ;
                        }

                        //Calculo 2 Tiempo (min)
                        const LargoSeparacionFT = row['Largo + Separación (ft)'];
                        if(!isNaN(LargoSeparacionFT) && !isNaN(VelocidadConyedorFtMin) && VelocidadConyedorFtMin !== 0){
                            row['Tiempo (t) min'] = LargoSeparacionFT / VelocidadConyedorFtMin ;
                            
                        }else{
                            row['Tiempo (t) min'] = 0 ;
                        }

                        //Calculo 3  tiempo (seg)
                        const TiempoMin = row['Tiempo (t) min'];
                        if(!isNaN(TiempoMin)){
                            row['Tiempo (t) seg'] = TiempoMin * 60 ;
                        }
                        //Calculo 4 Pallet * Hora
                        const TiempoSeg = row['Tiempo (t) seg'];
                        if(!isNaN(TiempoSeg) && TiempoSeg !== 0){
                            row['Pallet * Hora'] =  3600 / TiempoSeg;
                        } else{
                            row['Pallet * Hora'] = 0 ; }
                        
                        // Calculo 5 UPH 100
                        const PalletPorHora = row['Pallet * Hora'];
                        if(isNaN(PalletPorHora) && !isNaN(arrayValue) && arrayValue !== 0){
                            row['UPH 100'] = PalletPorHora * arrayValue ;
                        }else{
                            row['UPH 100'] = 0 ;
                        }
                    }
                );
                }

                console.warn(`La pestaña '${capacidadSheetName}' no fue encontrada.`);
                if (!mensaje.textContent.includes('Advertencia')) {
                     mensaje.textContent += ` Advertencia: La pestaña '${capacidadSheetName}' no fue encontrada.`;
                }
            } else{
                console.warn(`La pestaña '${capacidadSheetName}' no fue encontrada.`);
                if(!mensaje.textContent.includes('Advertencia')){
                    mensaje.textContent += ` Advertencia: La pestaña '${capacidadSheetName}'no fue encontrada.`;
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
                console.warn("No hay datos para guardar  'Calculo de capacidad B5'.");
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