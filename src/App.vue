<template>
  <div class="app">
    <AppHeader />

    <!-- 🔄 Mostrar spinner mientras se cargan los datos -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <!-- 🚀 Si hay error, mostrar un mensaje -->
    <div v-else-if="error" class="error-container">
    </div>

    <!-- 🔥 Mostrar contenido cuando `loading` es falso -->
    <router-view v-else class="page-content" />

    <Footer />
    <CookieConsent v-show="mounted" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from '@/store/store';
import { useCartStore } from '@/store/cartStore';
import AppHeader from './components/AppHeader.vue';
import Footer from './components/Footer.vue';
import CookieConsent from './components/CookieConsent.vue';

const store = useStore();
const cartStore = useCartStore();
const mounted = ref(false);
const loading = ref(true);
const error = ref(false);

onMounted(async () => {
  try {
    console.log("🚀 Inicializando la app...");

    // ✅ Intentamos cargar las categorías
    try {
      if (!sessionStorage.getItem('categories')) {
        console.log("🔄 Cargando categorías desde la API...");
        await store.fetchCategories();
      } else {
        console.log("⚡ Cargando categorías desde sessionStorage.");
        store.categories = JSON.parse(sessionStorage.getItem('categories'));
      }
    } catch (err) {
      console.error("⚠️ Error al cargar categorías:", err);
      error.value = true; // Pero seguimos ejecutando el resto
    }

    // ✅ Intentamos cargar el carrito
    try {
      await cartStore.loadCart();
    } catch (err) {
      console.error("⚠️ Error al cargar el carrito:", err);
      error.value = true; // Pero seguimos ejecutando la app
    }

    console.log("✅ Datos cargados correctamente.");
  } catch (err) {
    console.error("❌ Error crítico en la app:", err);
    error.value = true;
  } finally {
    mounted.value = true;
    loading.value = false;
  }
});
</script>
