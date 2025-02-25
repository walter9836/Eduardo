<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Nombre de la categoría seleccionada como h1 -->
    <h1 class="text-3xl font-bold text-gray-800 mb-6">{{ categoryTitle }}</h1>

    <!-- 📌 FILTROS + LISTA DE PRODUCTOS -->
    <div class="flex gap-6">
      <!-- 📌 FILTRO: Enlace de Categoría + Precio -->
      <aside class="hidden md:block w-1/4">
        <div class="border p-4 rounded-md shadow-md bg-white">
          <!-- ✅ Enlace de la categoría actual -->
          <router-link
            :to="`/categoria/${categorySlug}`"
            class="text-orange-500 font-semibold hover:underline block mb-4"
          >
            {{ categoryTitle }}
          </router-link>

          <!-- 🔹 Filtro de Precio -->
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Filtrar por Precio</h3>
          <div>
            <label class="block text-gray-700 font-medium">Precio Máximo</label>
            <input
              type="range"
              v-model="priceFilter"
              min="0"
              max="5000"
              step="50"
              @input="applyFilters"
              class="w-full"
            />
            <p class="text-gray-600 text-sm mt-1">S/ {{ priceFilter }}</p>
          </div>

          <!-- 🔄 Botón para limpiar el filtro -->
          <button
            @click="clearFilters"
            class="w-full bg-gray-400 text-white font-semibold py-2 mt-4 rounded-md hover:bg-gray-500 transition"
          >
            Limpiar Filtros
          </button>
        </div>
      </aside>

      <!-- 🛍️ LISTADO DE PRODUCTOS -->
      <div class="w-full md:w-3/4">
        <div
          v-if="filteredProducts.length > 0"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="relative border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition h-[480px] flex flex-col group"
          >
            <router-link
              :to="`/producto/${product.slug}`"
              class="block h-[45%] flex justify-center items-center p-3"
            >
              <img
                :src="product.image"
                :alt="product.name"
                class="max-h-full max-w-full object-contain transition-transform duration-200"
                loading="lazy"
              />
            </router-link>

            <div class="p-4 flex flex-col flex-grow">
              <h2 class="text-lg font-semibold text-gray-800 line-clamp-2 flex-grow">
                {{ product.name }}
              </h2>
            </div>

            <div class="absolute bottom-3 left-0 w-full flex flex-col items-center">
              <p class="text-orange-600 font-bold text-lg">S/ {{ product.price }}</p>

              <!-- Botón Agregar al Carrito con texto adaptado para móvil -->
              <button
                @click="addToCart(product)"
                class="md:opacity-0 group-hover:opacity-100 opacity-100 bg-orange-500 text-white font-semibold py-2 px-4 text-sm w-3/4 sm:w-11/12 text-center rounded-full mt-2 transition-all duration-200 hover:bg-orange-600 hover:scale-105 active:scale-95"
              >
                <span class="block sm:hidden">Agregar</span>
                <span class="hidden sm:block">Agregar al Carrito</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ❌ Si no hay productos en la categoría -->
        <div v-else class="text-center text-gray-500 py-10">
          No hay productos disponibles con estos filtros.
        </div>
      </div>
    </div>
    <!-- 🔹 Cierra el contenedor flexible -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from '@/store/store';
import { useCartStore } from '@/store/cartStore';

const route = useRoute();
const store = useStore();
const cartStore = useCartStore();

const categorySlug = computed(() => route.params.slug);
const categoryTitle = ref('');
const allProducts = ref([]);
const filteredProducts = ref([]);
const priceFilter = ref(5000); // Precio máximo por defecto

// Función para actualizar el nombre de la categoría
const updateCategoryTitle = async () => {
  let categories = store.categories;

  if (categories.length === 0) {
    await store.fetchCategories();
    categories = store.categories;
  }

  const category = categories.find((cat) => cat.slug === categorySlug.value);
  if (category) {
    categoryTitle.value = category.name;
    sessionStorage.setItem(`category_${categorySlug.value}`, category.name);
  }
};

// Función para cargar productos de la categoría seleccionada
const loadProducts = async () => {
  updateCategoryTitle();

  const cachedProducts = sessionStorage.getItem(`products_${categorySlug.value}`);
  if (cachedProducts) {
    allProducts.value = JSON.parse(cachedProducts);
  } else {
    allProducts.value = await store.fetchProductsByCategory(categorySlug.value);
    sessionStorage.setItem(`products_${categorySlug.value}`, JSON.stringify(allProducts.value));
  }

  applyFilters();
};

// Aplicar filtros de precio
const applyFilters = () => {
  filteredProducts.value = allProducts.value.filter((product) => {
    return product.price <= Number(priceFilter.value);
  });
};

// Limpiar filtros
const clearFilters = () => {
  priceFilter.value = 5000;
  applyFilters();
};

// Agregar productos al carrito
const addToCart = (product) => {
  cartStore.addItem(product);
};

// Observar cambios en la categoría y actualizar los datos
watch(categorySlug, async () => {
  await updateCategoryTitle();
  await loadProducts();
});

// Ejecutar al montar el componente
onMounted(loadProducts);
</script>