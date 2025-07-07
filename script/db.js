const DB_NAME = 'SCC- DB';
const DB_VER = 1;
const STORE_DEMANDA = 'DemandasDT';
const STORE_CAPACIDAD = 'Capacidad';
const STORE_FORM = 'Formulario';

//Esta funcion abre la db y crea los objects stores si no existen
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

async function addDataToIndexedDB(storeName, dataArray){
    const db = await openDb();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);


    // Funcion para borrar todos los datos de la base de datos y que se sobreescriban
    await new Promise ((res,rej) => {
        const clearReq = store.clear();
        clearReq.onsuccess = res();
        clearReq.onerror = (e) => rej(e);
    });
}


window.openDb = openDb;
window.addDataToIndexedDB = addDataToIndexedDB;
window.getAllDataFromIndexedDB = getAllDataFromIndexedDB;
window.readFileAsArrayBuffer = readFileAsArrayBuffer;
window.processSheet = processSheet;
window.STORE_DEMANDA = STORE_DEMANDA;
window.STORE_CAPACIDAD = STORE_CAPACIDAD;
window.STORE_FORM_ADICIONAL = STORE_FORM_ADICIONAL;