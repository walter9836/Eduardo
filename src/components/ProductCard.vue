<template>
  <div class="relative border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition h-[520px] flex flex-col group bg-white">
    <router-link
      :to="`/producto/${product.slug}`"
      class="block h-[60%] flex justify-center items-center p-3 bg-white"
    >
      <img
        :src="product.images[0]?.src || '/placeholder.jpg'"
        :alt="product.name"
        class="w-full h-full object-contain transition-transform duration-200 hover:scale-105"
        loading="lazy"
      />
    </router-link>
    <div class="p-4 flex flex-col flex-grow">
      <h2 class="text-lg font-semibold text-gray-800 line-clamp-2 flex-grow">
        {{ product.name }}
      </h2>
    </div>
    <div class="absolute bottom-3 left-0 w-full flex flex-col items-center">
      <p class="text-orange-600 font-bold text-lg">S/ {{ product.price }}</p>
      <button
        @click="$emit('add-to-cart')"
        class="md:opacity-0 group-hover:opacity-100 opacity-100 bg-orange-500 text-white font-semibold py-2 px-4 text-sm w-3/4 sm:w-11/12 text-center rounded-full mt-2 transition-all duration-200 hover:bg-orange-600 hover:scale-105 active:scale-95"
      >
        <span class="block sm:hidden">Agregar</span>
        <span class="hidden sm:block">Agregar al Carrito</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps(['product']);
defineEmits(['add-to-cart']);
</script>