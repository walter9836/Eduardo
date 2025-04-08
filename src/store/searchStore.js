import { defineStore } from 'pinia';
import axios from 'axios';
import { getFromIndexedDB, saveToIndexedDB, dbPromise } from '@/utils/indexedDB';
import { useStore } from '@/store/store';

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_WC_CONSUMER_KEY;
const API_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET;

export const useSearchStore = defineStore('searchStore', {
  state: () => ({
    searchResults: [],
    loading: false,
    error: null,
    lastQuery: '',
  }),

  actions: {
    async searchProducts(query, forceRefresh = false) {
      if (!query?.trim()) {
        this.searchResults = [];
        this.lastQuery = '';
        console.log('🔍 Consulta vacía, limpiando resultados');
        return [];
      }

      this.loading = true;
      this.lastQuery = query.trim();
      const cacheKey = `search_${query.toLowerCase()}`;
      const mainStore = useStore();

      if (mainStore.categories.length === 0) {
        await mainStore.fetchCategoriesMinimal();
      }

      if (!forceRefresh) {
        const cached = await getFromIndexedDB(cacheKey, "search_results");
        if (cached?.products?.length) {
          this.searchResults = cached.products;
          this.loading = false;
          console.log(`⚡ Resultados en caché para '${query}': ${cached.products.length} ítems`);
          return cached.products;
        }
      }

      const localResults = await this.getLocalPredictions(query, mainStore);
      this.searchResults = localResults;
      console.log(`⚡ ${localResults.length} predicciones locales para '${query}'`);
      if (localResults.length >= 5 && !forceRefresh) {
        this.loading = false;
        return localResults;
      }

      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, search: query, per_page: 20 },
          timeout: 5000,
        });

        const data = response.data || [];
        if (!Array.isArray(data)) throw new Error('Formato inválido de la API');

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

        // Categorías que coinciden directamente con la consulta
        const matchingCategories = mainStore.categories
          .filter(cat => cat.name?.toLowerCase().includes(query.toLowerCase()))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            type: 'category',
          }));

        // Categorías asociadas a los productos encontrados
        const productCategorySlugs = new Set(products.flatMap(product => product.categories));
        const associatedCategories = mainStore.categories
          .filter(cat => productCategorySlugs.has(cat.slug))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            type: 'category',
          }));

        // Combinar resultados: productos, categorías coincidentes y categorías asociadas
        const combinedResults = [
          ...products,
          ...matchingCategories,
          ...associatedCategories.filter(cat => !matchingCategories.some(mc => mc.id === cat.id)), // Evitar duplicados
        ].sort((a, b) => (a.type === 'product' ? -1 : 1));

        await saveToIndexedDB(cacheKey, { cacheKey, products: combinedResults }, "search_results");
        this.searchResults = combinedResults;
        console.log(`✅ ${combinedResults.length} resultados para '${query}' desde API`);
        return combinedResults;
      } catch (error) {
        console.error(`❌ Error al buscar '${query}':`, error);
        this.error = error.message;
        this.searchResults = localResults;
        return localResults;
      } finally {
        this.loading = false;
      }
    },

    async getLocalPredictions(query, mainStore) {
      const lowerQuery = query.toLowerCase();
      try {
        const db = await dbPromise;
        const tx = db.transaction("products", "readonly");
        const store = tx.objectStore("products");
        const allProducts = await store.getAll();
        const matchingProducts = allProducts
          .filter(product => product.name?.toLowerCase().includes(lowerQuery))
          .map(product => ({ ...product, type: 'product' }));

        // Categorías que coinciden directamente con la consulta
        const matchingCategories = mainStore.categories
          .filter(cat => cat.name?.toLowerCase().includes(lowerQuery))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            type: 'category',
          }));

        // Categorías asociadas a los productos encontrados localmente
        const productCategorySlugs = new Set(matchingProducts.flatMap(product => product.categories || []));
        const associatedCategories = mainStore.categories
          .filter(cat => productCategorySlugs.has(cat.slug))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            type: 'category',
          }));

        return [
          ...matchingProducts,
          ...matchingCategories,
          ...associatedCategories.filter(cat => !matchingCategories.some(mc => mc.id === cat.id)),
        ];
      } catch (error) {
        console.error('❌ Error en predicciones locales:', error);
        return [];
      }
    },

    async getYoastMetaForSearch(query) {
      try {
        const response = await axios.get(`${API_URL}/yoast/search-meta`, {
          params: { consumer_key: API_KEY, consumer_secret: API_SECRET, query },
          timeout: 5000,
        });
        const data = response.data || {};
        return {
          title: data.title || `Resultados para "${query}"`,
          description: data.description || `Encuentra productos relacionados con "${query}" en nuestra tienda.`,
          og_image: data.og_image || '',
          canonical: data.canonical || `${window.location.origin}/search?q=${encodeURIComponent(query)}`,
        };
      } catch (error) {
        console.error(`❌ Error al obtener metadatos Yoast para '${query}':`, error);
        return {
          title: `Resultados para "${query}"`,
          description: `Encuentra productos relacionados con "${query}" en nuestra tienda.`,
          og_image: '',
          canonical: `${window.location.origin}/search?q=${encodeURIComponent(query)}`,
        };
      }
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