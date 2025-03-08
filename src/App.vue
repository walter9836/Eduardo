<template>
  <div class="app">
    <!-- Header siempre visible -->
    <AppHeader />

    <!-- Contenido principal con altura mínima inicial -->
    <div ref="contentWrapper" class="content-wrapper">
      <router-view v-slot="{ Component }">
        <keep-alive include="CategoriaView,HomePage">
          <component 
            :is="Component"
            :key="$route.fullPath"
            class="page-content"
          />
        </keep-alive>
      </router-view>
    </div>

    <!-- Footer con margen dinámico -->
    <Footer ref="footer" :style="{ marginTop: footerMarginTop + 'px' }" />

    <!-- Mensaje de error -->
    <div v-if="error" class="error-container">
      <p class="text-red-500">
        Error al cargar la aplicación. 
        <button @click="retryLoading" class="underline">Reintentar</button>
      </p>
    </div>

    <CookieConsent v-if="!error" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUpdated, watch, onUnmounted, nextTick } from 'vue';
import { useStore } from '@/store/store';
import { useCartStore } from '@/store/cartStore';
import { useRoute } from 'vue-router'; // Añadir esta importación
import AppHeader from './components/AppHeader.vue';
import Footer from './components/Footer.vue';
import CookieConsent from './components/CookieConsent.vue';

const store = useStore();
const cartStore = useCartStore();
const route = useRoute(); // Añadir esta línea
const error = ref(false);
const contentWrapper = ref(null); // Referencia al contenedor del contenido
const pageContent = ref(null);   // Referencia al router-view
const footer = ref(null);        // Referencia al footer
const footerMarginTop = ref(0);  // Margen dinámico para el footer

// Función para calcular y ajustar la posición del footer
const calculateFooterPosition = () => {
  if (contentWrapper.value && footer.value) {
    const windowHeight = window.innerHeight;
    const contentHeight = contentWrapper.value.offsetHeight;
    const footerHeight = footer.value.offsetHeight;

    if (contentHeight < windowHeight) {
      footerMarginTop.value = windowHeight - contentHeight - footerHeight;
    } else {
      footerMarginTop.value = 0;
    }
  }
};

// Ejecutar al montar el componente
onMounted(async () => {
  try {
    // Cargar datos asíncronos
    await store.fetchCategoriesMinimal(false); // Usar caché si está disponible
    await cartStore.loadCart();

    // Ajustar la posición del footer después de cargar datos
    calculateFooterPosition();

    // Escuchar redimensiones de la ventana
    window.addEventListener('resize', calculateFooterPosition);
  } catch (err) {
    error.value = true;
  }
});

// Ajustar el footer cuando el contenido cambie (por ejemplo, al navegar)
onUpdated(() => {
  calculateFooterPosition();
});

// Observar cambios en la altura del contenido o footer
watch([() => contentWrapper.value?.offsetHeight, () => footer.value?.offsetHeight], () => {
  calculateFooterPosition();
});

// Agregar watch para la ruta
watch(
  () => route.fullPath,
  () => {
    nextTick(() => {
      calculateFooterPosition();
    });
  }
);

// Limpiar el evento al desmontar el componente
onUnmounted(() => {
  window.removeEventListener('resize', calculateFooterPosition);
});

// Reintentar carga si hay error
const retryLoading = async () => {
  error.value = false;
  try {
    await store.fetchCategoriesMinimal(true); // Forzar refresco
    await cartStore.loadCart();
    calculateFooterPosition();
  } catch (err) {
    error.value = true;
  }
};
</script>

<style>
/* Agregar estilos para transiciones */
.page-content {
  transition: opacity 0.3s ease;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>