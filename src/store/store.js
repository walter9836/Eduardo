import { defineStore } from 'pinia';
import axios from 'axios';
import { saveToIndexedDB, getFromIndexedDB } from '../utils/indexedDB';

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_WC_CONSUMER_KEY;
const API_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET;

export const useStore = defineStore('mainStore', {
  state: () => ({
    products: [],
    categories: [],
    loading: false,
    lastFetch: 0,
  }),

  actions: {
    // 🔹 Obtener todas las categorías con caché en IndexedDB y sessionStorage
    async fetchCategories(forceRefresh = false) {
      console.log("🟢 Cargando categorías...");

      if (!forceRefresh) {
        const cachedCategories = sessionStorage.getItem('categories');
        if (cachedCategories) {
          this.categories = JSON.parse(cachedCategories);
          console.log("⚡ Categorías obtenidas desde sessionStorage.");
          return;
        }
      }

      if (!forceRefresh) {
        const cachedCategories = await getFromIndexedDB('categories');
        if (cachedCategories) {
          this.categories = cachedCategories;
          sessionStorage.setItem('categories', JSON.stringify(cachedCategories));
          return;
        }
      }

      this.loading = true;
      try {
        const { data } = await axios.get(`${API_URL}/products/categories`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, per_page: 100 },
        });

        this.categories = data.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          image: category.image ? category.image.src : '/placeholder.jpg',
        }));

        if (this.categories.length) {
          await saveToIndexedDB('categories', this.categories);
          sessionStorage.setItem('categories', JSON.stringify(this.categories));
          console.log("✅ Categorías guardadas en IndexedDB y sessionStorage.");
        }
      } catch (error) {
        console.error("❌ Error al obtener categorías:", error);
      } finally {
        this.loading = false;
      }
    },

    // 🔹 Obtener todos los productos con caché
    async fetchAllProducts(forceRefresh = false) {
      console.log("🟢 Cargando todos los productos...");

      if (!forceRefresh) {
        const cachedProducts = sessionStorage.getItem('products');
        if (cachedProducts) {
          console.log("⚡ Productos obtenidos desde sessionStorage.");
          this.products = JSON.parse(cachedProducts);
          return this.products;
        }
      }

      if (!forceRefresh) {
        const cachedProducts = await getFromIndexedDB('products');
        if (cachedProducts) {
          sessionStorage.setItem('products', JSON.stringify(cachedProducts));
          this.products = cachedProducts;
          return cachedProducts;
        }
      }

      this.loading = true;
      try {
        const { data } = await axios.get(`${API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, per_page: 100 },
        });

        this.products = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.src || '/placeholder.jpg',
          slug: product.slug || `producto-${product.id}`,
          description: product.description,
          categories: product.categories.map(cat => cat.slug),
        }));

        if (this.products.length) {
          await saveToIndexedDB('products', this.products);
          sessionStorage.setItem('products', JSON.stringify(this.products));
          console.log("✅ Productos guardados en IndexedDB y sessionStorage.");
        }

        return this.products;
      } catch (error) {
        console.error("❌ Error al obtener productos:", error);
        return [];
      } finally {
        this.loading = false;
      }
    },

    // 🔹 Obtener productos de una categoría específica
    async fetchProductsByCategory(categorySlug, forceRefresh = false) {
      console.log(`🟢 Cargando productos para la categoría '${categorySlug}'`);

      if (!forceRefresh) {
        const cachedProducts = await getFromIndexedDB(categorySlug);
        if (cachedProducts) {
          console.log(`⚡ Productos de '${categorySlug}' obtenidos desde IndexedDB.`);
          return cachedProducts;
        }
      }

      const category = this.categories.find(cat => cat.slug === categorySlug);
      if (!category) {
        console.error(`❌ No se encontró la categoría con slug: '${categorySlug}'`);
        return [];
      }

      this.loading = true;
      try {
        const { data } = await axios.get(`${API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, category: category.id, per_page: 50 },
        });

        const products = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.src || '/placeholder.jpg',
          slug: product.slug || `producto-${product.id}`,
          description: product.description,
          categories: product.categories.map(cat => cat.slug),
        }));

        await saveToIndexedDB(categorySlug, products);
        console.log(`✅ Productos de '${categorySlug}' guardados en IndexedDB.`);
        return products;
      } catch (error) {
        console.error(`❌ Error al obtener productos de '${categorySlug}':`, error);
        return [];
      } finally {
        this.loading = false;
      }
    },

    // 🔹 Obtener un producto por Slug
    async fetchProductBySlug(slug) {
      console.log(`🟢 Buscando producto con slug: ${slug}`);

      if (this.products.length === 0) {
        await this.fetchAllProducts();
      }
      const cachedProduct = this.products.find(product => product.slug === slug);
      if (cachedProduct) {
        console.log("⚡ Producto obtenido de memoria.");
        return cachedProduct;
      }

      const indexedProduct = await getFromIndexedDB(`product_${slug}`);
      if (indexedProduct) {
        console.log(`⚡ Producto '${slug}' obtenido desde IndexedDB.`);
        return indexedProduct;
      }

      this.loading = true;
      try {
        const { data } = await axios.get(`${API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, slug },
        });

        if (data.length > 0) {
          const product = {
            id: data[0].id,
            name: data[0].name,
            price: data[0].price,
            image: data[0].images?.[0]?.src || '/placeholder.jpg',
            slug: data[0].slug,
            description: data[0].description,
            categories: data[0].categories.map(cat => cat.slug),
          };

          await saveToIndexedDB(`product_${slug}`, product);
          console.log(`✅ Producto '${slug}' guardado en IndexedDB.`);
          return product;
        }
      } catch (error) {
        console.error(`❌ Error al obtener producto con slug: '${slug}':`, error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // 🔹 Obtener productos relacionados por categoría
    async fetchRelatedProducts(categorySlug) {
      console.log(`🟢 Cargando productos relacionados para la categoría '${categorySlug}'`);

      if (this.products.length === 0) {
        await this.fetchAllProducts();
      }
      const related = this.products.filter(product => product.categories.includes(categorySlug)).slice(0, 4);
      if (related.length > 0) {
        console.log("⚡ Productos relacionados obtenidos de memoria.");
        return related;
      }

      const indexedRelated = await getFromIndexedDB(`related_${categorySlug}`);
      if (indexedRelated) {
        console.log(`⚡ Productos relacionados de '${categorySlug}' obtenidos desde IndexedDB.`);
        return indexedRelated;
      }

      return [];
    },
  },
});
