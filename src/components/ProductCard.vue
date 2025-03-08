<template>
  <div class="relative border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition h-[520px] flex flex-col group bg-white">
    <!-- Skeleton Version -->
    <template v-if="skeleton">
      <div class="h-[60%] p-3 bg-white">
        <div class="w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      <div class="p-4 flex flex-col flex-grow">
        <!-- Título skeleton -->
        <div class="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
        <div class="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>
      <div class="absolute bottom-3 left-0 w-full flex flex-col items-center">
        <!-- Precio skeleton -->
        <div class="h-7 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
        <!-- Botón skeleton -->
        <div class="h-10 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>
      </div>
    </template>

    <!-- Versión Normal del Producto -->
    <template v-else>
      <router-link
        :to="`/producto/${product.slug}`"
        class="block h-[60%] flex justify-center items-center p-3 bg-white"
      >
        <img
          :src="productImage"
          :alt="product.name"
          class="w-full h-full object-contain transition-transform duration-200 hover:scale-105"
          loading="lazy"
          @error="handleImageError"
        />
      </router-link>
      <div class="p-4 flex flex-col flex-grow">
        <h2 class="text-lg font-semibold text-gray-800 line-clamp-2 flex-grow">
          {{ product.name }}
        </h2>
      </div>
      <div class="absolute bottom-3 left-0 w-full flex flex-col items-center">
        <p class="text-orange-600 font-bold text-lg">S/ {{ product.price }}</p>
        <button
          @click="$emit('add-to-cart')"
          class="md:opacity-0 group-hover:opacity-100 opacity-100 bg-orange-500 text-white font-semibold py-2 px-4 text-sm w-3/4 sm:w-11/12 text-center rounded-full mt-2 transition-all duration-200 hover:bg-orange-600 hover:scale-105 active:scale-95"
        >
          <span class="block sm:hidden">Agregar</span>
          <span class="hidden sm:block">Agregar al Carrito</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  product: {
    type: Object,
    default: null
  },
  skeleton: {
    type: Boolean,
    default: false
  }
});

const imageError = ref(false);

// Computed property para manejar fallback de imagen
const productImage = computed(() => {
  if (imageError.value) {
    return '/placeholder.jpg';
  }
  return props.product?.image || '/placeholder.jpg';
});

// Manejador de error de imagen
const handleImageError = () => {
  console.warn(`Error loading image for product: ${props.product?.name}`);
  imageError.value = true;
};

defineEmits(['add-to-cart']);
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>