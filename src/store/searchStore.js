import { defineStore } from 'pinia';
import axios from 'axios';
import { openDB } from 'idb';
import { useStore } from '@/store/store';

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_WC_CONSUMER_KEY;
const API_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET;

const dbPromise = openDB('storeDB', 2);

export const useSearchStore = defineStore('searchStore', {
  state: () => ({
    searchResults: [],
    loading: false,
    error: null,
    lastQuery: '',
    initialLoadDone: false,
  }),

  actions: {
    async initializeStore() {
      if (!this.initialLoadDone) {
        const mainStore = useStore();
        await mainStore.fetchCategoriesMinimal(); // Solo cargamos categorías mínimas
        this.initialLoadDone = true;
        console.log('🛠️ SearchStore inicializado con categorías');
      }
    },

    async searchProducts(query, forceRefresh = false) {
      if (!query || query.trim() === '') {
        this.searchResults = [];
        this.lastQuery = '';
        console.log('🔍 Consulta vacía, limpiando resultados');
        return [];
      }

      await this.initializeStore();
      this.loading = true;
      this.lastQuery = query.trim();
      const cacheKey = `search_${query.toLowerCase()}`;
      const db = await dbPromise;
      const mainStore = useStore();

      const localResults = await this.getLocalPredictions(query, db, mainStore);
      this.searchResults = localResults;
      console.log(`⚡ ${localResults.length} predicciones locales para '${query}'`, localResults);

      if (localResults.length >= 5 && !forceRefresh) {
        this.loading = false;
        return localResults;
      }

      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, search: query, per_page: 10 },
        });

        const data = response.data || [];
        if (!Array.isArray(data)) throw new Error('Formato inválido');

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

        const matchingCategories = mainStore.categories
          .filter(cat => cat.name && cat.name.toLowerCase().includes(query.toLowerCase()))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            type: 'category',
          }));

        const combinedResults = [...products, ...matchingCategories];

        const tx = db.transaction(['products', 'searchResults'], 'readwrite');
        await Promise.all(products.map(product => tx.objectStore('products').put(product)));
        await tx.objectStore('searchResults').put({ products: combinedResults, cachedAt: Date.now() }, cacheKey);
        await tx.done;

        this.searchResults = combinedResults;
        console.log(`✅ ${combinedResults.length} resultados encontrados para '${query}' (API)`, combinedResults);
        return combinedResults;
      } catch (error) {
        console.error(`❌ Error al buscar '${query}':`, error);
        this.error = error.message;
        this.searchResults = localResults.length > 0 ? localResults : [];
        return this.searchResults;
      } finally {
        this.loading = false;
      }
    },

    async getLocalPredictions(query, db, mainStore) {
      const lowerQuery = query.toLowerCase();
      const results = [];

      const allProducts = await db.getAll('products');
      const matchingProducts = allProducts
        .filter(product => product.name && product.name.toLowerCase().includes(lowerQuery))
        .map(product => ({ ...product, type: 'product' }));

      const matchingCategories = mainStore.categories
        .filter(cat => cat.name && cat.name.toLowerCase().includes(lowerQuery))
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          type: 'category',
        }));

      return [...matchingProducts, ...matchingCategories].slice(0, 10);
    },

    clearSearch() {
      this.searchResults = [];
      this.loading = false;
      this.error = null;
      this.lastQuery = '';
      console.log('🧹 Estado de búsqueda limpiado');
    },
  },
});