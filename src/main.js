import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { createHead } from '@vueuse/head';

const app = createApp(App);
const pinia = createPinia();
const head = createHead();

app.use(router);
app.use(pinia);
app.use(head);


console.time('vue_mount');
app.mount('#app');
console.timeEnd('vue_mount');

