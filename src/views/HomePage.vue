<template>
  <div class="home-page">
    <div class="carousel-container">
      <div class="carousel">
        <div v-for="(slide, index) in slides" 
             :key="index" 
             class="slide" 
             :class="{ active: currentSlide === index }">
          <img :src="slide.image" :alt="slide.alt">
        </div>

        <!-- Botones de navegación -->
        <button class="prev-button" @click="prevSlide">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="next-button" @click="nextSlide">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Indicadores -->
        <div class="carousel-buttons">
          <button v-for="(slide, index) in slides" 
                  :key="index"
                  class="carousel-button"
                  :class="{ active: currentSlide === index }"
                  @click="goToSlide(index)">
          </button>
        </div>
      </div>
    </div>

    <!-- Logo Campaña Escolar -->
    <div class="w-full flex justify-center my-8 overflow-hidden">
      <div class="campaign-logo-wrapper">
        <img 
          src="https://images.falabella.com/v3/assets/bltf4ed0b9a176c126e/blt1b5fae5ea4b84205/6673173f7ef09e469af40e3d/logo-campan%CC%83as-falabella.svg" 
          alt="Logo Campaña Escolar" 
          class="w-96 h-auto mx-auto campaign-logo"
        />
      </div>
    </div>

    <div class="image-container">
      <div class="promo-wrapper">
        <img 
          src="https://images.falabella.com/v3/assets/bltf4ed0b9a176c126e/blt21a2b9112401615e/67a611f42ecd5d33e2fd1697/50-lo-ultimo-100225-stanley.png?auto=webp&disable=upscale&quality=70&width=1280"
          alt="Stanley"
          class="promo-image"
        />
        <div class="hover-overlay">
          <span class="view-more">Ver más</span>
        </div>
      </div>
      
      <div class="promo-wrapper">
        <img 
          src="https://images.falabella.com/v3/assets/bltf4ed0b9a176c126e/blt83ccb9482eb50e59/67a611f52ecd5d0356fd169b/50-lo-ultimo-100225-tommy.png?auto=webp&disable=upscale&quality=70&width=1280"
          alt="Tommy"
          class="promo-image"
        />
        <div class="hover-overlay">
          <span class="view-more">Ver más</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const slides = ref([
  {
    image: 'https://hiraoka.com.pe/media/wysiwyg/H4_CARNAVAL_DE_OFERTAS_4.png',
    alt: 'Oferta 1'
  },
  {
    image: 'https://hiraoka.com.pe/media/wysiwyg/H1_CARNAVAL_DE_OFERTAS_3.png',
    alt: 'Oferta 2'
  },
  {
    image: 'https://hiraoka.com.pe/media/wysiwyg/H4_CARNAVAL_DE_OFERTAS_4.png',
    alt: 'Oferta 3'
  }
]);

const currentSlide = ref(0);
let intervalId = null;

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length;
};

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length;
};

const goToSlide = (index) => {
  currentSlide.value = index;
};

// Iniciar autoplay
onMounted(() => {
  intervalId = setInterval(nextSlide, 5000);
});

// Limpiar intervalo cuando el componente se desmonta
onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.carousel-container {
  width: 100%;
  height: auto; /* Cambiado de height fijo a auto */
  position: relative;
  overflow: hidden;
}

.carousel {
  width: 100%;
  position: relative;
}

.slide {
  position: absolute;
  width: 100%;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  display: none; /* Ocultar slides inactivos */
}

.slide.active {
  opacity: 1;
  position: relative; /* Cambiar a relative cuando está activo */
  display: block; /* Mostrar slide activo */
}

.slide img {
  width: 100%;
  height: auto; /* Mantener proporción original */
  display: block; /* Eliminar espacio extra debajo de la imagen */
  object-fit: contain; /* Mantener proporción sin recortar */
}

.prev-button,
.next-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  width: 28px;  /* Más pequeño */
  height: 28px; /* Más pequeño */
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.prev-button:hover,
.next-button:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.prev-button {
  left: 10px;
}

.next-button {
  right: 10px;
}

.carousel-buttons {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 2;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
}

.carousel-button {
  width: 6px;  /* Más pequeño */
  height: 6px; /* Más pequeño */
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.carousel-button:hover {
  background: rgba(255, 255, 255, 0.8);
}

.carousel-button.active {
  background: white;
  transform: scale(1.2);
}

.image-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
}

.promo-wrapper {
  position: relative;
  width: 45%;
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.promo-wrapper:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.promo-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s ease;
}

.hover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  opacity: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 2rem;
  transition: opacity 0.3s ease;
}

.promo-wrapper:hover .hover-overlay {
  opacity: 1;
}

.view-more {
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 0.5rem 2rem;
  border: 2px solid white;
  border-radius: 9999px;
  transform: translateY(20px);
  transition: all 0.3s ease;
  background-color: rgba(255,255,255,0.1);
  backdrop-filter: blur(4px);
}

.promo-wrapper:hover .view-more {
  transform: translateY(0);
  background-color: rgba(255,255,255,0.2);
}

.view-more:hover {
  background-color: white;
  color: black;
}

.campaign-logo-wrapper {
  position: relative;
  padding: 1.5rem;
  animation: slideWave 8s linear infinite;
  background: linear-gradient(to right, 
    rgba(249, 115, 22, 0.02), 
    rgba(249, 115, 22, 0.04), 
    rgba(249, 115, 22, 0.02)
  );
  border-radius: 16px;
}

.campaign-logo-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(249, 115, 22, 0.05) 0%, transparent 70%);
  opacity: 0;
  animation: glowPulse 4s ease-in-out infinite;
}

.campaign-logo-wrapper::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: linear-gradient(90deg, 
    rgba(249, 115, 22, 0.02),
    rgba(249, 115, 22, 0.08),
    rgba(249, 115, 22, 0.02)
  );
  animation: shimmer 8s linear infinite;
  background-size: 200% 100%;
}

@keyframes slideWave {
  0% {
    transform: translateX(-20px);
    background-position: 0% 50%;
  }
  50% {
    transform: translateX(20px);
    background-position: 100% 50%;
  }
  100% {
    transform: translateX(-20px);
    background-position: 0% 50%;
  }
}

@keyframes glowPulse {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  50% {
    opacity: 0.5;
    transform: translateX(20px);
  }
  100% {
    opacity: 0;
    transform: translateX(-20px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  50% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

.campaign-logo {
  will-change: transform;
  filter: drop-shadow(0 4px 6px rgba(249, 115, 22, 0.05));
}

.campaign-logo-wrapper:hover {
  animation-play-state: paused;
}
</style>


