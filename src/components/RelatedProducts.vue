<template>
  <div v-if="products.length > 0" class="mt-12">
    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Productos Relacionados</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <ProductCard v-for="related in products" :key="related.id" :product="related" />
    </div>
  </div>
</template>

<script setup>
import ProductCard from './ProductCard.vue';
defineProps({
  products: Array,
});
</script>