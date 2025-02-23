<template>
  <header class="bg-white text-black p-3 flex items-center justify-between shadow-md w-full px-4 md:px-6 relative">
    <!-- 🔹 Logo (Alineado a la izquierda) -->
    <router-link to="/" class="flex items-center">
      <img src="/logo-hiraoka.webp" alt="Logo Mi Tienda" class="w-28 md:w-40 h-auto" />
    </router-link>

    <!-- 🔍 Barra de búsqueda (Centrada en escritorio) -->
    <div class="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-full max-w-lg">
      <div class="relative w-full">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar productos..."
          class="w-full px-5 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm shadow-md"
          @input="filterResults"
          @keyup.enter="performSearch"
        />
        <button @click="performSearch"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition">
          <img src="/lupa.svg" alt="Buscar" class="w-5 h-5" />
        </button>

        <!-- 🔎 Resultados en Vivo -->
        <div v-if="searchResults.length > 0"
          class="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-md z-50 mt-1">
          <ul class="py-2">
            <li v-for="product in searchResults" :key="product.id"
              class="px-4 py-2 hover:bg-orange-100 cursor-pointer transition"
              @click="goToProduct(product.slug)">
              {{ product.name }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 🔹 Botón de Categorías y Carrito (A la derecha) -->
    <div class="flex items-center ml-auto space-x-4">
      <!-- 🔹 Botón de Categorías -->
      <div class="relative">
        <button @click="toggleCategories"
          class="group flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 transition-all duration-300 text-gray-700 text-sm">
          <span class="font-medium text-xs md:text-sm text-gray-800">Categorías</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-orange-500 transition-transform duration-300"
            :class="{ 'rotate-180': categoriesOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- 🔽 Menú desplegable de categorías -->
        <transition name="fade">
          <div v-show="categoriesOpen"
            class="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div class="py-2">
              <router-link to="/categorias"
                class="block text-left px-3 py-2 text-xs md:text-sm font-medium text-gray-700 hover:bg-orange-100 transition-all duration-200"
                @click="closeCategories">
                Ver todas las categorías
              </router-link>
              <div class="grid gap-1 max-h-[50vh] overflow-y-auto px-3">
                <router-link v-for="category in categories" :key="category.id" :to="`/categoria/${category.slug}`"
                  class="flex items-center px-3 py-2 hover:bg-orange-50 text-gray-700 transition-all duration-200 group rounded-md">
                  <span class="text-xs md:text-sm font-medium text-gray-800 group-hover:text-orange-600 transition-colors">
                    {{ category.name }}
                  </span>
                </router-link>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 🔹 Carrito -->
      <router-link to="/carrito" class="relative flex items-center text-gray-700 hover:text-orange-500 transition">
        <img src="/carritodesk.svg" alt="Carrito" class="w-6 md:w-7 h-auto" />
        <span v-if="cartItemCount > 0"
          class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-md">
          {{ cartItemCount }}
        </span>
      </router-link>
    </div>
  </header>

  <!-- 🔍 Barra de búsqueda en móviles (Debajo del header) -->
  <div class="w-full px-4 md:px-6 mt-2 md:hidden flex justify-center">
    <div class="relative w-full max-w-lg">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar productos..."
        class="w-full px-5 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm shadow-md"
        @input="filterResults"
        @keyup.enter="performSearch"
      />
      <button @click="performSearch"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition">
        <img src="/lupa.svg" alt="Buscar" class="w-5 h-5" />
      </button>

      <!-- 🔎 Resultados en Vivo -->
      <div v-if="searchResults.length > 0"
        class="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-md z-50 mt-1">
        <ul class="py-2">
          <li v-for="product in searchResults" :key="product.id"
            class="px-4 py-2 hover:bg-orange-100 cursor-pointer transition"
            @click="goToProduct(product.slug)">
            {{ product.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>





<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/cartStore';
import { useStore } from '@/store/store';
import { debounce } from 'lodash-es';

const categoriesOpen = ref(false);
const store = useStore();
const cartStore = useCartStore();
const router = useRouter();
const searchQuery = ref("");
const searchResults = ref([]);
const categories = ref([]);
const products = ref([]); // ✅ Ahora tenemos productos en memoria

// 🚀 Cargar categorías y productos al iniciar
onMounted(async () => {
  if (store.categories.length === 0) {
    await store.fetchCategories();
  }
  categories.value = store.categories;

  // ✅ Cargar productos para búsqueda
  products.value = await store.fetchAllProducts();
});

// 🔄 Abrir/cerrar categorías
const toggleCategories = () => {
  categoriesOpen.value = !categoriesOpen.value;
};

const closeCategories = () => {
  setTimeout(() => {
    categoriesOpen.value = false;
  }, 200);
};

// 🔍 **Búsqueda en Vivo con Debounce**
const filterResults = debounce(() => {
  if (searchQuery.value.length > 2) {
    searchResults.value = products.value.filter(product =>
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  } else {
    searchResults.value = [];
  }
}, 300);

// 🚀 **Redirigir a la página del producto**
const goToProduct = async (slug) => {
  searchResults.value = [];
  searchQuery.value = "";
  await router.push(`/producto/${slug}`);
};

// 🔎 **Redirigir a la página de búsqueda completa**
const performSearch = () => {
  if (searchQuery.value.trim() !== "") {
    router.push({ path: '/buscar', query: { q: searchQuery.value } });
    searchResults.value = [];
  }
};

// 📦 Contador del carrito
const cartItemCount = computed(() => cartStore.cartItemCount);
</script>
