<template>
  <div v-if="showBanner" class="cookie-consent fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50 px-3 py-3 md:px-6 md:py-4 transition-all duration-300">
    <div class="container mx-auto">
      <div class="flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <!-- Texto -->
        <div class="text-xs text-gray-700 text-center md:text-sm md:text-left font-medium">
          Utilizamos cookies para optimizar tu experiencia en este sitio. 
          <router-link to="/politica-cookies" class="text-orange-600 hover:text-orange-700 underline transition-colors duration-200">
            Más información
          </router-link>
        </div>
        <!-- Botones -->
        <div class="flex flex-col gap-2 w-full max-w-xs md:w-auto md:flex-row md:gap-4">
          <button 
            @click="acceptWithNotifications" 
            class="w-full px-3 py-1 text-xs text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg shadow-md md:px-4 md:py-1 md:text-sm transition-colors duration-200"
          >
            Aceptar y ofertas
          </button>
          <button 
            @click="acceptBasic" 
            class="w-full px-3 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-sm md:px-4 md:py-1 md:text-sm transition-colors duration-200"
          >
            Solo esencial
          </button>
          <button 
            @click="rejectCookies" 
            class="w-full px-3 py-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-sm md:px-4 md:py-1 md:text-sm transition-colors duration-200"
          >
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
  useFirstPartyAnalytics();
};

// Lógica para rechazar cookies no esenciales
const rejectCookies = () => {
  localStorage.setItem('cookiesAccepted', 'false');
  isAccepted.value = false;
  showBanner.value = false;
  deleteNonEssentialCookies();
  deactivateAnalytics();
  useFirstPartyAnalytics();
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
  document.cookie = 'ar_debug=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.www.google-analytics.com;';
};

// Activar Google Analytics
const activateAnalytics = () => {
  if (window.gtag) return;
  const script = document.createElement('script');
  script.src = "https://www.googletagmanager.com/gtag/js?id=UA-XXXXX-Y"; // Reemplaza con tu ID
  script.async = true;
  script.setAttribute('crossorigin', 'anonymous');
  document.head.appendChild(script);

  script.onload = () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', 'UA-XXXXX-Y', { 
      'anonymize_ip': true, 
      'cookie_flags': 'SameSite=None;Secure;Partitioned'
    });
  };
};

// Desactivar Google Analytics
const deactivateAnalytics = () => {
  if (window.gtag) {
    window['ga-disable-UA-XXXXX-Y'] = true;
    deleteNonEssentialCookies();
  }
};

// Usar alternativas first-party
const useFirstPartyAnalytics = () => {
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
  /* Asegurar que no sea demasiado alto en móviles */
  max-height: 90vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .cookie-consent {
    padding: 1rem; /* Reducir padding en móvil */
  }
}
</style>