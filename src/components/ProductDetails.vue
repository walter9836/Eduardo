<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800">{{ product?.name || 'Producto sin nombre' }}</h1>
    <p class="text-lg text-orange-600 font-semibold mt-2">S/ {{ product?.price || '0.00' }}</p>
    <button
      @click="$emit('add-to-cart', product)"
      class="mt-4 bg-orange-500 text-white font-semibold py-2 px-6 rounded-md hover:bg-orange-600 transition"
      :disabled="!product?.id"
    >
      Agregar al Carrito
    </button>
  </div>
</template>

<script setup>
defineProps({
  product: Object,
});
defineEmits(['add-to-cart']);
</script>