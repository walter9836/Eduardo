import { defineStore } from 'pinia';
import axios from 'axios';
import { openDB } from 'idb';

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_WC_CONSUMER_KEY;
const API_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET;

const dbPromise = openDB('storeDB', 2, {
  upgrade(db, oldVersion, newVersion, transaction) {
    if (oldVersion < 1) {
      db.createObjectStore('productsByCategory');
    }
    if (oldVersion < 2) {
      db.createObjectStore('products', { keyPath: 'id' });
      db.createObjectStore('searchResults');
    }
  },
});

export const useStore = defineStore('mainStore', {
  state: () => ({
    products: [],
    categories: [],
    loading: false,
    lastFetch: 0,
    isPreloaded: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalProducts: 0,
  }),

  actions: {
    async fetchCategoryBySlug(slug, forceRefresh = false) {
      console.log(`🟢 Intentando cargar categoría '${slug}'...`);
      const cacheKey = `category_${slug}`;
      const cached = localStorage.getItem(cacheKey);

      if (!forceRefresh && cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.slug === slug) {
          console.log(`⚡ Categoría '${slug}' desde localStorage`);
          if (!this.categories.some(cat => cat.slug === slug)) {
            this.categories = this.categories.concat(parsed);
          }
          return parsed;
        }
      }

      this.loading = true;
      try {
        const response = await axios.get(`${API_URL}/products/categories`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, slug, per_page: 1 },
        });

        const data = response.data || [];
        if (!Array.isArray(data) || !data.length) {
          throw new Error(`No se encontró la categoría '${slug}' en la API`);
        }

        const category = {
          id: data[0].id,
          name: data[0].name,
          slug: data[0].slug,
          image: data[0].image ? data[0].image.src : '/placeholder.jpg',
        };

        this.categories = this.categories.filter(cat => cat.slug !== slug).concat(category);
        localStorage.setItem(cacheKey, JSON.stringify(category));
        console.log(`✅ Categoría '${slug}' cargada:`, category);
        return category;
      } catch (error) {
        console.error(`❌ Error al obtener categoría '${slug}':`, error.message);
        this.error = error.message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchProductsByCategory(categorySlug, page = 1, forceRefresh = false) {
      try {
        const category = await this.fetchCategoryBySlug(categorySlug);
        if (!category) throw new Error(`No se encontró la categoría '${categorySlug}'`);

        this.loading = true;
        this.currentPage = parseInt(page) || 1;
        const cacheKey = `products_${categorySlug}_page_${this.currentPage}`;

        const sessionCached = sessionStorage.getItem(cacheKey);
        if (!forceRefresh && sessionCached) {
          const parsed = JSON.parse(sessionCached);
          if (Array.isArray(parsed) && parsed.length) {
            console.log(`⚡ Productos de '${categorySlug}' página ${this.currentPage} desde sessionStorage`);
            this.products = parsed;
            this.totalProducts = parseInt(sessionStorage.getItem(`total_${categorySlug}`) || 0);
            this.totalPages = parseInt(sessionStorage.getItem(`totalPages_${categorySlug}`) || 0);
            this.loading = false;
            return {
              products: parsed,
              total: this.totalProducts,
              totalPages: this.totalPages,
              currentPage: this.currentPage,
            };
          }
        }

        const db = await dbPromise;
        const indexedCached = await db.get('productsByCategory', cacheKey);
        if (!forceRefresh && indexedCached) {
          console.log(`⚡ Productos de '${categorySlug}' página ${this.currentPage} desde IndexedDB`);
          this.products = indexedCached.products;
          this.totalProducts = indexedCached.total;
          this.totalPages = indexedCached.totalPages;
          sessionStorage.setItem(cacheKey, JSON.stringify(indexedCached.products));
          sessionStorage.setItem(`total_${categorySlug}`, indexedCached.total.toString());
          sessionStorage.setItem(`totalPages_${categorySlug}`, indexedCached.totalPages.toString());
          this.loading = false;
          return {
            products: indexedCached.products,
            total: indexedCached.total,
            totalPages: indexedCached.totalPages,
            currentPage: this.currentPage,
          };
        }

        const params = {
          category: category.id.toString(),
          per_page: '20',
          page: this.currentPage.toString(),
          consumer_key: API_KEY,
          consumer_secret: API_SECRET,
          orderby: 'date',
          order: 'desc',
        };

        const response = await axios.get(`${API_URL}/products`, { params });
        const total = parseInt(response.headers['x-wp-total'] || 0);
        const totalPages = parseInt(response.headers['x-wp-totalpages'] || 0);

        const newProducts = (response.data || []).map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.src || '/placeholder.jpg',
          thumbnail: product.images?.[0]?.thumbnail || product.images?.[0]?.src || '/placeholder.jpg',
          slug: product.slug || `producto-${product.id}`,
          description: product.description,
          categories: product.categories?.map(cat => cat.slug) || [],
          attributes: product.attributes?.map(attr => ({
            name: attr.name,
            options: attr.options || [],
          })) || [],
          type: 'product',
        }));

        const tx = db.transaction(['products', 'productsByCategory'], 'readwrite');
        await Promise.all(newProducts.map(product => tx.objectStore('products').put(product)));
        await tx.objectStore('productsByCategory').put({ products: newProducts, total, totalPages, cachedAt: Date.now() }, cacheKey);
        await tx.done;

        sessionStorage.setItem(cacheKey, JSON.stringify(newProducts));
        sessionStorage.setItem(`total_${categorySlug}`, total.toString());
        sessionStorage.setItem(`totalPages_${categorySlug}`, totalPages.toString());

        this.products = newProducts;
        this.totalProducts = total;
        this.totalPages = totalPages;

        console.log(`✅ Página ${this.currentPage} cargada con ${newProducts.length} productos`);
        return {
          products: newProducts,
          total,
          totalPages,
          currentPage: this.currentPage,
        };
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        this.error = error.message;
        return {
          products: [],
          total: 0,
          totalPages: 0,
          currentPage: this.currentPage,
          error: error.message,
        };
      } finally {
        this.loading = false;
      }
    },

    async fetchProductBySlug(slug, forceRefresh = false) {
      console.log(`🟢 Intentando cargar producto '${slug}'...`);
      const cacheKey = `product_${slug}`;
      const cached = localStorage.getItem(cacheKey);

      if (!forceRefresh && cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.slug === slug) {
          console.log(`⚡ Producto '${slug}' desde localStorage`);
          if (!this.products.some(p => p.slug === slug)) {
            this.products = this.products.concat(parsed);
          }
          return parsed;
        }
      }

      this.loading = true;
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, slug, per_page: 1 },
        });

        const data = response.data || [];
        if (!Array.isArray(data) || !data.length) {
          throw new Error(`No se encontró el producto '${slug}' en la API`);
        }

        const product = {
          id: data[0].id,
          name: data[0].name,
          price: data[0].price,
          image: data[0].images?.[0]?.src || '/placeholder.jpg',
          slug: data[0].slug || `producto-${data[0].id}`,
          description: data[0].description,
          categories: data[0].categories?.map(cat => cat.slug) || [],
          attributes: data[0].attributes?.map(attr => ({
            name: attr.name,
            options: attr.options || [],
          })) || [],
          type: 'product',
        };

        const db = await dbPromise;
        await db.put('products', product);

        localStorage.setItem(cacheKey, JSON.stringify(product));
        if (!this.products.some(p => p.slug === slug)) {
          this.products = this.products.concat(product);
        }
        console.log(`✅ Producto '${slug}' cargado:`, product);
        return product;
      } catch (error) {
        console.error(`❌ Error al obtener producto '${slug}':`, error.message);
        this.error = error.message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async preloadInitialData(forceRefresh = false) {
      const cacheKeyCategories = 'categories_minimal';
      const cacheKeyProducts = 'initial_products';
      const cachedCategories = localStorage.getItem(cacheKeyCategories);
      const db = await dbPromise;
      const cachedProducts = await db.get('productsByCategory', cacheKeyProducts);

      // Si hay caché y no se fuerza la recarga, usar datos locales
      if (!forceRefresh && cachedCategories && cachedProducts) {
        const parsedCategories = JSON.parse(cachedCategories);
        if (Array.isArray(parsedCategories) && parsedCategories.length) {
          this.categories = parsedCategories;
          console.log(`⚡ ${parsedCategories.length} categorías mínimas desde localStorage`);
        }
        if (cachedProducts && cachedProducts.products.length) {
          this.products = cachedProducts.products;
          console.log(`⚡ ${cachedProducts.products.length} productos iniciales desde IndexedDB`);
        }
        if (this.categories.length && this.products.length) {
          this.isPreloaded = true;
          return;
        }
      }

      this.loading = true;
      try {
        // Cargar solo categorías principales (per_page reducido)
        const categoryResponse = await axios.get(`${API_URL}/products/categories`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, per_page: 20, hide_empty: true },
        });

        const categoryData = categoryResponse.data || [];
        if (!Array.isArray(categoryData)) throw new Error("Formato inválido de categorías");

        const minimalCategories = categoryData.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        }));

        this.categories = minimalCategories;
        localStorage.setItem(cacheKeyCategories, JSON.stringify(minimalCategories));
        console.log(`✅ ${minimalCategories.length} categorías mínimas cargadas`);

        // Cargar pocos productos iniciales
        const productResponse = await axios.get(`${API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, per_page: 5, orderby: 'date', order: 'desc' },
        });

        const productData = productResponse.data || [];
        if (!Array.isArray(productData)) throw new Error("Formato inválido de productos");

        const initialProducts = productData.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.src || '/placeholder.jpg',
          slug: product.slug || `producto-${product.id}`,
          description: product.description,
          categories: product.categories?.map(cat => cat.slug) || [],
          attributes: product.attributes?.map(attr => ({
            name: attr.name,
            options: attr.options || [],
          })) || [],
          type: 'product',
        }));

        const tx = db.transaction(['products', 'productsByCategory'], 'readwrite');
        await Promise.all(initialProducts.map(product => tx.objectStore('products').put(product)));
        await tx.objectStore('productsByCategory').put({ products: initialProducts, cachedAt: Date.now() }, cacheKeyProducts);
        await tx.done;

        this.products = initialProducts;
        console.log(`✅ ${initialProducts.length} productos iniciales precargados`);
        this.isPreloaded = true;
      } catch (error) {
        console.error("❌ Error al precargar datos iniciales:", error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchCategoriesMinimal(forceRefresh = false) {
      const cacheKey = 'categories_minimal';
      const cached = localStorage.getItem(cacheKey);

      if (!forceRefresh && cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          console.log("⚡ Categorías mínimas desde localStorage");
          this.categories = parsed;
          return parsed;
        }
      }

      this.loading = true;
      try {
        const response = await axios.get(`${API_URL}/products/categories`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, per_page: 100, hide_empty: true },
        });

        const data = response.data || [];
        if (!Array.isArray(data)) throw new Error("Formato inválido");

        const minimalCategories = data.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        }));

        this.categories = minimalCategories;
        localStorage.setItem(cacheKey, JSON.stringify(minimalCategories));
        console.log(`✅ ${minimalCategories.length} categorías mínimas cargadas`);
        return minimalCategories;
      } catch (error) {
        console.error("❌ Error al obtener categorías mínimas:", error);
        this.error = error.message;
        this.categories = [];
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchRelatedProducts(categorySlug, forceRefresh = false) {
      console.log(`🟢 Intentando cargar productos relacionados para '${categorySlug}'...`);
      const cacheKey = `related_${categorySlug}`;
      const cached = localStorage.getItem(cacheKey);

      if (!forceRefresh && cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          console.log(`⚡ Productos relacionados de '${categorySlug}' desde localStorage:`, parsed.length);
          return parsed;
        }
      }

      const category = await this.fetchCategoryBySlug(categorySlug, forceRefresh);
      if (!category) {
        console.error(`❌ No se pudo cargar productos relacionados porque la categoría '${categorySlug}' no existe`);
        return [];
      }

      this.loading = true;
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, category: category.id, per_page: 10 },
        });

        const data = response.data || [];
        if (!Array.isArray(data)) throw new Error("Formato inválido");

        const products = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.src || '/placeholder.jpg',
          slug: product.slug || `producto-${product.id}`,
          description: product.description,
          categories: product.categories?.map(cat => cat.slug) || [],
          attributes: product.attributes?.map(attr => ({
            name: attr.name,
            options: attr.options || [],
          })) || [],
          type: 'product',
        }));

        const db = await dbPromise;
        await Promise.all(products.map(product => db.put('products', product)));

        localStorage.setItem(cacheKey, JSON.stringify(products));
        console.log(`✅ ${products.length} productos relacionados cargados para '${categorySlug}':`, products);
        return products;
      } catch (error) {
        console.error(`❌ Error al obtener productos relacionados de '${categorySlug}':`, error.message);
        this.error = error.message;
        return [];
      } finally {
        this.loading = false;
      }
    },

    getProductsByCategory(categorySlug) {
      return this.products.filter(p => p.categories.includes(categorySlug));
    },

    clearState() {
      this.products = [];
      this.loading = false;
      this.error = null;
      this.currentPage = 1;
      this.totalPages = 0;
      this.totalProducts = 0;
      console.log('🧹 Estado del store limpiado');
    },
  },
});