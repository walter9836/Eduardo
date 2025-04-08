<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    <!-- Mostrar esqueletos si no hay productos o están cargando -->
    <div
      v-if="!products || products.length === 0"
      v-for="n in 8"
      :key="'skeleton-' + n"
    >
      <div class="bg-gray-200 h-48 w-full rounded-md"></div> <!-- Imagen -->
      <div class="mt-2 space-y-2">
        <div class="bg-gray-200 h-4 w-3/4 rounded"></div> <!-- Título -->
        <div class="bg-gray-200 h-4 w-1/2 rounded"></div> <!-- Precio -->
      </div>
    </div>

    <!-- Mostrar productos reales cuando estén disponibles -->
    <ProductCard
      v-else
      v-for="product in products"
      :key="product.id"
      :product="product"
      @add-to-cart="$emit('add-to-cart', product)"
    />
  </div>
</template>

<script setup>
import ProductCard from './ProductCard.vue';
defineProps(['products']);
defineEmits(['add-to-cart']);
</script>

<style scoped>
/* Opcional: Ajustar la animación del esqueleto si Tailwind no es suficiente */
.animate-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>