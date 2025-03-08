<template>
  <div class="bg-black text-white text-center py-2 w-full fixed top-0 left-0 z-[60] overflow-hidden h-10">
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :space-between="0"
      :loop="true"
      :autoplay="{ delay: 4000, disableOnInteraction: false }"
      class="h-full w-full"
    >
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

  <header
    class="bg-white text-black p-3 flex items-center justify-between shadow-md w-full px-4 md:px-6 relative z-50 mt-[44px] md:mt-[44px]"
  >
    <router-link to="/" class="flex items-center">
      <img src="/logo-hiraoka.webp" alt="Logo Mi Tienda" class="w-28 md:w-40 h-auto" />
    </router-link>

    <div class="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-full max-w-lg">
      <div class="relative w-full">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar productos o categorías..."
          class="w-full px-5 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm shadow-md"
          @input="filterResults"
          @keyup.enter="performSearch"
        />
        <button
          @click="performSearch"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition"
        >
          <img src="/lupa.svg" alt="Buscar" class="w-5 h-5" />
        </button>
        <div
          v-if="searchResults.length > 0"
          class="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-md z-50 mt-1 max-h-64 overflow-y-auto"
        >
          <ul class="py-2">
            <li
              v-for="result in searchResults"
              :key="result.id"
              class="px-4 py-2 hover:bg-orange-100 cursor-pointer transition"
              @click="goToResult(result)"
            >
              {{ result.name }} {{ result.type === 'category' ? '(Categoría)' : '' }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex items-center ml-auto space-x-4">
      <div class="relative">
        <button
          @click="toggleCategories"
          class="group flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 transition-all duration-300 text-gray-700 text-sm"
        >
          <span class="font-medium text-xs md:text-sm text-gray-800">Categorías</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 text-orange-500 transition-transform duration-300"
            :class="{ 'rotate-180': categoriesOpen }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <transition name="fade">
          <div
            v-show="categoriesOpen"
            class="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
          >
            <div class="py-2">
              <router-link
                to="/categorias"
                class="block text-left px-3 py-2 text-xs md:text-sm font-medium text-gray-700 hover:bg-orange-100 transition-all duration-200 active:bg-orange-200"
                @click="closeCategories"
              >
                Ver todas las categorías
              </router-link>
              <div class="grid gap-1 max-h-[50vh] overflow-y-auto px-3">
                <router-link
                  v-for="category in categories"
                  :key="category.id"
                  :to="`/categoria/${category.slug}`"
                  class="flex items-center px-3 py-2 hover:bg-orange-50 text-gray-700 transition-all duration-200 group rounded-md active:bg-orange-200"
                  @click="closeCategories"
                >
                  <span
                    class="text-xs md:text-sm font-medium text-gray-800 group-hover:text-orange-600 transition-colors"
                  >
                    {{ category.name }}
                  </span>
                </router-link>
              </div>
            </div>
          </div>
        </transition>
      </div>
      <router-link
        to="/carrito"
        class="relative flex items-center text-gray-700 hover:text-orange-500 transition"
      >
        <img src="/carritodesk.svg" alt="Carrito" class="w-6 md:w-7 h-auto" />
        <span
          v-if="cartItemCount > 0"
          class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-md"
        >
          {{ cartItemCount }}
        </span>
      </router-link>
    </div>
  </header>

  <div class="w-full px-5 md:px-6 h-15 md:hidden flex justify-center items-center mt-2">
    <div class="relative w-full max-w-xs">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar productos o categorías..."
        class="w-full px-6 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm shadow-sm"
        @input="filterResults"
        @keyup.enter="performSearch"
      />
      <button
        @click="performSearch"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition"
      >
        <img src="/lupa.svg" alt="Buscar" class="w-5 h-5" />
      </button>
      <div
        v-if="searchResults.length > 0"
        class="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-md z-50 mt-1 max-h-64 overflow-y-auto"
      >
        <ul class="py-2">
          <li
            v-for="result in searchResults"
            :key="result.id"
            class="px-4 py-2 hover:bg-orange-100 cursor-pointer transition"
            @click="goToResult(result)"
          >
            {{ result.name }} {{ result.type === 'category' ? '(Categoría)' : '' }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/cartStore';
import { useStore } from '@/store/store';
import { useSearchStore } from '@/store/searchStore';
import { debounce } from 'lodash-es';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

const modules = [Autoplay];

const categoriesOpen = ref(false);
const store = useStore();
const searchStore = useSearchStore();
const cartStore = useCartStore();
const router = useRouter();
const searchQuery = ref('');
const searchResults = computed(() => {
  console.log('🔍 searchResults actualizado:', searchStore.searchResults);
  return searchStore.searchResults;
});

const categories = computed(() => {
  const uniqueCategories = [];
  const seenSlugs = new Set();
  store.categories.forEach(cat => {
    if (!seenSlugs.has(cat.slug)) {
      seenSlugs.add(cat.slug);
      uniqueCategories.push(cat);
    }
  });
  return uniqueCategories;
});

onMounted(async () => {
  try {
    await searchStore.initializeStore();
    if (store.categories.length === 0) {
      await store.fetchCategoriesMinimal();
    }
    console.log('🔍 Categorías iniciales cargadas:', store.categories);
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

const filterResults = debounce(async () => {
  console.log('🔍 Filtrando con consulta:', searchQuery.value);
  if (searchQuery.value.length > 2) {
    await searchStore.searchProducts(searchQuery.value);
    console.log('🔍 Resultados después de buscar:', searchStore.searchResults);
  } else {
    searchStore.clearSearch();
    console.log('🔍 Consulta demasiado corta, limpiando resultados');
  }
}, 300);

const goToResult = async (result) => {
  console.log('🔍 Intentando navegar a:', result);
  searchQuery.value = '';
  searchStore.clearSearch();
  try {
    if (result.type === 'product') {
      await router.push(`/producto/${result.slug}`);
      console.log('🔍 Navegación exitosa a producto:', result.slug);
    } else if (result.type === 'category') {
      await router.push(`/categoria/${result.slug}`);
      console.log('🔍 Navegación exitosa a categoría:', result.slug);
    }
  } catch (error) {
    console.error('❌ Error al navegar:', error);
  }
};

const performSearch = () => {
  if (searchQuery.value.trim() !== '') {
    router.push({ path: '/buscar', query: { q: searchQuery.value } });
    searchStore.clearSearch();
    console.log('🔍 Búsqueda completa iniciada para:', searchQuery.value);
  }
};

const cartItemCount = computed(() => cartStore.cartItemCount);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>