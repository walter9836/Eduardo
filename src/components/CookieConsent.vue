<template>
  <div v-if="showBanner" class="cookie-consent fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-4 py-4">
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

// Estado del consentimiento
const cookiesAccepted = localStorage.getItem('cookiesAccepted');
const isAccepted = ref(cookiesAccepted === 'true' || cookiesAccepted === 'basic');
const showBanner = ref(cookiesAccepted === null);

// Lógica para aceptar todas las cookies (con notificaciones)
const acceptWithNotifications = () => {
  localStorage.setItem('cookiesAccepted', 'true');
  isAccepted.value = true;
  showBanner.value = false;
  activateAnalytics();
};

// Lógica para aceptar solo cookies esenciales
const acceptBasic = () => {
  localStorage.setItem('cookiesAccepted', 'basic');
  isAccepted.value = true;
  showBanner.value = false;
  deactivateAnalytics();
  useFirstPartyAnalytics(); // Usar cookies first-party o Privacy Sandbox
};

// Lógica para rechazar cookies no esenciales
const rejectCookies = () => {
  localStorage.setItem('cookiesAccepted', 'false');
  isAccepted.value = false;
  showBanner.value = false;
  deleteNonEssentialCookies();
  deactivateAnalytics();
  useFirstPartyAnalytics(); // Usar alternativas sin cookies de terceros
};

// Eliminar cookies no esenciales
const deleteNonEssentialCookies = () => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name] = cookie.split('=').map(c => c.trim());
    if (name && !name.startsWith('_ga_') && name !== 'cookiesAccepted') {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
  }
  // Eliminar cookies de Google Analytics específicas
  document.cookie = 'ar_debug=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.www.google-analytics.com;';
};

// Activar Google Analytics (cookies de terceros, opcional)
const activateAnalytics = () => {
  if (window.gtag) return; // Evitar duplicados
  const script = document.createElement('script');
  script.src = "https://www.googletagmanager.com/gtag/js?id=UA-XXXXX-Y"; // Reemplaza con tu ID real
  script.async = true;
  script.setAttribute('crossorigin', 'anonymous'); // Mejorar compatibilidad
  document.head.appendChild(script);

  script.onload = () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', 'UA-XXXXX-Y', { 
      'anonymize_ip': true, 
      'cookie_flags': 'SameSite=None;Secure;Partitioned' // Añadir atributos para Privacy Sandbox
    });
  };
};

// Desactivar Google Analytics (cookies de terceros)
const deactivateAnalytics = () => {
  if (window.gtag) {
    window['ga-disable-UA-XXXXX-Y'] = true;
    deleteNonEssentialCookies();
  }
};

// Usar alternativas first-party o Privacy Sandbox
const useFirstPartyAnalytics = () => {
  // Ejemplo: usar cookies first-party o Attribution Reporting
  localStorage.setItem('analytics_first_party', JSON.stringify({
    visits: (localStorage.getItem('analytics_first_party') ? JSON.parse(localStorage.getItem('analytics_first_party')).visits + 1 : 1),
    timestamp: Date.now()
  }));
  console.log('Usando métricas first-party en localStorage');
};

onMounted(() => {
  if (cookiesAccepted === 'false') {
    deleteNonEssentialCookies();
    deactivateAnalytics();
    useFirstPartyAnalytics();
  } else if (cookiesAccepted === 'true') {
    activateAnalytics();
  }
});
</script>

<style scoped>
.cookie-consent {
  /* Estilos personalizados */
}
</style>