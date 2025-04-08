<template>
  <div class="container mx-auto px-4 py-6" v-if="store.isContentReady">
    <Breadcrumb :category="categoryData" />
    <div class="flex gap-6">
      <aside class="hidden md:block w-1/4">
        <FilterSidebar
          :category-slug="categorySlug"
          :category-title="categoryTitle"
          :unique-attributes="uniqueAttributes"
          v-model:filters="localFilters"
          v-model:expanded-attributes="expandedAttributes"
          @apply-filters="applyFiltersFromSidebar"
          @clear-filters="clearFiltersFromSidebar"
        />
      </aside>
      <div class="w-full md:w-3/4">
        <div class="flex justify-center items-center space-x-4 mb-6">
          <span @click="prevPage" :class="['px-3 py-2 cursor-pointer', store.currentPage <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-orange-500 transition']"><</span>
          <div class="flex space-x-2">
            <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :class="['px-3 py-1 rounded-md transition', store.currentPage === page ? 'bg-orange-500 text-white' : 'bg-gray-200 hover:bg-gray-300']">
              {{ page }}
            </button>
          </div>
          <span @click="nextPage" :class="['px-3 py-2 cursor-pointer', store.currentPage >= store.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-orange-500 transition']">></span>
        </div>
        <ProductGrid :products="filteredProducts" @add-to-cart="addToCart" @go-to-product="goToProduct" />
      </div>
    </div>
  </div>
  <div v-else class="container mx-auto px-4 py-6">
    <!-- Placeholder -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store/store';
import { useCartStore } from '@/store/cartStore';
import { useHead } from '@unhead/vue'; // Cambiado a @unhead/vue
import { defineAsyncComponent } from 'vue';
import { saveToIndexedDB, getFromIndexedDB } from '@/utils/indexedDB';
import Breadcrumb from '@/components/Breadcrumb.vue';

const FilterSidebar = defineAsyncComponent(() => import('@/components/FilterSidebar.vue'));
const ProductGrid = defineAsyncComponent(() => import('@/components/ProductGrid.vue'));

const route = useRoute();
const router = useRouter();
const store = useStore();
const cartStore = useCartStore();

const categoryTitle = ref('');
const filteredProducts = ref([]);
const localFilters = ref({ price: '', attributes: {} });
const activeFilters = ref({ price: '', attributes: {} });
const expandedAttributes = ref({});

const categorySlug = computed(() => route.params.slug);
const categoryData = computed(() => store.categories.find(cat => cat.slug === categorySlug.value) || null);

const uniqueAttributes = computed(() => {
  if (!store.isContentReady) return [];
  const attributesMap = new Map();
  store.products.forEach(product => {
    if (!product.categories.includes(categorySlug.value)) return;
    (product.attributes || []).forEach(attr => {
      const normalizedName = attr.name.toLowerCase().trim().replace(/\s+/g, '-');
      const normalizedOptions = Array.from(new Set((attr.options || []).map(option => option.toLowerCase().trim())));
      const attrKey = `${normalizedName}-${normalizedOptions.sort().join('-')}`;
      if (!attributesMap.has(attrKey)) {
        attributesMap.set(attrKey, { slug: normalizedName, name: attr.name, options: normalizedOptions });
      }
    });
  });
  return Array.from(attributesMap.values());
});

const filteredProductsComputed = computed(() => {
  if (!store.isContentReady || !Array.isArray(store.products)) return [];
  const filtered = store.products.filter(product => {
    if (!product.categories.includes(categorySlug.value)) return false;
    if (activeFilters.value.price) {
      const [min, max] = activeFilters.value.price.split('-').map(Number);
      const productPrice = Number(product.price) || 0;
      if (activeFilters.value.price === '1000+') return productPrice >= 1000;
      return productPrice >= min && (!max || productPrice <= max);
    }
    for (const [attrSlug, selectedOption] of Object.entries(activeFilters.value.attributes)) {
      if (selectedOption && selectedOption !== '') {
        const attribute = product.attributes.find(attr => attr.name.toLowerCase().trim().replace(/\s+/g, '-') === attrSlug);
        if (!attribute || !attribute.options.includes(selectedOption)) return false;
      }
    }
    return true;
  });
  console.log('Productos filtrados para renderizar:', filtered);
  return filtered;
});

