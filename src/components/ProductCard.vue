<template>
  <div class="relative border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all h-[520px] flex flex-col group bg-white">
    <router-link
      v-if="product.type === 'product'"
      :to="`/producto/${product.slug}`"
      class="h-[60%] flex justify-center items-center p-3 bg-white"
    >
      <img
        :src="imageSource"
        :alt="product.name || 'Producto sin nombre'"
        class="w-full h-full object-contain transition-transform duration-200 hover:scale-105"
        loading="lazy"
        @error="handleImageError"
      />
    </router-link>
    <router-link
      v-else-if="product.type === 'category'"
      :to="`/categoria/${product.slug}`"
      class="h-[60%] flex justify-center items-center p-3 bg-white"
    >
      <img
        :src="imageSource"
        :alt="product.name || 'Categoría sin nombre'"
        class="w-full h-full object-contain transition-transform duration-200 hover:scale-105"
        loading="lazy"
        @error="handleImageError"
      />
    </router-link>
    <div class="p-4 flex flex-col flex-grow">
      <h2 class="text-lg font-semibold text-gray-800 line-clamp-2 flex-grow">
        {{ product.name || 'Sin nombre' }}
      </h2>
    </div>
    <div class="absolute bottom-3 left-0 w-full flex flex-col items-center">
      <p v-if="product.type === 'product'" class="text-orange-600 font-bold text-lg">
        S/ {{ product.price || 'N/A' }}
      </p>
      <button
        v-if="product.type === 'product'"
        @click="$emit('add-to-cart')"
        class="md:opacity-0 group-hover:opacity-100 opacity-100 bg-orange-500 text-white font-semibold py-2 px-4 text-sm w-3/4 sm:w-11/12 text-center rounded-full mt-2 transition-all duration-200 hover:bg-orange-600 hover:scale-105 active:scale-95"
      >
        <span class="block sm:hidden">Agregar</span>
        <span class="hidden sm:block">Agregar al Carrito</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  product: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const imageSource = computed(() => {
  if (Array.isArray(props.product.images) && props.product.images.length > 0) {
    return props.product.images[0]?.src || '/placeholder.jpg';
  }
  if (props.product.image) {
    return props.product.image;
  }
  return '/placeholder.jpg';
});

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg';
};

defineEmits(['add-to-cart']);
</script>