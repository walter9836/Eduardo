<!-- src/components/AppHeader.vue -->
<template>
  <div class="bg-black text-white text-center py-2 w-full fixed top-0 left-0 z-[60] overflow-hidden h-10">
    <swiper :modules="modules" :slides-per-view="1" :space-between="0" :loop="true" :autoplay="{ delay: 4000, disableOnInteraction: false }" class="h-full w-full">
      <swiper-slide>
        <div class="h-full flex items-center justify-center px-2">
          <p class="w-full text-[12px] sm:text-xs md:text-base font-medium leading-tight">
            📣 ¡<span style="color: yellow; font-weight: bold;">Oferta</span> especial! 20% de descuento en todo hasta el 28 de febrero
          </p>
        </div>
      </swiper-slide>
      <swiper-slide>
        <div class="h-full flex items-center justify-center px-2">
          <p class="w-full text-[12px] sm:text-xs md:text-base font-medium leading-tight">
            🚀 ¡<span style="color: yellow; font-weight: bold;">Oferta</span>! Envío gratis en compras superiores a $50 hasta fin de mes
          </p>
        </div>
      </swiper-slide>
    </swiper>
  </div>

  <header class="bg-white text-black p-3 flex items-center justify-between shadow-md w-full px-4 md:px-6 relative z-50 mt-[44px] md:mt-[44px]">
    <router-link to="/" class="flex items-center">
      <img src="/logo-hiraoka.webp" alt="Logo Mi Tienda" class="w-28 md:w-40 h-auto" />
    </router-link>

    <div class="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50">
      <div class="relative w-full">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar productos o categorías..."
          class="w-full px-5 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm shadow-md"
          @input="filterResults"
          @keyup.enter="performSearch"
          aria-label="Buscar productos o categorías"
        />
        <button
          @click="performSearch"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition"
          aria-label="Realizar búsqueda"
        >
          <svg v-if="isLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v4m0 0l-2-2m2 2l2-2m8 4a9 9 0 11-9-9 9 9 0 0110 9z" />
          </svg>
          <img v-else src="/lupa.svg" alt="Buscar" class="w-5 h-5" />
        </button>
        <div v-if="isLoading && !searchResults.length" class="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded-md z-50 mt-1 max-h-96 overflow-y-auto animate-pulse">
          <div v-for="n in 5" :key="n" class="px-4 py-2 h-10 bg-gray-100 mb-1"></div>
        </div>
        <div v-else-if="searchResults.length > 0 && searchQuery.trim().length > 0" class="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded-md z-50 mt-1 max-h-96 overflow-y-auto">
          <div class="grid grid-cols-2 gap-4 p-4">
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-2">Categorías</h3>
              <ul>
                <li v-for="category in categoriesResults" :key="category.id" class="px-2 py-1 hover:bg-orange-100 cursor-pointer transition-all duration-200 text-gray-800" @click="goToResult(category)">
                  {{ category.name }}
                </li>
                <li v-if="!categoriesResults.length" class="text-gray-500 text-sm">Sin categorías</li>
              </ul>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-2">Productos</h3>
              <ul>
                <li v-for="product in productsResults" :key="product.id" class="px-2 py-1 hover:bg-orange-100 cursor-pointer transition-all duration-200 text-gray-800" @click="goToResult(product)">
                  {{ product.name }}
                </li>
                <li v-if="!productsResults.length" class="text-gray-500 text-sm">Sin productos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center ml-auto space-x-4">
      <button @click="clearCache" class="bg-gray-500 text-white text-xs px-2 py-1 rounded hover:bg-gray-600 transition">
        Limpiar Caché
      </button>
      <div class="relative">
        <button @click="toggleCategories" class="group flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 transition-all duration-300 text-gray-700 text-sm">
          <span class="font-medium text-xs md:text-sm text-gray-800">Categorías</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-orange-500 transition-transform duration-300" :class="{ 'rotate-180': categoriesOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <transition name="fade">
          <div v-show="categoriesOpen" class="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div class="py-2">
              <router-link to="/categorias" class="block text-left px-3 py-2 text-xs md:text-sm font-medium text-gray-700 hover:bg-orange-100 transition-all duration-200 active:bg-orange-200" @click="closeCategories">
                Ver todas las categorías
              </router-link>
              <div class="grid gap-1 max-h-[50vh] overflow-y-auto px-3">
                <router-link v-for="category in store.categories" :key="category.id" :to="`/categoria/${category.slug}`" class="flex items-center px-3 py-2 hover:bg-orange-50 text-gray-700 transition-all duration-200 group rounded-md active:bg-orange-200" @click="closeCategories">
                  <span class="text-xs md:text-sm font-medium text-gray-800 group-hover:text-orange-600 transition-colors">{{ category.name }}</span>
                </router-link>
              </div>
            </div>
          </div>
        </transition>
      </div>
      <router-link to="/carrito" class="relative flex items-center text-gray-700 hover:text-orange-500 transition">
        <img src="/carritodesk.svg" alt="Carrito" class="w-6 md:w-7 h-auto" />
        <span v-if="cartItemCount > 0" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-md">
          {{ cartItemCount }}
        </span>
      </router-link>
    </div>
  </header>

  <div class="w-full px-5 md:px-6 h-15 md:hidden flex justify-center items-center mt-2 relative z-50">
    <div class="relative w-full max-w-xs">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar productos o categorías..."
        class="w-full px-6 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm shadow-sm"
        @input="filterResults"
        @keyup.enter="performSearch"
        aria-label="Buscar productos o categorías"
      />
      <button @click="performSearch" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition" aria-label="Realizar búsqueda">
        <svg v-if="isLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v4m0 0l-2-2m2 2l2-2m8 4a9 9 0 11-9-9 9 9 0 0110 9z" />
        </svg>
        <img v-else src="/lupa.svg" alt="Buscar" class="w-5 h-5" />
      </button>
      <div v-if="isLoading && !searchResults.length" class="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded-md z-50 mt-1 max-h-96 overflow-y-auto animate-pulse">
        <div v-for="n in 5" :key="n" class="px-4 py-2 h-10 bg-gray-100 mb-1"></div>
      </div>
      <div v-else-if="searchResults.length > 0 && searchQuery.trim().length > 0" class="absolute top-full left-0 w-full bg-white border border-gray-300 shadow-lg rounded-md z-50 mt-1 max-h-96 overflow-y-auto">
        <div class="grid grid-cols-2 gap-4 p-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Categorías</h3>
            <ul>
              <li v-for="category in categoriesResults" :key="category.id" class="px-2 py-1 hover:bg-orange-100 cursor-pointer transition-all duration-200 text-gray-800" @click="goToResult(category)">
                {{ category.name }}
              </li>
              <li v-if="!categoriesResults.length" class="text-gray-500 text-sm">Sin categorías</li>
            </ul>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Productos</h3>
            <ul>
              <li v-for="product in productsResults" :key="product.id" class="px-2 py-1 hover:bg-orange-100 cursor-pointer transition-all duration-200 text-gray-800" @click="goToResult(product)">
                {{ product.name }}
              </li>
              <li v-if="!productsResults.length" class="text-gray-500 text-sm">Sin productos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCartStore } from '@/store/cartStore';
