<template>
  <div class="mt-12 border-t pt-6">
    <div class="flex items-center gap-4 mb-4">
      <button
        @click="localActiveSection = 'description'"
        :class="{ 'bg-orange-500 text-white': localActiveSection === 'description', 'bg-gray-200 text-gray-700': localActiveSection !== 'description' }"
        class="px-4 py-1 rounded-md font-semibold transition hover:bg-orange-600"
      >
        Descripción
      </button>
      <button
        @click="localActiveSection = 'technical'"
        :class="{ 'bg-orange-500 text-white': localActiveSection === 'technical', 'bg-gray-200 text-gray-700': localActiveSection !== 'technical' }"
        class="px-4 py-1 rounded-md font-semibold transition hover:bg-orange-600"
      >
        Datos Técnicos
      </button>
    </div>
    <div class="text-gray-600">
      <p v-if="localActiveSection === 'description'" v-html="product?.description || 'Sin descripción disponible'"></p>
      <div v-if="localActiveSection === 'technical'">
        <div v-if="product?.attributes?.length > 0">
          <div v-for="attribute in product.attributes" :key="attribute.id" class="mb-2">
            <strong class="text-gray-700">{{ attribute.name || 'Nombre no disponible' }}:</strong>
            <span class="ml-2">{{ attribute.options?.join(', ') || 'Sin opciones' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  product: Object,
});
const localActiveSection = defineModel('activeSection');
</script>