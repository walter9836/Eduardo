<template>
    <div class="container mx-auto px-4 py-6">
      
      <div v-if="product">
        <!-- 📌 Enlace de navegación (Inicio > Categoría > Producto) -->
        <nav class="text-gray-500 text-sm mb-4">
          <router-link to="/" class="hover:text-orange-500">Inicio</router-link> 
          <span class="mx-2">/</span>
          <router-link 
            v-if="productCategory" 
            :to="`/categoria/${productCategory.slug}`" 
            class="hover:text-orange-500 font-medium"
          >
            {{ productCategory.name }}
          </router-link>
          <span class="mx-2">/</span>
          <span class="text-gray-700">{{ product.name }}</span>
        </nav>
  
        <!-- 📌 Contenedor principal: Imagen a la izquierda, info a la derecha -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <!-- 🖼 Imagen del producto (Izquierda) -->
          <div class="flex justify-center">
            <img :src="product.image" :alt="product.name" class="w-full max-w-md object-contain shadow-md rounded-lg" />
          </div>
  
          <!-- ℹ️ Información del Producto (Derecha) -->
          <div>
            <h1 class="text-3xl font-bold text-gray-800">{{ product.name }}</h1>
            <p class="text-lg text-orange-600 font-semibold mt-2">S/ {{ product.price }}</p>
  
            <!-- 🛒 Botón Agregar al Carrito -->
            <button
              @click="addToCart(product)"
              class="mt-4 bg-orange-500 text-white font-semibold py-2 px-6 rounded-md hover:bg-orange-600 transition"
            >
               Agregar al Carrito
            </button>
          </div>
  
        </div>
  
        <!-- 📝 Descripción del Producto (Abajo) -->
        <div class="mt-8 border-t pt-6">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">Descripción</h2>
          <p class="text-gray-600">{{ product.description }}</p>
        </div>
      </div>
  
      <!-- 🔥 Productos Relacionados -->
      <div v-if="relatedProducts.length > 0" class="mt-12">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">Productos Relacionados</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="related in relatedProducts" :key="related.id" class="border p-4 rounded-lg shadow-md">
            <router-link :to="`/producto/${related.slug}`">
              <img :src="related.image" :alt="related.name" class="w-full h-32 object-contain" />
              <h3 class="text-md font-semibold text-gray-700 mt-2">{{ related.name }}</h3>
              <p class="text-orange-600 font-bold text-sm">S/ {{ related.price }}</p>
            </router-link>
          </div>
        </div>
      </div>
  
      <!-- ❌ Si el producto no existe -->
      <div v-else-if="!loading && !product" class="text-center text-gray-500 py-10">
        Producto no encontrado.
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watchEffect, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { useStore } from '@/store/store';
  import { useCartStore } from '@/store/cartStore';
  
  const route = useRoute();
  const store = useStore();
  const cartStore = useCartStore();
  
  const product = ref(null);
  const productCategory = ref(null);
  const relatedProducts = ref([]);
  const loading = ref(true);
  
  // 🛒 Agregar al carrito
  const addToCart = (product) => {
    cartStore.addItem(product);
  };
  
  // ✅ Cargar producto y categoría
  const loadProduct = async () => {
    loading.value = true;
    const slug = route.params.slug;
  
    // 🚀 Cargar el producto desde el store
    product.value = await store.fetchProductBySlug(slug);
  
    // 📌 Obtener la categoría del producto
    if (product.value && product.value.categories.length > 0) {
      const categorySlug = product.value.categories[0];
      productCategory.value = store.categories.find(cat => cat.slug === categorySlug);
      
      // Cargar productos relacionados
      relatedProducts.value = await store.fetchRelatedProducts(categorySlug);
    }
  
    loading.value = false;
  };
  
  // 📌 Cargar producto cuando cambie la ruta
  watchEffect(() => {
    loadProduct();
  });
  
  onMounted(loadProduct);
  </script>
  