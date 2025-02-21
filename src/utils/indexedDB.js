import { openDB } from 'idb';

const DB_NAME = "WooCommerceStore";
const STORE_NAME = "products";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

/**
 * ✅ Guarda datos en IndexedDB de manera segura
 * @param {string} key - Clave para almacenar el valor
 * @param {any} value - Valor a guardar (debe ser serializable)
 */
export async function saveToIndexedDB(key, value) {
  try {
    const db = await dbPromise;

    // ✅ Asegurarnos de que `value` es serializable
    const serializableValue = JSON.parse(JSON.stringify(value));

    await db.put(STORE_NAME, serializableValue, key);
    console.log(`✅ Datos guardados en IndexedDB: ${key}`);
  } catch (error) {
    console.error(`❌ Error al guardar en IndexedDB (${key}):`, error);
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
