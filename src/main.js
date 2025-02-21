import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia'; // Importar Pinia

const app = createApp(App);
const pinia = createPinia(); // Crear instancia de Pinia

app.use(router); // Usa el router en la aplicación
app.use(pinia);  // Usa Pinia en la aplicación

app.mount('#app');
