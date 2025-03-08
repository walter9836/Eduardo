import { openDB } from 'idb';

const DB_NAME = "WooCommerceStore";
const PRODUCT_STORE = "products";
const IMAGE_STORE = "product_images";

const dbPromise = openDB(DB_NAME, 3, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const productStore = db.createObjectStore(PRODUCT_STORE, { keyPath: "id" });
      productStore.createIndex("slug", "slug", { unique: true });
    }
    if (oldVersion < 2) {
      const imageStore = db.createObjectStore(IMAGE_STORE, { keyPath: "slug" });
      imageStore.createIndex("image", "image");
    }
    if (oldVersion < 3) {
      db.createObjectStore("preload_images", { keyPath: "slug" });
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

export async function saveToIndexedDB(key, value) {
  const serializableValue = toSerializable(value);
  if (!isSerializable(serializableValue)) {
    console.error(`❌ El valor no es serializable para clave: ${key}`);
    return false;
  }

  try {
    const db = await dbPromise;
    const tx = db.transaction([PRODUCT_STORE, IMAGE_STORE], 'readwrite');
    const productStore = tx.objectStore(PRODUCT_STORE);
    const imageStore = tx.objectStore(IMAGE_STORE);

    await productStore.put({ ...serializableValue, id: serializableValue.id || key });
    if (serializableValue.image) {
      await imageStore.put({ slug: key, image: serializableValue.image });
      localStorage.setItem(`image_${key}`, serializableValue.image);
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error(`❌ Error al guardar en IndexedDB (${key}):`, error);
    return false;
  }
}

export async function getFromIndexedDB(key) {
  const timerId = `getFromIndexedDB_${key}_${Math.random().toString(36).substr(2, 9)}`; // Identificador único
  try {
    console.time(timerId);
    const db = await dbPromise;
    const tx = db.transaction([PRODUCT_STORE, IMAGE_STORE], 'readonly');
    const productStore = tx.objectStore(PRODUCT_STORE);
    const imageStore = tx.objectStore(IMAGE_STORE);

    const cachedProduct = await productStore.get(key);
    if (cachedProduct) {
      console.timeEnd(timerId);
      return cachedProduct;
    }

    const cachedImage = localStorage.getItem(`image_${key}`) || (await imageStore.get(key))?.image;
    if (cachedImage) {
      console.timeEnd(timerId);
      return {
        slug: key,
        image: cachedImage,
        name: 'Cargando...',
        price: '0.00',
        description: '',
        attributes: [],
        categories: [],
        id: null,
        yoastMeta: {},
      };
    }

    console.timeEnd(timerId);
    return null;
  } catch (error) {
    console.error(`❌ Error al obtener datos de IndexedDB (${key}):`, error);
    console.timeEnd(timerId); // Cerrar temporizador incluso en caso de error
    return null;
  }
}

export async function getImageFromIndexedDB(key) {
  try {
    const cachedImage = localStorage.getItem(`image_${key}`);
    if (cachedImage) {
      console.log(`⚡ Imagen '${key}' devuelta desde localStorage`);
      return cachedImage;
    }
    const timerId = `getImageFromIndexedDB_${key}_${Math.random().toString(36).substr(2, 9)}`;
    console.time(timerId);
    const db = await dbPromise;
    const imageStore = db.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE);
    const cachedImageDB = await imageStore.get(key);
    console.timeEnd(timerId);
    return cachedImageDB?.image || null;
  } catch (error) {
    console.error(`❌ Error al obtener imagen de IndexedDB (${key}):`, error);
    return null;
  }
}

export async function preloadImages(images) {
  try {
    const db = await dbPromise;
    const tx = db.transaction([IMAGE_STORE, "preload_images"], 'readwrite');
    const imageStore = tx.objectStore(IMAGE_STORE);
    const preloadStore = tx.objectStore("preload_images");

    for (const { slug, image } of images) {
      if (image && isSerializable(image)) {
        await imageStore.put({ slug, image });
        await preloadStore.put({ slug, image });
        localStorage.setItem(`image_${slug}`, image);
      }
    }

    await tx.done;
    console.log(`✅ Imágenes pre-cargadas en IndexedDB y localStorage`);
  } catch (error) {
    console.error(`❌ Error al pre-cargar imágenes en IndexedDB:`, error);
  }
}

export async function getPreloadedImage(key) {
  try {
    const cachedImage = localStorage.getItem(`image_${key}`);
    if (cachedImage) {
      console.log(`⚡ Imagen pre-cargada '${key}' desde localStorage`);
      return cachedImage;
    }
    const timerId = `getPreloadedImage_${key}_${Math.random().toString(36).substr(2, 9)}`;
    console.time(timerId);
    const db = await dbPromise;
    const preloadStore = db.transaction("preload_images", 'readonly').objectStore("preload_images");
    const cachedImageDB = await preloadStore.get(key);
    console.timeEnd(timerId);
    return cachedImageDB?.image || null;
  } catch (error) {
    console.error(`❌ Error al obtener imagen pre-cargada de IndexedDB (${key}):`, error);
    return null;
  }
}