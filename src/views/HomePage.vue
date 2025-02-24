<template>
  <div class="home-page">
    <div class="carousel-container">
      <swiper
        :slides-per-view="1"
        :space-between="0"
        :loop="true"
        :autoplay="{ delay: 5000, disableOnInteraction: false }"
        :navigation="navigationOptions"
        :pagination="{ clickable: true }"
        :modules="modules"
        class="carousel"
      >
        <swiper-slide v-for="(slide, index) in slides" :key="index" class="slide">
          <img :src="slide.image" :alt="slide.alt" />
        </swiper-slide>
      </swiper>
    </div>

    <!-- Resto del template sin cambios -->
    <div class="w-full flex justify-center my-8 overflow-hidden">
      <div class="campaign-logo-wrapper">
        <img
          src="https://images.falabella.com/v3/assets/bltf4ed0b9a176c126e/blt1b5fae5ea4b84205/6673173f7ef09e469af40e3d/logo-campan%CC%83as-falabella.svg"
          alt="Logo Campaña Escolar"
          class="w-96 h-auto mx-auto campaign-logo"
        />
      </div>
    </div>

    <!-- Imágenes promocionales en horizontal con Tailwind CSS -->
    <div class="flex flex-row justify-center gap-5 my-5">
      <div class="relative w-[45%] rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
        <img
          src="https://images.falabella.com/v3/assets/bltf4ed0b9a176c126e/blt21a2b9112401615e/67a611f42ecd5d33e2fd1697/50-lo-ultimo-100225-stanley.png?auto=webp&disable=upscale&quality=70&width=1280"
          alt="Stanley"
          class="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-8 transition-opacity duration-300"
        >
          <span
            class="text-white text-lg font-medium py-2 px-8 border-2 border-white rounded-full transform translate-y-5 group-hover:translate-y-0 transition-all duration-300 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-black"
          >
            Ver más
          </span>
        </div>
      </div>

      <div class="relative w-[45%] rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
        <img
          src="https://images.falabella.com/v3/assets/bltf4ed0b9a176c126e/blt83ccb9482eb50e59/67a611f52ecd5d0356fd169b/50-lo-ultimo-100225-tommy.png?auto=webp&disable=upscale&quality=70&width=1280"
          alt="Tommy"
          class="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-8 transition-opacity duration-300"
        >
          <span
            class="text-white text-lg font-medium py-2 px-8 border-2 border-white rounded-full transform translate-y-5 group-hover:translate-y-0 transition-all duration-300 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-black"
          >
            Ver más
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slides = ref([
  {
    image: 'https://hiraoka.com.pe/media/wysiwyg/H4_CARNAVAL_DE_OFERTAS_4.png',
    alt: 'Oferta 1',
  },
  {
    image: 'https://hiraoka.com.pe/media/wysiwyg/H1_CARNAVAL_DE_OFERTAS_3.png',
    alt: 'Oferta 2',
  },
  {
    image: 'https://hiraoka.com.pe/media/wysiwyg/H4_CARNAVAL_DE_OFERTAS_4.png',
    alt: 'Oferta 3',
  },
]);

// Registramos los módulos explícitamente
const modules = [Autoplay, Navigation, Pagination];

// Configuración de navegación personalizada
const navigationOptions = {
  prevEl: '.swiper-button-prev',
  nextEl: '.swiper-button-next',
};
</script>