import { useStore } from '@/store/store';
import { useSearchStore } from '@/store/searchStore';
import { useHead } from '@unhead/vue'; // Cambiado a @unhead/vue
import { debounce } from 'lodash-es';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { clearAllIndexedDB } from '@/utils/indexedDB';

const DEFAULT_IMAGE = '/logo-hiraoka.webp';

const modules = [Autoplay];
const categoriesOpen = ref(false);
const store = useStore();
const searchStore = useSearchStore();
const cartStore = useCartStore();
const router = useRouter();
const route = useRoute();
const searchQuery = ref('');
const isLoading = ref(false);

const searchResults = computed(() => searchStore.searchResults);
const categoriesResults = computed(() => searchResults.value.filter(result => result.type === 'category'));
const productsResults = computed(() => searchResults.value.filter(result => result.type === 'product'));

// Configurar metadatos reactivos con Unhead
useHead({
  title: computed(() => document.title || 'Mi Tienda'), // Reactivo al título del documento
  meta: [
    { name: 'description', content: 'Explora una amplia variedad de productos en Mi Tienda.' },
    { property: 'og:title', content: 'Mi Tienda' },
    { property: 'og:description', content: 'Explora una amplia variedad de productos en Mi Tienda.' },
    { property: 'og:image', content: DEFAULT_IMAGE },
    { name: 'robots', content: 'index, follow' },
  ],
  link: [
    { rel: 'canonical', href: computed(() => window.location.origin + route.path) },
  ],
});

onMounted(async () => {
  try {
    if (!store.categories.length) {
      await store.fetchCategoriesMinimal();
    }
  } catch (error) {
    console.error('❌ Error al inicializar categorías:', error);
  }
});

const toggleCategories = () => {
  categoriesOpen.value = !categoriesOpen.value;
};

const closeCategories = () => {
  categoriesOpen.value = false;
};

watch(() => route.path, () => {
  if (categoriesOpen.value) {
    categoriesOpen.value = false;
    console.log('Menú de categorías cerrado por cambio de ruta');
  }
});

const filterResults = debounce(async () => {
  if (searchQuery.value.trim().length > 2) {
    isLoading.value = true;
    await searchStore.searchProducts(searchQuery.value);
    isLoading.value = false;
  } else {
    searchStore.clearSearch();
    isLoading.value = false;
  }
}, 300);

const goToResult = async (result) => {
  searchQuery.value = '';
  searchStore.clearSearch();
  if (result.type === 'product') await router.push(`/producto/${result.slug}`);
  else if (result.type === 'category') await router.push(`/categoria/${result.slug}`);
};

const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/buscar', query: { q: searchQuery.value } });
    searchQuery.value = '';
    searchStore.clearSearch();
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  searchStore.clearSearch();
  isLoading.value = false;
};

const cartItemCount = computed(() => cartStore.cartItemCount);

const clearCache = async () => {
  sessionStorage.clear();
  localStorage.clear();
  await clearAllIndexedDB();
  searchStore.clearSearch();
  store.clearState();
  await store.fetchCategoriesMinimal();
  router.go(0);
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>