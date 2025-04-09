// src/utils/indexedDB.js
import { openDB } from 'idb';

const DB_NAME = "WooCommerceStore";
const VERSION = 6; // Subimos a versión 6 para añadir popular_searches
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas

export const dbPromise = openDB(DB_NAME, VERSION, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const productStore = db.createObjectStore("products", { keyPath: "id" });
      productStore.createIndex("slug", "slug", { unique: true });
      productStore.createIndex("name", "name");
    }
    if (oldVersion < 2) {
      db.createObjectStore("product_images", { keyPath: "slug" });
    }
    if (oldVersion < 3) {
      db.createObjectStore("preload_images", { keyPath: "slug" });
    }
    if (oldVersion < 4) {
      db.createObjectStore("cart_items", { keyPath: "id" });
      db.createObjectStore("search_results", { keyPath: "cacheKey" });
    }
    if (oldVersion < 5) {
      // Añadimos el almacén usado por fetchProductsByCategory en store.js
      db.createObjectStore("productsByCategory", { keyPath: "cacheKey" });
    }
    if (oldVersion < 6) {
      // Añadimos el almacén para datos populares
      db.createObjectStore("popular_searches", { keyPath: "key" });
    }
  },
});

function isSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch (e) {
    return false;
  }
}

function toSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function saveToIndexedDB(key, value, storeName = "products") {
  const serializableValue = toSerializable(value);
  if (!isSerializable(serializableValue)) {
    console.error(`❌ Valor no serializable para clave: ${key} en ${storeName}`);
    return false;
  }
  try {
    const db = await dbPromise;
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const keyPath = store.keyPath;
    const dataToSave = {
      ...serializableValue,
      [keyPath]: serializableValue[keyPath] || key, // Usar key como fallback
      cachedAt: Date.now(),
    };
    await store.put(dataToSave);
    await tx.done;
    console.log(`✅ Guardado en ${storeName} con clave ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al guardar en ${storeName} (${key}):`, error);
    return false;
  }
}

export async function getFromIndexedDB(key, storeName = "products") {
  const timerId = `getFromIndexedDB_${key}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    console.time(timerId);
    const db = await dbPromise;
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const data = await store.get(key);
    if (data && data.cachedAt && data.cachedAt + CACHE_EXPIRATION < Date.now()) {
      await store.delete(key);
      console.log(`⚠️ Datos expirados eliminados para ${key} en ${storeName}`);
      console.timeEnd(timerId);
      return null;
    }
    console.timeEnd(timerId);
    return data || null;
  } catch (error) {
    console.error(`❌ Error al obtener de ${storeName} (${key}):`, error);
    console.timeEnd(timerId);
    return null;
  }
}

export async function saveCartToIndexedDB(cart) {
  try {
    const db = await dbPromise;
    const tx = db.transaction("cart_items", "readwrite");
    const store = tx.objectStore("cart_items");
    await Promise.all(
      cart.map(item => {
        if (!item.id || !item.price || !item.name) {
          console.warn(`⚠️ Ítem de carrito inválido:`, item);
          return Promise.resolve();
        }
        return store.put({ ...toSerializable(item), cachedAt: Date.now() });
      })
    );
    await tx.done;
    console.log(`✅ Carrito guardado con ${cart.length} ítems`);
    return true;
  } catch (error) {
    console.error("❌ Error al guardar carrito en IndexedDB:", error);
    return false;
  }
}

export async function getCartFromIndexedDB() {
  const timerId = `getCartFromIndexedDB_${Math.random().toString(36).substr(2, 9)}`;
  try {
    console.time(timerId);
    const db = await dbPromise;
    const tx = db.transaction("cart_items", "readonly");
    const store = tx.objectStore("cart_items");
    const cart = await store.getAll();
    const validCart = cart.filter(item => item.cachedAt + CACHE_EXPIRATION > Date.now());
    if (validCart.length < cart.length) {
      await saveCartToIndexedDB(validCart);
    }
    console.timeEnd(timerId);
    return validCart;
  } catch (error) {
    console.error("❌ Error al cargar carrito desde IndexedDB:", error);
    console.timeEnd(timerId);
    return [];
  }
}

export async function getImageFromIndexedDB(key, storeName = "product_images") {
  try {
    const cachedImage = localStorage.getItem(`image_${key}`);
    if (cachedImage) {
      console.log(`⚡ Imagen '${key}' desde localStorage`);
      return cachedImage;
    }
    const timerId = `getImage_${key}_${Math.random().toString(36).substr(2, 9)}`;
    console.time(timerId);
    const db = await dbPromise;
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const data = await store.get(key);
    if (data && data.cachedAt && data.cachedAt + CACHE_EXPIRATION < Date.now()) {
      await store.delete(key);
      console.log(`⚠️ Imagen expirada eliminada para ${key} en ${storeName}`);
      console.timeEnd(timerId);
      return null;
    }
    if (data?.image) localStorage.setItem(`image_${key}`, data.image);
    console.timeEnd(timerId);
    return data?.image || null;
  } catch (error) {
    console.error(`❌ Error al obtener imagen de ${storeName} (${key}):`, error);
    return null;
  }
}

export async function preloadImages(images) {
  try {
    const db = await dbPromise;
    const tx = db.transaction(["product_images", "preload_images"], "readwrite");
    const imageStore = tx.objectStore("product_images");
    const preloadStore = tx.objectStore("preload_images");
    for (const { slug, image } of images) {
      if (image && isSerializable(image)) {
        const data = { slug, image, cachedAt: Date.now() };
        await imageStore.put(data);
        await preloadStore.put(data);
        localStorage.setItem(`image_${slug}`, image);
      }
    }
    await tx.done;
    console.log(`✅ ${images.length} imágenes precargadas en IndexedDB y localStorage`);
  } catch (error) {
    console.error("❌ Error al precargar imágenes:", error);
  }
}

export async function clearExpiredData(storeName) {
  try {
    const db = await dbPromise;
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const allData = await store.getAll();
    const now = Date.now();
    const expiredKeys = allData
      .filter(item => item.cachedAt + CACHE_EXPIRATION < now)
      .map(item => item.id || item.slug || item.cacheKey);
    await Promise.all(expiredKeys.map(key => store.delete(key)));
    await tx.done;
    console.log(`🧹 ${expiredKeys.length} ítems expirados eliminados de ${storeName}`);
  } catch (error) {
    console.error(`❌ Error al limpiar ${storeName}:`, error);
  }
}

// Nueva función para limpiar todos los almacenes
export async function clearAllIndexedDB() {
  try {
    const db = await dbPromise;
    const storeNames = [
      "products",
      "product_images",
      "preload_images",
      "cart_items",
      "search_results",
      "productsByCategory",
      "popular_searches", // Añadimos el nuevo almacén
    ];
    const tx = db.transaction(storeNames, "readwrite");
    await Promise.all(storeNames.map(storeName => tx.objectStore(storeName).clear()));
    await tx.done;
    console.log('🧹 Todos los almacenes de IndexedDB han sido limpiados');
  } catch (error) {
    console.error('❌ Error al limpiar todos los almacenes de IndexedDB:', error);
  }
}