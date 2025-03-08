<template>
  <div class="border p-4 rounded-md shadow-md bg-white">
    <router-link
      :to="`/categoria/${categorySlug}`"
      class="text-orange-500 font-semibold hover:underline block mb-4"
    >
      {{ categoryTitle }}
    </router-link>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Precio</label>
      <select
        v-model="localFilters.price"
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
      >
        <option v-for="range in priceRanges" :key="range.value" :value="range.value">
          {{ range.label }}
        </option>
      </select>
    </div>

    <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">Atributos</h3>
    <AccordionFilter
      v-for="attribute in uniqueAttributes"
      :key="attribute.slug"
      :attribute="attribute"
      v-model="localFilters.attributes[attribute.slug]"
      v-model:expanded="localExpandedAttributes[attribute.slug]"
      @update:expanded="$emit('update:expandedAttributes', localExpandedAttributes)"
      @change="updateFilters" 
    />
    <div class="mt-4 flex gap-2">
      <button
        @click="$emit('apply-filters')"
        class="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-orange-600 transition"
      >
        Filtrar
      </button>
      <button
        @click="$emit('clear-filters')"
        class="w-full bg-gray-400 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-500 transition"
      >
        Limpiar Filtros
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import AccordionFilter from './AccordionFilter.vue';

defineProps({
  categorySlug: String,
  categoryTitle: String,
  uniqueAttributes: Array,
});

const localFilters = defineModel('filters');
const localExpandedAttributes = defineModel('expandedAttributes');

// Actualiza los filtros sin disparar el filtrado automático
const updateFilters = () => {
  // No emitimos 'apply-filters' aquí, solo actualizamos el modelo
};

const priceRanges = [
  { value: '', label: 'Todos' },
  { value: '0-100', label: 'S/ 0 - S/ 100' },
  { value: '100-500', label: 'S/ 100 - S/ 500' },
  { value: '500-1000', label: 'S/ 500 - S/ 1000' },
  { value: '1000+', label: 'S/ 1000+' },
];
</script>

<style scoped>
/* Puedes ajustar el estilo si quieres que los botones tengan el mismo tamaño */
button {
  flex: 1; /* Hace que ambos botones ocupen el mismo espacio */
}
</style>