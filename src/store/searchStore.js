// src/store/searchStore.js
import { defineStore } from 'pinia';
import axios from 'axios';
import { getFromIndexedDB, saveToIndexedDB, dbPromise } from '@/utils/indexedDB';
import { useStore } from '@/store/store';
import { ratio } from 'fuzzball'; // Cambia la importación a una importación nombrada

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_WC_CONSUMER_KEY;
const API_SECRET = import.meta.env.VITE_WC_CONSUMER_SECRET;

const POPULAR_STORE = 'popular_searches';

// Helper para determinar si una consulta es específica usando fuzzy matching
const isSpecificQuery = (query, products) => {
  const lowerQuery = query.toLowerCase();
  return products.some(product => {
    const similarity = ratio(lowerQuery, product.name?.toLowerCase()); // Usa ratio directamente
    return similarity >= 80; // Considerar específica si la similitud es >= 80%
  });
};

export const useSearchStore = defineStore('searchStore', {
  state: () => ({
    searchResults: [],
    popularResults: [],
    loading: false,
    error: null,
    lastQuery: '',
    isContentReady: false,
  }),

  actions: {
    async initializePopularData() {
      const mainStore = useStore();
      if (mainStore.categories.length === 0) {
        await mainStore.fetchCategoriesMinimal();
      }

      try {
        const cachedPopular = await getFromIndexedDB('popular', POPULAR_STORE);
        if (cachedPopular?.products?.length) {
          this.popularResults = cachedPopular.products;
          return;
        }
      } catch (error) {
        console.warn('⚠️ No se encontraron datos populares en IndexedDB:', error);
      }

      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: {
            consumer_key: API_KEY,
            consumer_secret: API_SECRET,
            per_page: 10,
            orderby: 'popularity',
          },
          timeout: 5000,
        });

        const popularProducts = response.data.map(product => ({
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

        await saveToIndexedDB('popular', { products: popularProducts }, POPULAR_STORE);
        this.popularResults = popularProducts;
      } catch (error) {
        console.error('❌ Error al cargar datos populares:', error);
        this.popularResults = [];
      }
    },

    async searchProducts(query, forceRefresh = false) {
      if (!query?.trim()) {
        this.searchResults = [];
        this.lastQuery = '';
        this.isContentReady = true;
        console.log('🔍 Consulta vacía, limpiando resultados');
        return [];
      }

      this.loading = true;
      this.isContentReady = false;
      this.lastQuery = query.trim();
      const cacheKey = `search_${query.toLowerCase()}`;
      const mainStore = useStore();

      if (mainStore.categories.length === 0) {
        await mainStore.fetchCategoriesMinimal();
      }

      if (!forceRefresh) {
        const cached = await getFromIndexedDB(cacheKey, 'search_results');
        if (cached?.products?.length) {
          this.searchResults = cached.products;
          this.loading = false;
          this.isContentReady = true;
          console.log(`⚡ Resultados en caché para '${query}': ${cached.products.length} ítems`);
          return cached.products;
        }
      }

      const [localResults, apiResults] = await Promise.all([
        this.getLocalPredictions(query, mainStore),
        this.fetchFromApi(query),
      ]);

      const combinedResults = [
        ...localResults,
        ...apiResults.filter(apiResult => !localResults.some(local => local.id === apiResult.id && local.type === apiResult.type)),
      ];

      await saveToIndexedDB(cacheKey, { cacheKey, products: combinedResults }, 'search_results');
      this.searchResults = combinedResults;
      this.loading = false;
      this.isContentReady = true;
      console.log(`✅ ${combinedResults.length} resultados combinados para '${query}'`);
      return combinedResults;
    },

    async fetchFromApi(query) {
      try {
        const response = await axios.get(`${API_URL}/products`, {
          params: {
            consumer_key: API_KEY,
            consumer_secret: API_SECRET,
            search: query,
            per_page: 10,
          },
          timeout: 3000,
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

        const mainStore = useStore();
        const isSpecific = isSpecificQuery(query, products);

        // Solo incluir categorías si la consulta es específica
        let associatedCategories = [];
        if (isSpecific) {
          const productCategorySlugs = new Set(products.flatMap(product => product.categories));
          associatedCategories = mainStore.categories
            .filter(cat => productCategorySlugs.has(cat.slug))
            .map(cat => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              type: 'category',
            }));
        }

        return [...products, ...associatedCategories];
      } catch (error) {
        console.error(`❌ Error al buscar '${query}' desde API:`, error);
        this.error = error.message;
        return [];
      }
    },

    async getLocalPredictions(query, mainStore) {
      const lowerQuery = query.toLowerCase();
      try {
        if (query.length <= 3 && this.popularResults.length > 0) {
          const filteredPopular = this.popularResults.filter(item =>
            item.name?.toLowerCase().includes(lowerQuery)
          );
          if (filteredPopular.length > 0) {
            console.log(`⚡ ${filteredPopular.length} resultados populares para '${query}'`);
            return filteredPopular;
          }
        }

        const db = await dbPromise;
        const tx = db.transaction('products', 'readonly');
        const store = tx.objectStore('products');
        const allProducts = await store.getAll();

        const matchingProducts = allProducts
          .filter(product => product.name?.toLowerCase().includes(lowerQuery))
          .map(product => ({ ...product, type: 'product' }));

        // Solo incluir categorías si la consulta es específica
        let associatedCategories = [];
        const isSpecific = isSpecificQuery(query, matchingProducts);
        if (isSpecific) {
          const productCategorySlugs = new Set(matchingProducts.flatMap(product => product.categories || []));
          associatedCategories = mainStore.categories
            .filter(cat => productCategorySlugs.has(cat.slug))
            .map(cat => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              type: 'category',
            }));
        }

        return [
          ...matchingProducts,
          ...associatedCategories,
        ].slice(0, 5);
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
          canonical: data.canonical || `${window.location.origin}/buscar?q=${encodeURIComponent(query)}`,
        };
      } catch (error) {
        console.error(`❌ Error al obtener metadatos Yoast para '${query}':`, error);
        return {
          title: `Resultados para "${query}"`,
          description: `Encuentra productos relacionados con "${query}" en nuestra tienda.`,
          og_image: '',
          canonical: `${window.location.origin}/buscar?q=${encodeURIComponent(query)}`,
        };
      }
    },

    clearSearch() {
      this.searchResults = [];
      this.loading = false;
      this.error = null;
      this.lastQuery = '';
      this.isContentReady = true;
      console.log('🧹 Estado de búsqueda limpiado');
    },
  },
});