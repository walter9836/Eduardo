<template>
  <div class="container mx-auto px-4 py-6">
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
        <div v-if="store.error" class="text-center text-red-500 py-10">
          {{ store.error }}
        </div>
        <div v-else-if="!store.loading">
          <!-- Paginación -->
          <div class="flex justify-center items-center space-x-4 mb-6">
            <span 
              @click="prevPage" 
              :class="[
                'px-3 py-2 cursor-pointer',
                store.currentPage <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-orange-500 transition'
              ]"
            >
              < <!-- Flecha izquierda -->
            </span>
            <div class="flex space-x-2">
              <button
                v-for="page in store.totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-1 rounded-md transition',
                  store.currentPage === page ? 'bg-orange-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                ]"
              >
                {{ page }}
              </button>
            </div>
            <span 
              @click="nextPage" 
              :class="[
                'px-3 py-2 cursor-pointer',
                store.currentPage >= store.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-orange-500 transition'
              ]"
            >
              > <!-- Flecha derecha -->
            </span>
          </div>
          <ProductGrid :products="filteredProducts" @add-to-cart="addToCart" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store/store';
import { useCartStore } from '@/store/cartStore';
import Breadcrumb from '@/components/Breadcrumb.vue';
import FilterSidebar from '@/components/FilterSidebar.vue';
import ProductGrid from '@/components/ProductGrid.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();
const cartStore = useCartStore();

const categoryTitle = ref('');
const filteredProducts = ref([]);
const localFilters = ref({ price: '', attributes: {} }); // Filtros en borrador
const activeFilters = ref({ price: '', attributes: {} }); // Filtros aplicados
const expandedAttributes = ref({});

const categorySlug = computed(() => route.params.slug);

const categoryData = computed(() => {
  return store.categories.find(cat => cat.slug === categorySlug.value) || null;
});

const uniqueAttributes = computed(() => {
  console.log('Calculando uniqueAttributes con store.products:', store.products);
  const attributesMap = new Map();
  store.products.forEach(product => {
    (product.attributes || []).forEach(attr => {
      const normalizedName = attr.name.toLowerCase().trim().replace(/\s+/g, '-');
      const normalizedOptions = Array.from(new Set(
        (attr.options || []).map(option => option.toLowerCase().trim())
      ));
      const attrKey = `${normalizedName}-${normalizedOptions.sort().join('-')}`;
      if (!attributesMap.has(attrKey)) {
        attributesMap.set(attrKey, {
          slug: normalizedName,
          name: attr.name,
          options: normalizedOptions,
        });
      }
    });
  });
  const uniqueAttrs = Array.from(attributesMap.values());
  console.log('Atributos únicos:', uniqueAttrs);
  return uniqueAttrs;
});

const filteredProductsComputed = computed(() => {
  if (!Array.isArray(store.products)) {
    console.warn('store.products no es un array:', store.products);
    return [];
  }

  console.log('🔍 Filtrando productos con filtros activos:', activeFilters.value);
  const filtered = store.products.filter(product => {
    // Filtro por precio
    if (activeFilters.value.price) {
      const [min, max] = activeFilters.value.price.split('-').map(Number);
      const productPrice = Number(product.price) || 0;
      if (activeFilters.value.price === '1000+') {
        if (productPrice < 1000) return false;
      } else if (productPrice < min || (max && productPrice > max)) {
        return false;
      }
    }

    // Filtro por atributos
    for (const [attrSlug, selectedOption] of Object.entries(activeFilters.value.attributes)) {
      if (selectedOption && selectedOption !== '') {
        const attribute = product.attributes.find(attr => 
          attr.name.toLowerCase().trim().replace(/\s+/g, '-') === attrSlug
        );
        if (!attribute || !attribute.options.includes(selectedOption)) {
          return false;
        }
      }
    }
    return true;
  });
  console.log('Productos filtrados en computed:', filtered.length);
  return filtered;
});

// Solo actualiza filteredProducts cuando se aplican los filtros
const applyFiltersFromSidebar = () => {
  console.log('🚀 applyFiltersFromSidebar ejecutado con filtros:', JSON.stringify(localFilters.value));
  activeFilters.value = JSON.parse(JSON.stringify(localFilters.value)); // Copia profunda
  filteredProducts.value = filteredProductsComputed.value;
};

const clearFiltersFromSidebar = () => {
  localFilters.value = { price: '', attributes: {} };
  activeFilters.value = { price: '', attributes: {} };
  expandedAttributes.value = {};
  filteredProducts.value = store.products; // Mostrar todos los productos
};

const updateCategoryTitle = () => {
  const category = store.categories.find(cat => cat.slug === categorySlug.value);
  categoryTitle.value = category ? category.name : 'Categoría no encontrada';
  if (category) sessionStorage.setItem(`category_${categorySlug.value}`, category.name);
};

const loadProducts = async (page) => {
  store.currentPage = page;
  await store.fetchProductsByCategory(categorySlug.value, page);
  updateCategoryTitle();
  filteredProducts.value = store.products; // Inicialmente mostrar todos
  console.log(`Cargando productos para página ${page}, total productos: ${store.totalProducts}, total páginas: ${store.totalPages}`);
};

const addToCart = (product) => {
  cartStore.addItem(product);
};

const prevPage = () => {
  if (store.currentPage > 1) goToPage(store.currentPage - 1);
};

const nextPage = () => {
  if (store.currentPage < store.totalPages) goToPage(store.currentPage + 1);
};

const goToPage = (page) => {
  router.push({
    path: `/categoria/${categorySlug.value}`,
    query: { page },
  });
  loadProducts(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

watch(() => route.query.page, (newPage) => {
  const page = parseInt(newPage) || 1;
  if (page !== store.currentPage) loadProducts(page);
});

watch(categorySlug, () => {
  store.clearState();
  filteredProducts.value = [];
  const page = parseInt(route.query.page) || 1;
  loadProducts(page);
});

onMounted(() => {
  const page = parseInt(route.query.page) || 1;
  loadProducts(page);
});
</script>