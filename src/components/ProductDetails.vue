<template>
  <div class="space-y-4">
    <!-- Nombre del producto y SKU -->
    <div>
      <h1 class="text-3xl font-bold text-gray-800">{{ product?.name || 'Producto sin nombre' }}</h1>
      <p v-if="product?.sku !== undefined" class="text-sm text-gray-500">SKU: {{ product.sku }}</p>
    </div>

    <!-- Precio con descuento y badge -->
    <div class="flex items-center space-x-3">
      <p v-if="product?.sale_price" class="text-2xl text-orange-600 font-semibold">
        S/ {{ product.sale_price }}
      </p>
      <p v-if="product?.regular_price && product?.sale_price" class="text-lg text-gray-500 line-through">
        S/ {{ product.regular_price }}
      </p>
      <p v-else class="text-2xl text-orange-600 font-semibold">
        S/ {{ product?.price || '0.00' }}
      </p>
      <span
        v-if="discount > 0"
        class="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full"
      >
        -{{ discount }}%
      </span>
      <span
        v-if="stockStatus === 'instock'"
        class="inline-block px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full"
      >
        Solo {{ product?.stock_quantity }} en stock
      </span>
      <span
        v-else-if="stockStatus === 'outofstock'"
        class="inline-block px-2 py-1 text-xs font-semibold text-white bg-gray-500 rounded-full"
      >
        Sin stock
      </span>
      <span
        v-else-if="stockStatus === 'onbackorder'"
        class="inline-block px-2 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-full"
      >
        Disponible bajo pedido
      </span>
    </div>

    <!-- Ahorros -->
    <p v-if="savings > 0" class="text-sm text-green-600">
      ¡Ahorras S/ {{ savings }}!
    </p>

    <!-- Mensaje de urgencia (solo si hay stock inmediato) -->
    <p v-if="stockStatus === 'instock'" class="text-sm text-red-600">
      ¡Apúrate! Quedan pocas unidades disponibles.
    </p>

    <!-- Despacho a domicilio (solo si hay stock inmediato) -->
    <div v-if="stockStatus === 'instock'" class="flex items-center space-x-2 text-sm text-gray-700">
      <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          d="M5 3a2 2 0 00-2 2v1H2v2h1v6a2 2 0 002 2h2a1 1 0 001-1v-3h4v3a1 1 0 001 1h2a2 2 0 002-2V8h1V6h-1V5a2 2 0 00-2-2H5zm10 8h-4V8h4v3zm-6-3v3H5V8h4z"
        />
      </svg>
      <p>
        Despacho a domicilio:
        <span class="font-semibold text-blue-600">
          {{ product?.stock_quantity }} disponibles para delivery
        </span>
      </p>
    </div>

    <!-- Botón -->
    <button
      @click="$emit('add-to-cart', product)"
      class="mt-4 bg-orange-500 text-white font-semibold py-2 px-6 rounded-md hover:bg-orange-600 transition"
      :disabled="!product?.id || stockStatus === 'outofstock'"
    >
      Agregar al Carrito
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';

// Definir las props
const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
});
defineEmits(['add-to-cart']);

// Depuración para verificar que product llega
onMounted(() => {
  console.log('📋 ProductDetails montado con product:', props.product);
});

// Determinar el estado del stock
const stockStatus = computed(() => {
  if (!props.product) return 'outofstock';

  const { manage_stock, stock_quantity, stock_status } = props.product;

  // Si no se gestiona el stock, confiamos en stock_status
  if (!manage_stock) {
    return stock_status || 'outofstock';
  }

  // Si stock_quantity no está definido, usamos stock_status
  if (stock_quantity === null || stock_quantity === undefined) {
    return stock_status || 'outofstock';
  }

  // Si hay stock disponible, forzamos "instock"
  if (stock_quantity > 0) {
    return 'instock';
  }

  // Para stock_quantity = 0, respetamos stock_status ("outofstock" o "onbackorder")
  return stock_status || 'outofstock';
});

// Calcular descuento y ahorros
const discount = computed(() => {
  if (!props.product || !props.product.regular_price || !props.product.sale_price) {
    return 0;
  }
  const regular = parseFloat(props.product.regular_price);
  const sale = parseFloat(props.product.sale_price);
  if (regular > sale) {
    return Math.round(((regular - sale) / regular) * 100);
  }
  return 0;
});

const savings = computed(() => {
  if (!props.product || !props.product.regular_price || !props.product.sale_price) {
    return 0;
  }
  const regular = parseFloat(props.product.regular_price);
  const sale = parseFloat(props.product.sale_price);
  if (regular > sale) {
    return (regular - sale).toFixed(2);
  }
  return 0;
});
</script>