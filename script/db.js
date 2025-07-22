// --- CONFIGURACIÓN DE INDEXEDDB ---
const DB_NAME = 'SCC_DataDB';
const DB_VERSION = 1;
const STORE_DEMANDA = 'Demanda';
const STORE_CAPACIDAD = 'Calculo de capacidad B5'; 
const STORE_FORM_ADICIONAL = 'formularioAdicional';

// Abre la base de datos
function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_DEMANDA)) {
                db.createObjectStore(STORE_DEMANDA, { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains(STORE_CAPACIDAD)) {
                db.createObjectStore(STORE_CAPACIDAD, { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains(STORE_FORM_ADICIONAL)) {
                db.createObjectStore(STORE_FORM_ADICIONAL, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Guarda datos en IndexedDB
async function addDataToIndexedDB(storeName, dataArray) {
    const db = await openDb();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Limpiar datos existentes
    await new Promise((res, rej) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => res();
        clearReq.onerror = (e) => rej(e);
    });
    
    // Añadir nuevos datos
    for (const record of dataArray) {
        store.add(record);
    }
    
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);
    });
}

// Obtiene todos los datos de un store
async function getAllDataFromIndexedDB(storeName) {
    const db = await openDb();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Lee un archivo como ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

// Procesa una hoja de Excel
// Añadimos startRow y startCol para definir el inicio de la tabla de datos (incluyendo encabezados)
function processSheet(worksheet, columnsToExtract = null, startRow = 1, startCol = 0) { // startRow y startCol son 0-indexed
    // Decodificar el rango actual de la hoja
    const currentRange = XLSX.utils.decode_range(worksheet['!ref']);

    // Definir el nuevo rango de inicio para la lectura
    // startRow es la fila donde están los encabezados (0-indexed)
    // startCol es la columna donde empiezan los encabezados relevantes (0-indexed)
    const newRange = {
        s: { r: startRow, c: startCol }, // Fila y columna de inicio (0-indexed)
        e: currentRange.e // Fila y columna de fin (mantener el final original de la hoja)
    };

    const parseData = XLSX.utils.sheet_to_json(worksheet, {
        range: XLSX.utils.encode_range(newRange), // Usar el rango codificado
        header: 1, // Usar la primera fila del rango especificado como encabezados
        defval: '' 
    });

    if(columnsToExtract && columnsToExtract.length > 0){
        return parseData.map (row => {
            const filtered = {};
            columnsToExtract.forEach(col => {
                filtered[col] = row[col] ?? '';
            });
            return filtered;
        });
    }
    return parseData;
}

// Limpia un object store
function clearObjectStore(storeName) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDb();
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        } catch (error) {
            reject(error);
        }
    });
}

// Exportar funciones
window.openDb = openDb;
window.addDataToIndexedDB = addDataToIndexedDB;
window.getAllDataFromIndexedDB = getAllDataFromIndexedDB;
window.readFileAsArrayBuffer = readFileAsArrayBuffer;
window.processSheet = processSheet;
window.clearObjectStore = clearObjectStore;
window.STORE_DEMANDA = STORE_DEMANDA;
window.STORE_CAPACIDAD = STORE_CAPACIDAD;
window.STORE_FORM_ADICIONAL = STORE_FORM_ADICIONAL;
