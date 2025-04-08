import { defineStore } from 'pinia';
import axios from 'axios';
import { openDB } from 'idb';

const WC_API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_WC_CONSUMER_KEY;
const API_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET;

if (!WC_API_URL || !API_KEY || !API_SECRET) {
  throw new Error('Faltan variables de entorno para la API de WooCommerce');
}

const dbPromise = openDB('storeDB', 2, {
  upgrade(db, oldVersion) {
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
    currentCategorySlug: null,
    currentProductSlug: null,
    loading: false,
    lastFetch: 0,
    isPreloaded: false,
    isContentReady: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalProducts: 0,
    yoastMeta: {},
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
            this.categories = [...this.categories, parsed];
          }
          this.yoastMeta[slug] = parsed.yoastMeta || {};
          this.isContentReady = true;
          return parsed;
        }
      }

      this.loading = true;
      this.isContentReady = false;
      try {
        const response = await axios.get(`${WC_API_URL}/products/categories`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, slug, per_page: 1 },
        });

        const data = response.data || [];
        if (!Array.isArray(data) || !data.length) {
          console.warn(`⚠️ Categoría '${slug}' no encontrada en la API`);
          this.error = `La categoría '${slug}' no existe.`;
          this.isContentReady = false;
          return null;
        }

        const category = {
          id: data[0].id,
          name: data[0].name,
          slug: data[0].slug,
          image: data[0].image ? data[0].image.src : '/placeholder.jpg',
          yoastMeta: data[0].yoast_meta || {},
        };

        this.categories = this.categories.filter(cat => cat.slug !== slug).concat(category);
        this.yoastMeta[slug] = category.yoastMeta;
        localStorage.setItem(cacheKey, JSON.stringify(category));
        console.log(`✅ Categoría '${slug}' cargada desde API:`, category);
        this.isContentReady = true;
        return category;
      } catch (error) {
        console.error(`❌ Error al obtener categoría '${slug}':`, error.message);
        this.error = 'Ocurrió un error al cargar la categoría.';
        this.isContentReady = false;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchProductsByCategory(categorySlug, page = 1, forceRefresh = false) {
      this.loading = true;
      this.error = null;
      this.isContentReady = false;

      if (this.currentCategorySlug !== categorySlug || this.currentPage !== page) {
        this.products = [];
        this.currentCategorySlug = categorySlug;
        this.currentProductSlug = null;
      }

      this.currentPage = parseInt(page) || 1;
      const cacheKey = `products_${categorySlug}_page_${this.currentPage}`;

      try {
        const category = await this.fetchCategoryBySlug(categorySlug, forceRefresh);
        if (!category) {
          console.warn(`⚠️ No se cargarán productos porque la categoría '${categorySlug}' no existe`);
          this.isContentReady = false;
          return { products: [], total: 0, totalPages: 0, currentPage: this.currentPage };
        }

        const sessionCached = sessionStorage.getItem(cacheKey);
        if (!forceRefresh && sessionCached) {
          const parsed = JSON.parse(sessionCached);
          if (Array.isArray(parsed) && parsed.length) {
            console.log(`⚡ Cargando desde sessionStorage para ${cacheKey}`);
            this.products = parsed;
            this.totalProducts = parseInt(sessionStorage.getItem(`total_${categorySlug}`) || 0);
            this.totalPages = parseInt(sessionStorage.getItem(`totalPages_${categorySlug}`) || 0);
            this.isContentReady = true;
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
        if (!forceRefresh && indexedCached && indexedCached.products.length) {
          console.log(`⚡ Cargando desde IndexedDB para ${cacheKey}`);
          this.products = indexedCached.products;
          this.totalProducts = indexedCached.total;
          this.totalPages = indexedCached.totalPages;
          this.currentPage = indexedCached.currentPage || 1;
          sessionStorage.setItem(cacheKey, JSON.stringify(indexedCached.products));
          sessionStorage.setItem(`total_${categorySlug}`, indexedCached.total.toString());
          sessionStorage.setItem(`totalPages_${categorySlug}`, indexedCached.totalPages.toString());
          this.isContentReady = true;
          return {
            products: indexedCached.products,
            total: indexedCached.total,
            totalPages: indexedCached.totalPages,
            currentPage: this.currentPage,
          };
        }

        console.log(`🌐 Cargando desde API para '${categorySlug}', página ${this.currentPage}`);
        const params = {
          category: category.id.toString(),
          per_page: '15',
          page: this.currentPage.toString(),
          consumer_key: API_KEY,
          consumer_secret: API_SECRET,
          orderby: 'date',
          order: 'desc',
        };

        const response = await axios.get(`${WC_API_URL}/products`, { params });
        const total = parseInt(response.headers['x-wp-total'] || 0);
        const totalPages = parseInt(response.headers['x-wp-totalpages'] || 0);

        const newProducts = (response.data || []).map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          regular_price: product.regular_price,
          sale_price: product.sale_price,
          stock_quantity: product.stock_quantity,
          stock_status: product.stock_status,
          manage_stock: product.manage_stock,
          sku: product.sku || 'N/A',
          images: product.images?.map(img => ({
            src: img.src || '/placeholder.jpg',
            thumbnail: img.thumbnail || img.src || '/placeholder.jpg',
            alt: img.alt || product.name
          })) || [{ src: '/placeholder.jpg', thumbnail: '/placeholder.jpg', alt: product.name }],
          slug: product.slug || `producto-${product.id}`,
          description: product.description,
          categories: product.categories?.map(cat => cat.slug) || [],
          attributes: product.attributes?.map(attr => ({
            name: attr.name,
            options: attr.options || [],
          })) || [],
          type: 'product',
        }));

        if (newProducts.length > 0) {
          const tx = db.transaction(['products', 'productsByCategory'], 'readwrite');
          await Promise.all(newProducts.map(product => tx.objectStore('products').put(product)));
          await tx.objectStore('productsByCategory').put({
            products: newProducts,
            total,
            totalPages,
            currentPage: this.currentPage,
            cachedAt: Date.now(),
          }, cacheKey);
          await tx.done;

          sessionStorage.setItem(cacheKey, JSON.stringify(newProducts));
          sessionStorage.setItem(`total_${categorySlug}`, total.toString());
          sessionStorage.setItem(`totalPages_${categorySlug}`, totalPages.toString());

          this.products = newProducts;
          this.totalProducts = total;
          this.totalPages = totalPages;
          this.isContentReady = true;
          console.log(`✅ Página ${this.currentPage} cargada desde API con ${newProducts.length} productos`);
        } else {
          this.products = [];
          this.totalProducts = 0;
          this.totalPages = 0;
          this.isContentReady = false;
          console.log(`⚠️ No se encontraron productos para '${categorySlug}' en la página ${this.currentPage}`);
        }

        return {
          products: newProducts,
          total,
          totalPages,
          currentPage: this.currentPage,
        };
      } catch (error) {
        console.error('❌ Error al cargar productos:', error.message);
        this.error = 'Ocurrió un error al cargar los productos.';
        this.isContentReady = false;
        return {
          products: [],
          total: 0,
          totalPages: 0,
          currentPage: this.currentPage,
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
          console.log(`⚡ Producto '${slug}' desde localStorage`, parsed);
          this.products = [parsed];
          this.currentProductSlug = slug;
          this.currentCategorySlug = null;
          this.isContentReady = true;
          return parsed;
        }
      }

      this.loading = true;
      this.isContentReady = false;
      try {
        const response = await axios.get(`${WC_API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, slug, per_page: 1 },
        });

        const data = response.data || [];
        if (!Array.isArray(data) || !data.length) {
          console.warn(`⚠️ Producto '${slug}' no encontrado en la API`);
          this.error = `El producto '${slug}' no existe.`;
          this.isContentReady = false;
          return null;
        }

        console.log(`📡 Datos crudos de la API para '${slug}':`, data[0]);

        const product = {
          id: data[0].id,
          name: data[0].name,
          price: data[0].price,
          regular_price: data[0].regular_price,
          sale_price: data[0].sale_price,
          stock_quantity: data[0].stock_quantity,
          stock_status: data[0].stock_status,
          manage_stock: data[0].manage_stock,
          sku: data[0].sku || 'N/A',
          images: data[0].images?.map(img => ({
            src: img.src || '/placeholder.jpg',
            thumbnail: img.thumbnail || img.src || '/placeholder.jpg',
            alt: img.alt || data[0].name
          })) || [{ src: '/placeholder.jpg', thumbnail: '/placeholder.jpg', alt: data[0].name }],
          slug: data[0].slug || `producto-${data[0].id}`,
          description: data[0].description,
          categories: data[0].categories?.map(cat => cat.slug) || [],
          attributes: data[0].attributes?.map(attr => ({
            name: attr.name,
            options: attr.options || [],
          })) || [],
          type: 'product',
          yoast_head_json: data[0].yoast_head_json || {},
        };

        const db = await dbPromise;
        await db.put('products', product);
        localStorage.setItem(cacheKey, JSON.stringify(product));
        this.products = [product];
        this.currentProductSlug = slug;
        this.currentCategorySlug = null;
        this.isContentReady = true;
        console.log(`✅ Producto '${slug}' cargado desde API:`, product);
        return product;
      } catch (error) {
        console.error(`❌ Error al obtener producto '${slug}':`, error.message);
        this.error = 'Ocurrió un error al cargar el producto.';
        this.isContentReady = false;
        return null;
      } finally {
        this.loading = false;
      }
    },

    async preloadInitialData(categorySlug = null, forceRefresh = false) {
      if (!categorySlug) {
        const cacheKeyCategories = 'categories_minimal';
        const cacheKeyProducts = 'initial_products';
        const cachedCategories = localStorage.getItem(cacheKeyCategories);
        const db = await dbPromise;
        const cachedProducts = await db.get('productsByCategory', cacheKeyProducts);

        if (!forceRefresh && cachedCategories && cachedProducts) {
          const parsedCategories = JSON.parse(cachedCategories);
          if (Array.isArray(parsedCategories) && parsedCategories.length) {
            this.categories = parsedCategories;
            console.log(`⚡ ${parsedCategories.length} categorías mínimas desde localStorage`);
          }
          if (cachedProducts && cachedProducts.products.length) {
            this.products = cachedProducts.products;
            this.currentCategorySlug = null;
            this.currentProductSlug = null;
            console.log(`⚡ ${cachedProducts.products.length} productos iniciales desde IndexedDB`);
            this.isPreloaded = true;
            this.isContentReady = true;
            return;
          }
        }

        this.loading = true;
        this.isContentReady = false;
        try {
          const categoryResponse = await axios.get(`${WC_API_URL}/products/categories`, {
            params: { consumer_key: API_KEY, consumer_secret: API_SECRET, per_page: 20, hide_empty: true },
          });

          const minimalCategories = (categoryResponse.data || []).map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
          }));
          this.categories = minimalCategories;
          localStorage.setItem(cacheKeyCategories, JSON.stringify(minimalCategories));
          console.log(`✅ ${minimalCategories.length} categorías mínimas cargadas desde API`);

          const productResponse = await axios.get(`${WC_API_URL}/products`, {
            params: { consumer_key: API_KEY, consumer_secret: API_SECRET, per_page: 5, orderby: 'date', order: 'desc' },
          });

          const initialProducts = (productResponse.data || []).map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            regular_price: product.regular_price,
            sale_price: product.sale_price,
            stock_quantity: product.stock_quantity,
            stock_status: product.stock_status,
            manage_stock: product.manage_stock,
            sku: product.sku || 'N/A',
            images: product.images?.map(img => ({
              src: img.src || '/placeholder.jpg',
              thumbnail: img.thumbnail || img.src || '/placeholder.jpg',
              alt: img.alt || product.name
            })) || [{ src: '/placeholder.jpg', thumbnail: '/placeholder.jpg', alt: product.name }],
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
          this.currentCategorySlug = null;
          this.currentProductSlug = null;
          this.isPreloaded = true;
          this.isContentReady = true;
          console.log(`✅ ${initialProducts.length} productos iniciales precargados desde API`);
        } catch (error) {
          console.error('❌ Error al precargar datos iniciales:', error);
          this.error = 'Ocurrió un error al precargar datos iniciales.';
          this.isContentReady = false;
        } finally {
          this.loading = false;
        }
      } else {
        console.log(`🟢 Precargando datos para '${categorySlug}'...`);
        await this.fetchProductsByCategory(categorySlug, 1, forceRefresh);
      }
    },

    async fetchCategoriesMinimal(forceRefresh = false) {
      const cacheKey = 'categories_minimal';
      const cached = localStorage.getItem(cacheKey);

      if (!forceRefresh && cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          console.log(`⚡ ${parsed.length} categorías mínimas desde localStorage`);
          this.categories = parsed;
          this.isContentReady = true;
          return parsed;
        }
      }

      this.loading = true;
      this.isContentReady = false;
      try {
        const response = await axios.get(`${WC_API_URL}/products/categories`, {
          params: {
            consumer_key: API_KEY,
            consumer_secret: API_SECRET,
            per_page: 100,
            hide_empty: true,
          },
        });

        const minimalCategories = (response.data || []).map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        }));

        this.categories = minimalCategories;
        localStorage.setItem(cacheKey, JSON.stringify(minimalCategories));
        this.isContentReady = true;
        console.log(`✅ ${minimalCategories.length} categorías mínimas cargadas desde API`);
        return minimalCategories;
      } catch (error) {
        console.error('❌ Error al cargar categorías mínimas:', error.message);
        this.error = 'Ocurrió un error al cargar las categorías.';
        this.isContentReady = false;
        return [];
      } finally {
        this.loading = false;
      }
    },

    async fetchRelatedProducts(categorySlug) {
      try {
        const response = await axios.get(`${WC_API_URL}/products`, {
          params: {
            category: this.categories.find(cat => cat.slug === categorySlug)?.id,
            per_page: 4,
            consumer_key: API_KEY,
            consumer_secret: API_SECRET,
          },
        });

        return response.data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          regular_price: product.regular_price,
          sale_price: product.sale_price,
          images: product.images?.map(img => ({
            src: img.src || '/placeholder.jpg',
            thumbnail: img.thumbnail || img.src || '/placeholder.jpg',
            alt: img.alt || product.name
          })) || [{ src: '/placeholder.jpg', thumbnail: '/placeholder.jpg', alt: product.name }],
          slug: product.slug || `producto-${product.id}`,
        }));
      } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
      }
    },

    async clearCache() {
      const db = await dbPromise;
      await db.clear('products');
      await db.clear('productsByCategory');
      localStorage.clear();
      sessionStorage.clear();
      this.clearState();
      console.log('🧹 Caché y estado limpiados');
    },

    clearState() {
      this.products = [];
      this.currentCategorySlug = null;
      this.currentProductSlug = null;
      this.loading = false;
      this.error = null;
      this.currentPage = 1;
      this.totalPages = 0;
      this.totalProducts = 0;
      this.isContentReady = false;
      console.log('🧹 Estado del store limpiado (categorías preservadas)');
    },
  },

  getters: {
    getProductsByCategory: (state) => (categorySlug) => {
      return state.products.filter(p => p.categories.includes(categorySlug));
    },
    getYoastMetaForCategory: (state) => (slug) => {
      return state.yoastMeta[slug] || {};
    },
  },
});