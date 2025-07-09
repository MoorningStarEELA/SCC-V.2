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
                // Asume que la hoja de demanda contiene todas las columnas relevantes
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
                // Especifica las columnas que quieres de la pestaña "capacidad"
                // Asegúrate que los nombres coincidan exactamente con los encabezados de tu Excel
                const columnsToExtract = ['Largo Pallet (In)', 'Largo + Separación (in)', 'Velocidad de Conveyor (ft/min)','Array']; // <-- ¡Ajusta estos nombres prro!
                capacidadData = window.processSheet(worksheet, columnsToExtract);
                console.log("Datos de la pestaña 'Calculo de capacidad B5' extraídos (columnas seleccionadas):", capacidadData);
            } else {
                console.warn(`La pestaña '${capacidadSheetName}' no fue encontrada.`);
                if (!mensaje.textContent.includes('Advertencia')) {
                     mensaje.textContent += ` Advertencia: La pestaña '${capacidadSheetName}' no fue encontrada.`;
                }
            }

            // --- Guardar en IndexedDB ---
            if (demandaData.length > 0) {
                await window.addDataToIndexedDB(window.STORE_DEMANDA, demandaData);
            } else {
                console.warn("No hay datos para guardar en la tienda 'demandaRecords'.");
            }

            if (capacidadData.length > 0) {
                await window.addDataToIndexedDB(window.STORE_CAPACIDAD, capacidadData);
            } else {
                console.warn("No hay datos para guardar en la tienda 'capacidadRecords'.");
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