<!-- src/views/SearchView.vue -->
<template>
  <div class="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
    <!-- Sidebar de categorías a la izquierda -->
    <aside class="w-full md:w-1/4 bg-white rounded-lg shadow-md p-4">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h18" />
        </svg>
        Categorías
      </h3>
      <div v-if="isLoading" class="space-y-3 animate-pulse">
        <div v-for="n in 5" :key="n" class="h-6 bg-gray-200 rounded-md"></div>
      </div>
      <ul v-else-if="categories.length > 0" class="space-y-2">
        <li v-for="cat in categories" :key="cat.slug" class="flex items-center justify-between p-2 rounded-md hover:bg-orange-50 transition-colors duration-200">
          <router-link
            :to="`/categoria/${cat.slug}`"
            class="flex items-center text-gray-700 hover:text-orange-500 font-medium text-sm"
          >
            <span class="truncate">{{ cat.name }}</span>
          </router-link>
          <span class="text-gray-500 text-xs font-semibold bg-gray-100 px-2 py-1 rounded-full">
            {{ cat.count }}
          </span>
        </li>
      </ul>
      <p v-else class="text-gray-500 text-sm italic">No hay categorías disponibles para esta búsqueda.</p>
    </aside>

    <!-- Contenido principal -->
    <main class="w-full md:w-3/4">
      <Breadcrumb :search-term="query" />
      <div v-if="error" class="text-center text-red-500 py-10">
        {{ error }}
      </div>
      <div v-else-if="!query" class="text-center py-10 text-gray-600">
        <p>No se especificó un término de búsqueda.</p>
        <p class="mt-2">
          Usa la barra de búsqueda en la parte superior o explora nuestras
          <router-link to="/categorias" class="text-orange-500 hover:underline">categorías</router-link>.
        </p>
      </div>
      <div v-else>
        <h2 v-if="searchResults.length > 0" class="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
          Resultados para "<span class="text-orange-500">{{ query }}</span>" ({{ searchResults.length }})
        </h2>
        <p v-else-if="!isLoading" class="text-center py-10 text-gray-600">
          No se encontraron productos para "<span class="font-semibold">{{ query }}</span>".
          <router-link to="/categorias" class="text-orange-500 hover:underline ml-1">Explora categorías</router-link>.
        </p>
        <ProductGrid :products="isLoading ? null : searchResults" @add-to-cart="addToCart" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/cartStore';
import { useSearchStore } from '@/store/searchStore';
import { useStore } from '@/store/store';
import Breadcrumb from '@/components/Breadcrumb.vue';
import ProductGrid from '@/components/ProductGrid.vue';

const props = defineProps({
  query: String,
});

const router = useRouter();
const cartStore = useCartStore();
const searchStore = useSearchStore();
const store = useStore();

const searchResults = ref([]);
const isLoading = ref(false);
const error = ref('');

// Calcular categorías dinámicamente desde los resultados
const categories = computed(() => {
  console.log('🔍 searchResults:', searchResults.value); // Depuración
  if (!searchResults.value.length) return [];

  const categoryMap = new Map();

  searchResults.value.forEach(product => {
    let cat = product.category || product.categories?.[0];
    if (!cat) {
      cat = { name: 'Sin categoría', slug: 'sin-categoria' };
    } else if (typeof cat === 'number' || typeof cat === 'string') {
      const foundCat = store.categories.find(c => c.id === cat || c.name === cat);
      cat = foundCat || { name: cat.toString(), slug: cat.toString().toLowerCase().replace(/\s+/g, '-') };
    }

    const key = cat.slug || cat.name;
    if (categoryMap.has(key)) {
      categoryMap.get(key).count += 1;
    } else {
      categoryMap.set(key, {
        name: cat.name || 'Sin categoría',
        slug: cat.slug || 'sin-categoria',
        count: 1,
      });
    }
  });

  const result = Array.from(categoryMap.values());
  console.log('🔍 Categorías calculadas:', result); // Depuración
  return result;
});

const loadResults = async () => {
  if (!props.query) return;

  isLoading.value = true;
  error.value = '';
  try {
    const results = await searchStore.searchProducts(props.query.trim());
    console.log('🔍 Resultados crudos de searchStore:', results); // Depuración
    searchResults.value = results.filter(r => r.type === 'product');
  } catch (err) {
    error.value = 'Error al cargar los resultados. Por favor, intenta de nuevo.';
    console.error('Error en la búsqueda:', err);
  } finally {
    isLoading.value = false;
  }
};

const addToCart = (product) => {
  if (product?.id) cartStore.addItem(product);
};

onMounted(async () => {
  if (props.query) {
    if (!store.categories.length) await store.fetchCategoriesMinimal();
    loadResults();
  }
});

watch(
  () => props.query,
  async (newQuery) => {
    if (newQuery) {
      if (!store.categories.length) await store.fetchCategoriesMinimal();
      loadResults();
    }
  }
);
</script>

<style scoped>
/* Estilos para el sidebar */
aside {
  position: sticky;
  top: 1rem; /* Pegajoso en desktop para que no se pierda al hacer scroll */
  max-height: calc(100vh - 2rem); /* Limitar altura al viewport */
  overflow-y: auto; /* Scroll si hay muchas categorías */
}

/* Personalización adicional */
aside::-webkit-scrollbar {
  width: 6px;
}
aside::-webkit-scrollbar-thumb {
  background-color: #d1d5db; /* Gris claro */
  border-radius: 3px;
}
aside::-webkit-scrollbar-track {
  background: #f1f1f1;
}

@media (max-width: 768px) {
  aside {
    position: static; /* No pegajoso en móvil */
    margin-bottom: 1.5rem;
    max-height: none; /* Sin límite en móvil */
  }
}
</style>