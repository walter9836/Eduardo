<template>
  <div class="product-image-container relative">
    <!-- Imagen principal -->
    <img 
      :src="currentImage.src" 
      :alt="currentImage.alt" 
      class="w-full h-auto rounded-lg object-cover"
    >
    
    <!-- Botones de navegación -->
    <button 
      v-if="images.length > 1"
      @mousedown="prevImage"
      @mouseup="resetButtonState"
      @mouseleave="resetButtonState"
      class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 focus:outline-none transition-transform duration-150"
      :class="{ 'scale-90': isPrevClicked }"
      aria-label="Imagen anterior"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button 
      v-if="images.length > 1"
      @mousedown="nextImage"
      @mouseup="resetButtonState"
      @mouseleave="resetButtonState"
      class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 focus:outline-none transition-transform duration-150"
      :class="{ 'scale-90': isNextClicked }"
      aria-label="Siguiente imagen"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Miniaturas más grandes -->
    <div v-if="images.length > 1" class="mt-10 grid grid-cols-5 gap-4">
      <img 
        v-for="(img, index) in images" 
        :key="index"
        :src="img.src"
        :alt="img.alt"
        class="w-full h-32 object-cover rounded cursor-pointer hover:opacity-75"
        :class="{ 'ring-2 ring-blue-500': currentIndex === index }"
        @click="currentIndex = index"
      >
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => [{ src: '/placeholder.jpg', alt: 'Producto no encontrado' }]
  },
  alt: String
});

const currentIndex = ref(0);
const isPrevClicked = ref(false);
const isNextClicked = ref(false);

const currentImage = computed(() => props.images[currentIndex.value] || { src: '/placeholder.jpg', alt: 'Producto no encontrado' });

const nextImage = () => {
  isNextClicked.value = true;
  currentIndex.value = (currentIndex.value + 1) % props.images.length;
};

const prevImage = () => {
  isPrevClicked.value = true;
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length;
};

const resetButtonState = () => {
  isPrevClicked.value = false;
  isNextClicked.value = false;
};
</script>

<style scoped>
.product-image-container {
  position: relative;
  max-width: 100%;
}
</style>