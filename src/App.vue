<template>
  <div class="app">
    <AppHeader />
    
    <!-- Contenido principal -->
    <main class="content-wrapper">
      <Suspense>
        <template #default>
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <keep-alive include="CategoriaView,HomePage">
                <component 
                  :is="Component"
                  :key="$route.fullPath"
                  class="page-content"
                  @hook:mounted="onContentMounted"
                />
              </keep-alive>
            </transition>
          </router-view>
        </template>
        <template #fallback>
          <div class="skeleton-wrapper animate-pulse">
            <div class="h-64 bg-gray-200 rounded-lg mx-4"></div>
          </div>
        </template>
      </Suspense>
    </main>

    <Footer />
    <CookieConsent v-if="!error" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useStore } from '@/store/store';
import { useCartStore } from '@/store/cartStore';
import { useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import Footer from './components/Footer.vue';
import CookieConsent from './components/CookieConsent.vue';

const store = useStore();
const cartStore = useCartStore();
const route = useRoute();
const error = ref(false);
const isLoading = ref(true);

onMounted(async () => {
  try {
    await Promise.all([
      store.fetchCategoriesMinimal(false),
      cartStore.loadCart(),
    ]);
  } catch (err) {
    error.value = true;
  } finally {
    isLoading.value = false;
  }
});

watch(
  () => route.fullPath,
  async (newPath) => {
    isLoading.value = true;
    try {
      // Si es una categoría, no cargamos aquí; dejamos que CategoriaView lo maneje
      if (!newPath.startsWith('/categoria/')) {
        await store.preloadInitialData(); // Precarga para otras rutas si aplica
      }
    } catch (err) {
      error.value = true;
    } finally {
      isLoading.value = false;
    }
  }
);

const onContentMounted = () => {
  isLoading.value = false;
};

const retryLoading = async () => {
  error.value = false;
  isLoading.value = true;
  try {
    await Promise.all([
      store.fetchCategoriesMinimal(true),
      cartStore.loadCart(),
    ]);
  } catch (err) {
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

onUnmounted(() => {
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-wrapper {
  flex: 1 0 auto;
  min-height: calc(100vh - 260px); /* Ajusta según header + footer */
}

.skeleton-wrapper {
  min-height: calc(100vh - 260px); /* Igual que content-wrapper */
}

.page-content {
  min-height: inherit;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

footer {
  flex-shrink: 0;
}
</style>