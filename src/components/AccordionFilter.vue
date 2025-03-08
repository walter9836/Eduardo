<template>
  <div class="mb-4">
    <button
      @click="expanded = !expanded"
      class="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex justify-between items-center"
    >
      <span>{{ attribute.name }}</span>
      <span>{{ expanded ? '−' : '+' }}</span>
    </button>
    <div v-if="expanded" class="mt-2 pl-4">
      <div v-for="option in attribute.options" :key="option" class="flex items-center">
        <input
          type="radio"
          :id="`${attribute.slug}-${option}`"
          :value="option"
          v-model="selectedOption"
          @change="$emit('change')"
          class="mr-2"
        />
        <label :for="`${attribute.slug}-${option}`">{{ option }}</label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

defineProps({
  attribute: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['change', 'update:expanded']); // Definir los eventos 'change' y 'update:expanded'

const selectedOption = defineModel('modelValue', { default: '' }); // Usar string por defecto para radios
const expanded = defineModel('expanded', { default: false });

// Emite el cambio en selectedOption
watch(selectedOption, (newOption) => {
  emit('change', newOption); // Emitir solo la opción seleccionada como string
}, { immediate: true });

// Emitir el cambio en expanded (opcional, ya que defineModel lo maneja automáticamente)
watch(expanded, (newVal) => {
  emit('update:expanded', newVal);
});
</script>