const visiblePages = computed(() => {
  const maxPages = 5;
  const half = Math.floor(maxPages / 2);
  let start = Math.max(1, store.currentPage - half);
  let end = Math.min(store.totalPages, start + maxPages - 1);
  start = Math.max(1, end - maxPages + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// Configurar metadatos reactivos con Unhead
useHead({
  title: computed(() => categoryTitle.value || 'Categoría - Mi Tienda'),
  meta: [
    {
      name: 'description',
      content: computed(() => {
        const slug = route.params.slug;
        const category = store.categories.find(cat => cat.slug === slug);
        const yoastMeta = store.getYoastMetaForCategory(slug);
        return yoastMeta?.yoast_head_json?.description || category?.description || 'Categoría de productos';
      }),
    },
  ],
});

const loadData = async (slug, page, forceRefresh = false) => {
  try {
    const cacheKey = `products_${slug}_page_${page}`;
    const cachedData = await getFromIndexedDB(cacheKey, 'productsByCategory');
    let category, yoastMeta;

    if (cachedData && cachedData.products && !forceRefresh) {
      console.log(`⚡ Datos cargados desde IndexedDB para ${cacheKey}`, cachedData.products);
      store.products = cachedData.products;
      store.totalProducts = cachedData.total;
      store.totalPages = cachedData.totalPages;
      store.currentPage = page;
      category = store.categories.find(cat => cat.slug === slug) || (await store.fetchCategoryBySlug(slug));
      yoastMeta = store.getYoastMetaForCategory(slug);
      categoryTitle.value = yoastMeta.yoast_head_json?.title || category.name || 'Categoría no encontrada';
      filteredProducts.value = filteredProductsComputed.value;
      store.isContentReady = true;
      return;
    }

    category = await store.fetchCategoryBySlug(slug);
    if (!category) {
      router.push('/404');
      return;
    }
    const result = await store.fetchProductsByCategory(slug, page, forceRefresh);
    console.log(`Productos cargados desde API para página ${page}:`, result.products);
    yoastMeta = store.getYoastMetaForCategory(slug);
    categoryTitle.value = yoastMeta.yoast_head_json?.title || category.name || 'Categoría no encontrada';
    filteredProducts.value = filteredProductsComputed.value;
    store.isContentReady = true;

    await saveToIndexedDB(cacheKey, {
      products: result.products,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: page,
    }, 'productsByCategory');
  } catch (error) {
    console.error('Error al cargar datos:', error);
    router.push('/404');
  }
};

const applyFiltersFromSidebar = () => {
  activeFilters.value = JSON.parse(JSON.stringify(localFilters.value));
  filteredProducts.value = filteredProductsComputed.value;
};

const clearFiltersFromSidebar = () => {
  localFilters.value = { price: '', attributes: {} };
  activeFilters.value = { price: '', attributes: {} };
  expandedAttributes.value = {};
  filteredProducts.value = filteredProductsComputed.value;
};

const addToCart = product => cartStore.addItem(product);

const goToProduct = productSlug => {
  if (!productSlug) return console.error('Error: productSlug es undefined');
  router.push(`/producto/${productSlug}`).catch(err => console.error('Error al navegar al producto:', err));
};

const prevPage = () => {
  if (store.currentPage > 1) goToPage(store.currentPage - 1);
};

const nextPage = () => {
  if (store.currentPage < store.totalPages) goToPage(store.currentPage + 1);
};

const goToPage = async page => {
  await router.push({ path: `/categoria/${categorySlug.value}`, query: { page } }).catch(err => console.error('Error en router.push:', err));
  await loadData(categorySlug.value, page);
};

// Manejo de carga inicial
onMounted(async () => {
  const page = parseInt(route.query.page) || 1;
  await loadData(categorySlug.value, page);
});

// Eliminar watch redundante, ya que useHead es reactivo
</script>

<style scoped>
/* Estilos */
</style>