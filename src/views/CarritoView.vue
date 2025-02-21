<template>
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold text-gray-800"> Mi Carrito</h1>
  
      <div v-if="cart.length === 0" class="text-gray-500 text-center py-10">
        <p>Tu carrito está vacío.</p>
        <router-link to="/" class="text-orange-500 font-semibold hover:underline">
          ¡Explora productos!
        </router-link>
      </div>
  
      <div v-else class="grid gap-6">
        <div v-for="item in cart" :key="item.id" class="flex items-center justify-between border-b py-4">
          <div class="flex items-center space-x-4">
            <img :src="item.image" :alt="item.name" class="w-20 h-20 object-cover rounded-md">
            <div>
              <h2 class="text-lg font-semibold">{{ item.name }}</h2>
              <p class="text-orange-500 font-bold">S/ {{ item.price }}</p>
            </div>
          </div>
  
          <div class="flex items-center space-x-4">
            <button @click="decreaseQuantity(item.id)" class="px-3 py-1 bg-gray-300 rounded-md">-</button>
            <span class="text-lg">{{ item.quantity }}</span>
            <button @click="increaseQuantity(item.id)" class="px-3 py-1 bg-orange-500 text-white rounded-md">+</button>
            <button @click="removeItem(item.id)" class="ml-4 text-red-500 hover:text-red-700">🗑️</button>
          </div>
        </div>
  
        <div class="mt-6 flex justify-between items-center">
          <h3 class="text-xl font-semibold">Total: S/ {{ cartTotal }}</h3>
          <button @click="checkout" class="px-6 py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600">
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { useCartStore } from '@/store/cartStore';
  import { useRouter } from 'vue-router';
  
  const cartStore = useCartStore();
  const router = useRouter();
  
  // 📦 Obtener productos en el carrito
  const cart = computed(() => cartStore.cart);
  
  // 📦 Calcular total del carrito
  const cartTotal = computed(() => cartStore.cartTotal);
  
  // 📦 Aumentar cantidad de un producto
  const increaseQuantity = (productId) => {
    const item = cart.value.find((item) => item.id === productId);
    if (item) {
      item.quantity += 1;
      cartStore.saveCart();
    }
  };
  
  // 📦 Disminuir cantidad de un producto
  const decreaseQuantity = (productId) => {
    const item = cart.value.find((item) => item.id === productId);
    if (item && item.quantity > 1) {
      item.quantity -= 1;
      cartStore.saveCart();
    } else {
      cartStore.removeItem(productId);
    }
  };
  
  // 📦 Eliminar producto del carrito
  const removeItem = (productId) => {
    cartStore.removeItem(productId);
  };
  
  // 📦 Proceder al checkout
  const checkout = () => {
    alert("¡Compra realizada con éxito!");
    cartStore.clearCart();
    router.push('/');
  };
  </script>
  
  <style scoped>
  /* 🚀 Estilos del carrito */
  button {
    transition: all 0.2s;
  }
  button:hover {
    transform: scale(1.05);
  }
  </style>
  