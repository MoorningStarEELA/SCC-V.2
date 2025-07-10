// --- CONFIGURACIÓN DE INDEXEDDB ---
const DB_NAME = 'SCC_DataDB'; // Renombrado para ser más específico
const DB_VERSION = 1;
//Nombre de las pestanas o de las hojas de calculo, OJO: tiene que coincidir el nombre, DE MANERA PRECISA
const STORE_DEMANDA = 'Demanda';
const STORE_CAPACIDAD = 'Calculo de capacidad B5'; 
const STORE_FORM_ADICIONAL = 'formularioAdicional'; // Para los datos del formulario 

// Esta función abre la base de datos y crea los Object Stores si no existen.
function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            console.log("onupgradeneeded: Creando o actualizando la base de datos...");
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_DEMANDA)) {
                db.createObjectStore(STORE_DEMANDA, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_DEMANDA}' creado.`);
            }

            if (!db.objectStoreNames.contains(STORE_CAPACIDAD)) {
                db.createObjectStore(STORE_CAPACIDAD, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_CAPACIDAD}' creado.`);
            }

            if (!db.objectStoreNames.contains(STORE_FORM_ADICIONAL)) {
                db.createObjectStore(STORE_FORM_ADICIONAL, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_FORM_ADICIONAL}' creado.`);
            }
        };

        request.onsuccess = (event) => {
            console.log("IndexedDB abierta exitosamente.");
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("Error al abrir IndexedDB:", event.target.errorCode, event.target.error);
            reject(event.target.error);
        };
    });
}

// Guarda un array de objetos en un Object Store específico
async function addDataToIndexedDB(storeName, dataArray) {
    const db = await openDb();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    //Limpiar la tabla antes de añadir nuevos datos (útil para que no se dupliquen al recargar/reprocesar)
    // Descomenta si quieres que cada carga de Excel o formulario sobrescriba lo anterior en esa tabla.
    await new Promise((res, rej) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => res();
        clearReq.onerror = (e) => rej(e);
     });

    // Añadir los nuevos datos
    for (const record of dataArray) {
        // Asegúrate de que cada registro sea un objeto válido y tenga un id si keyPath no es autoIncrement.
        // Como 'id' es autoIncrement, IndexedDB lo generará si no está presente.
        store.add(record);
    }

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
            console.log(`Se han añadido ${dataArray.length} registros a la tienda '${storeName}'.`);
            resolve();
        };

        transaction.onerror = (event) => {
            console.error(`Error en la transacción para la tienda '${storeName}':`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Obtiene todos los datos de un Object Store específico
async function getAllDataFromIndexedDB(storeName) {
    const db = await openDb();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            console.error(`Error al obtener datos de la tienda '${storeName}':`, event.target.error);
            reject(event.target.error);
        };
    });
}

// Función auxiliar para leer un archivo como ArrayBuffer, necesario para SheetJS
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Procesa una hoja de Excel y la convierte en un array de objetos.
 * Permite seleccionar columnas específicas.
 * @param {object} worksheet - El objeto de la hoja de SheetJS.
 * @param {string[]} [columnsToExtract] - Array de nombres de columnas a extraer.
 * Si es nulo o vacío, extrae todas.
 * @returns {Array<object>} - Array de objetos con los datos de la hoja.
 */
function processSheet(worksheet, columnsToExtract = null) {
    // raw: true para obtener los valores crudos, sin formato de Excel (fechas como números, etc.)
    // defval: '' para que celdas vacías sean cadenas vacías en lugar de undefined
    let parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: '' });

    if (parsedData.length === 0) {
        return [];
    }

    const headers = parsedData[0].map(h => h ? h.toString().trim() : ''); // Limpiar encabezados
    const rows = parsedData.slice(1);
    const result = [];

    rows.forEach(row => {
        const obj = {};
        let isEmptyRow = true; // Para verificar si la fila está completamente vacía

        headers.forEach((header, index) => {
            const value = row[index];
            // Solo incluye las columnas si columnsToExtract es null (todas) o si el encabezado está en la lista
            if (!columnsToExtract || columnsToExtract.includes(header)) {
                obj[header] = value;
                if (value !== null && value !== undefined && value !== '') {
                    isEmptyRow = false; // La fila no está vacía si tiene al menos un valor
                }
            }
        });
        // Solo añadir filas que no estén completamente vacías
        if (!isEmptyRow) {
            result.push(obj);
        }
    });
    return result;
}
// Exportar las funciones para que estén disponibles globalmente
window.openDb = openDb;
window.addDataToIndexedDB = addDataToIndexedDB;
window.getAllDataFromIndexedDB = getAllDataFromIndexedDB;
window.readFileAsArrayBuffer = readFileAsArrayBuffer;
window.processSheet = processSheet;
window.STORE_DEMANDA = STORE_DEMANDA;
window.STORE_CAPACIDAD = STORE_CAPACIDAD;
window.STORE_FORM_ADICIONAL = STORE_FORM_ADICIONAL;