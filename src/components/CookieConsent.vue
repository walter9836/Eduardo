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

// Revisamos si el valor está guardado en localStorage, de lo contrario, lo inicializamos como null
const cookiesAccepted = localStorage.getItem('cookiesAccepted');
const isAccepted = ref(cookiesAccepted ? cookiesAccepted === 'true' : null);

// Lógica para aceptar cookies con notificaciones
const acceptWithNotifications = () => {
  localStorage.setItem('cookiesAccepted', 'true');
  isAccepted.value = true;
  activateAnalytics();  // Activar cookies de marketing, por ejemplo
};

// Lógica para aceptar solo las cookies esenciales
const acceptBasic = () => {
  localStorage.setItem('cookiesAccepted', 'true');
  isAccepted.value = true;
  deactivateAnalytics();  // No cargar cookies de marketing
};

// Lógica para rechazar las cookies (se establece en 'false' y puedes eliminar cookies no esenciales si es necesario)
const rejectCookies = () => {
  localStorage.setItem('cookiesAccepted', 'false');
  isAccepted.value = true;
  deleteNonEssentialCookies();  // Eliminar cookies de marketing y seguimiento
};

// Eliminar cookies no esenciales (como las de seguimiento)
const deleteNonEssentialCookies = () => {
  document.cookie = "ga-cookie-name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  // Aquí puedes añadir más cookies para eliminar
};

// Activar cookies de marketing (por ejemplo, Google Analytics)
const activateAnalytics = () => {
  const script = document.createElement('script');
  script.src = "https://www.googletagmanager.com/gtag/js?id=UA-XXXXX-Y"; // Reemplaza con tu ID de Analytics
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'UA-XXXXX-Y'); // Reemplaza con tu ID de Analytics
  };
};

// Desactivar cookies de marketing (si el usuario las rechaza)
const deactivateAnalytics = () => {
  window['ga-disable-UA-XXXXX-Y'] = true; // Reemplaza con tu ID de Analytics
};

onMounted(() => {
  // Si el usuario rechazó las cookies, podemos borrar las cookies no esenciales
  if (isAccepted.value === false) {
    deleteNonEssentialCookies();
  }
});
</script>

<style scoped>
.cookie-consent {
  /* Estilos personalizados para el banner de cookies */
}
</style>
