import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import * as Sentry from '@sentry/vue';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);

Sentry.init({
  app,
  dsn: 'https://5422f6c02de94375f11490b14baf2c04@sentry-internal.temp-mail.io/49',
  integrations: [Sentry.browserTracingIntegration({ router })],
  tracesSampleRate: 0.05,
  logErrors: true,
  environment: import.meta.env.MODE || 'development',
  beforeSend(event) {
    return new Promise(resolve => setTimeout(() => resolve(event), 0));
  },
});

app.config.errorHandler = (err, vm, info) => {
  console.error(`Error global capturado: ${info}`, err);
  Sentry.captureException(err);
};

const apiUrl = import.meta.env.VITE_API_URL || 'https://dev-edu123t35.pantheonsite.io/wp-json/wc/v3';
const preconnectLink = document.createElement('link');
preconnectLink.rel = 'preconnect';
preconnectLink.href = new URL(apiUrl).origin;
preconnectLink.crossOrigin = 'anonymous';
document.head.appendChild(preconnectLink);

// Depuración adicional
router.beforeEach((to, from, next) => {
  console.log(`Navegando de ${from.path} a ${to.path}`);
  next();
});

router.afterEach((to) => {
  console.log(`Navegación completada a: ${to.path}`);
});

console.time('vue_mount');
app.mount('#app');
console.timeEnd('vue_mount');