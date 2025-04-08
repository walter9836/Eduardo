<!-- src/components/Breadcrumb.vue -->
<template>
  <nav class="text-gray-500 text-sm mb-4" aria-label="Navegación de migas de pan">
    <div class="flex flex-wrap items-center space-x-2">
      <router-link to="/" class="hover:text-orange-500">Inicio</router-link>
      
      <span v-if="searchTerm || category || product" class="mx-2">/</span>
      
      <router-link
        v-if="category && !searchTerm"
        :to="`/categoria/${category?.slug || ''}`"
        class="hover:text-orange-500 font-medium"
      >
        {{ category?.name || 'Categoría' }}
      </router-link>
      
      <span v-else-if="searchTerm" class="text-gray-700 font-medium">
        Búsqueda: {{ searchTerm }}
      </span>
      
      <span v-if="product" class="mx-2">/</span>
      
      <span v-if="product" class="text-gray-700">
        {{ product?.name || 'Producto' }}
      </span>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  searchTerm: String, // Para búsquedas en SearchView.vue
  category: Object,   // Para categorías en CategoriaView.vue
  product: Object,    // Para productos en ProductoView.vue
});
</script>

<style scoped>
/* Ajustes opcionales */
</style>