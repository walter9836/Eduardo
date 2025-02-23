import { openDB } from 'idb';

const DB_NAME = "WooCommerceStore";
const STORE_NAME = "products";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });  // Asegúrate de tener un `keyPath`
    }
  },
});

/**
 * ✅ Verifica si el valor es serializable
 * @param {any} value - Valor a verificar
 * @returns {boolean} - True si es serializable, false si no lo es
 */
function isSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * ✅ Guarda datos en IndexedDB de manera segura
 * @param {string} key - Clave para almacenar el valor
 * @param {any} value - Valor a guardar (debe ser serializable)
 * @returns {Promise<boolean>} - True si se guardó correctamente, false si hubo un error
 */
export async function saveToIndexedDB(key, value) {
  if (!isSerializable(value)) {
    console.error("❌ El valor no es serializable.");
    return false;
  }

  try {
    const db = await dbPromise;
    const serializableValue = JSON.parse(JSON.stringify(value));

    await db.put(STORE_NAME, serializableValue, key);
    console.log(`✅ Datos guardados en IndexedDB: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al guardar en IndexedDB (${key}):`, error);
    return false;
  }
}

/**
 * ✅ Obtiene datos de IndexedDB de manera segura
 * @param {string} key - Clave del valor a recuperar
 * @returns {Promise<any|null>} - Valor almacenado o `null` si no existe
 */
export async function getFromIndexedDB(key) {
  try {
    const db = await dbPromise;
    const value = await db.get(STORE_NAME, key);

    console.log(value ? `⚡ Datos obtenidos de IndexedDB: ${key}` : `⚠️ No hay datos en IndexedDB para: ${key}`);
    return value || null;
  } catch (error) {
    console.error(`❌ Error al obtener datos de IndexedDB (${key}):`, error);
    return null;
  }
}
