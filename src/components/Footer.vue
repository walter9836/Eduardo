<template>
  <footer class="bg-gray-800 text-white py-6 mt-auto">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Sección de Suscripción al boletín -->
        <div>
          <h4 class="font-semibold text-lg mb-4">Suscríbete al boletín</h4>
          <form @submit.prevent="subscribe" novalidate>
            <!-- Input de correo electrónico -->
            <input 
              type="email" 
              v-model="email" 
              @input="validateEmail" 
              placeholder="Tu correo electrónico"
              aria-label="Introduce tu correo electrónico"
              class="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none"
            />
            
            <!-- Mensaje de error si el correo no es válido -->
            <p v-if="emailError" class="text-red-500 text-sm mt-2 transition-all duration-300 ease-in-out opacity-100">
              {{ emailError }}
            </p>

            <!-- Mensaje de éxito o error -->
            <div v-if="statusMessage" :class="['status-message', statusClass]" class="mt-6 text-center">
              <p>{{ statusMessage }}</p>
            </div>

            <!-- Botón de suscripción -->
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 focus:outline-none flex items-center justify-center min-h-[50px]">
              <!-- Spinner mientras se carga -->
              <span v-if="isSubmitting" class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v4m0 0l-2-2m2 2l2-2m8 4a9 9 0 11-9-9 9 9 0 0110 9z" />
                </svg>
                Cargando...
              </span>
              <!-- Texto cuando no está cargando -->
              <span v-else>
                <i class="fas fa-envelope mr-2"></i> Suscribirse
              </span>
            </button>
          </form>
        </div>

        <!-- Sección de Información -->
        <div>
          <h4 class="font-semibold text-lg mb-4">Información</h4>
          <ul>
            <li class="mb-2"><router-link to="/nosotros" class="hover:underline">Acerca de Nosotros</router-link></li>
            <li class="mb-2"><a href="/contact" class="hover:underline">Contacto</a></li>
            <li class="mb-2"><a href="/privacy" class="hover:underline">Política de Privacidad</a></li>
            <li class="mb-2"><a href="/terms" class="hover:underline">Términos y Condiciones</a></li>
          </ul>
        </div>

        <!-- Sección de Soporte -->
        <div>
          <h4 class="font-semibold text-lg mb-4">Soporte</h4>
          <ul>
            <li class="mb-2"><a href="/help" class="hover:underline">Ayuda</a></li>
            <li class="mb-2"><a href="/faq" class="hover:underline">Preguntas Frecuentes</a></li>
            <li class="mb-2"><a href="/support" class="hover:underline">Soporte Técnico</a></li>
          </ul>
        </div>

        <!-- Sección de Redes Sociales -->
        <div>
          <h4 class="font-semibold text-lg mb-4">Síguenos</h4>
          <div class="flex space-x-4">
            <a href="https://facebook.com" target="_blank" class="hover:text-blue-500">
              <i class="fab fa-facebook-f"></i>
            </a>
            <a href="https://twitter.com" target="_blank" class="hover:text-blue-400">
              <i class="fab fa-twitter"></i>
            </a>
            <a href="https://instagram.com" target="_blank" class="hover:text-pink-500">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" class="hover:text-blue-700">
              <i class="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Pie de página con derechos de autor -->
      <div class="text-center mt-8">
        <p>© 2025 Mi Tienda. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const email = ref('');
const emailError = ref('');
const isSubmitting = ref(false);
const statusMessage = ref('');
const statusClass = ref('');

const validateEmail = () => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailError.value = regex.test(email.value) || email.value === '' ? '' : 'Correo electrónico inválido';
};

const subscribe = async () => {
  if (email.value && !emailError.value) {
    isSubmitting.value = true;

    try {
      const response = await axios.post('https://dev-edu123t35.pantheonsite.io/wp-json/sb/v1/suscribir', {
        email: email.value,
      });

      if (response.data === 'Este correo ya está registrado.') {
        statusMessage.value = 'Este correo ya está registrado. ¡Gracias!';
        statusClass.value = 'text-yellow-500';
      } else {
        statusMessage.value = '¡Te has suscrito correctamente!';
        statusClass.value = 'text-green-500';
      }

      email.value = '';
    } catch (error) {
      statusMessage.value = 'Hubo un error al suscribirse. Intenta nuevamente.';
      statusClass.value = 'text-red-500';
      console.error(error);
    } finally {
      isSubmitting.value = false;
    }
  } else {
    statusMessage.value = 'Correo electrónico inválido.';
    statusClass.value = 'text-red-500';
  }
};
</script>

<style scoped>
/* Estilos para mantener el footer pegado al fondo sin transiciones */
footer {
  margin-top: auto; /* Empuja el footer hacia abajo si hay espacio */
}

/* Estilos para el contenedor de error */
.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 20px;
}
</style>