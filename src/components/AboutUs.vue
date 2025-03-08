<template>
    <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <!-- Título -->
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">
          Acerca de Nosotros
        </h1>
  
        <!-- Contenido principal -->
        <div class="bg-white p-6 rounded-lg shadow-md">
          <p class="text-gray-700 mb-4">
            Somos una empresa apasionada por [tu industria o propósito, ej. tecnología, comercio, etc.], dedicada a ofrecer soluciones innovadoras para [tu público objetivo, ej. clientes, developers, etc.]. Fundada en [año], hemos crecido para convertirnos en líderes en [tu área de especialización].
          </p>
  
          <p class="text-gray-700 mb-4">
            Nuestra misión es [describe brevemente tu misión, ej. "proporcionar productos de alta calidad con un enfoque en la sostenibilidad y la satisfacción del cliente"]. Nos enorgullece trabajar con un equipo talentoso y comprometido que comparte nuestra visión de [tu visión, ej. "un futuro más conectado y eficiente"].
          </p>
  
          <h2 class="text-xl font-semibold text-gray-800 mt-6 mb-4">
            Nuestro Equipo
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="flex items-center space-x-4">
              <img
                src="/logo-hiraoka.webp"
                alt="Miembro del equipo 1"
                class="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 class="text-lg font-medium text-gray-800">Nombre 1</h3>
                <p class="text-gray-600">Rol (Ej. CEO)</p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <img
                src="/logo-hiraoka.webp"
                alt="Miembro del equipo 2"
                class="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 class="text-lg font-medium text-gray-800">Nombre 2</h3>
                <p class="text-gray-600">Rol (Ej. CTO)</p>
              </div>
            </div>
          </div>
  
          <h2 class="text-xl font-semibold text-gray-800 mt-6 mb-4">
            Nuestra Visión
          </h2>
          <p class="text-gray-700">
            Nos esforzamos por [tu visión a largo plazo, ej. "liderar la industria con innovación y sostenibilidad, impactando positivamente a nuestras comunidades"]. ¡Únete a nosotros en este viaje!
          </p>
        </div>
  
        <!-- Botón de contacto (opcional) -->
        <div class="text-center mt-8">
          <router-link
            to="/contacto"
            class="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-300"
          >
            Contáctanos
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  // No necesitas lógica adicional aquí, pero puedes agregar datos dinámicos si los tienes en una store o API
  // Por ejemplo, podrías importar datos del equipo desde una store o hacer una llamada a una API
  import { ref } from 'vue';
  </script>
  
  <style scoped>
  /* Estilos adicionales si los necesitas */
  </style>