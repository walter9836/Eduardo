<template>
  <nav class="text-gray-500 text-sm mb-4">
    <router-link to="/" class="hover:text-orange-500">Inicio</router-link>
    <span class="mx-2">/</span>
    <router-link
      v-if="category"
      :to="`/categoria/${category?.slug || ''}`"
      class="hover:text-orange-500 font-medium"
    >
      {{ category?.name || 'Categoría' }}
    </router-link>
    <span class="mx-2">/</span>
    <span class="text-gray-700">{{ product?.name || 'Producto' }}</span>
  </nav>
</template>

<script setup>
defineProps({
  product: Object,
  category: Object,
});
</script>