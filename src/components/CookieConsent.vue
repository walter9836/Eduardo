<template>
  <div v-if="!isAccepted" class="cookie-consent fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-4 py-4">
    <div class="container mx-auto">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-sm text-gray-600">
          <p>
            Este sitio web utiliza cookies para mejorar su experiencia. 
            <router-link to="/politica-cookies" class="text-orange-500 hover:text-orange-600 underline">
              Más información
            </router-link>
          </p>
        </div>
        <div class="flex gap-3">
          <button @click="acceptWithNotifications" class="px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg">
            Aceptar y recibir ofertas
          </button>
          <button @click="acceptBasic" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
            Solo esencial
          </button>
          <button @click="rejectCookies" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
            Rechazar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isAccepted = ref(localStorage.getItem('cookiesAccepted') === 'true');

const acceptWithNotifications = () => {
  localStorage.setItem('cookiesAccepted', 'true');
  isAccepted.value = true;
};

const acceptBasic = () => {
  localStorage.setItem('cookiesAccepted', 'true');
  isAccepted.value = true;
};

const rejectCookies = () => {
  localStorage.setItem('cookiesAccepted', 'false');
  isAccepted.value = true;
};

onMounted(() => {
  // Puedes agregar lógica extra aquí si es necesario
});
</script>

<style scoped>
.cookie-consent {
  /* Puedes personalizar los estilos aquí */
}
</style>
