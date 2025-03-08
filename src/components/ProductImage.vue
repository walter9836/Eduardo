<template>
  <div>
    <img v-if="image" :src="image" alt="Product Image" />
    <p v-else>No hay imagen disponible</p>
  </div>
</template>

<script>
export default {
  props: {
    image: {
      type: String, // O Object si esperas { src: 'url' }
      default: null
    }
  },
  mounted() {
    console.log('Valor de image:', this.image); // Depuración
  }
}
</script>