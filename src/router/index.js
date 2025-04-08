import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import { useStore } from '@/store/store'; // Store principal
import { useCartStore } from '@/store/cartStore'; // Store del carrito

// Crea una instancia de Pinia
const pinia = createPinia();
const store = useStore(pinia); // Store principal
const cartStore = useCartStore(pinia); // Store del carrito

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomePage.vue'),
      meta: {
        title: 'Inicio - Mi Tienda | Carnaval de Ofertas',
        description: 'Descubre las mejores ofertas en Mi Tienda con el Carnaval de Ofertas.',
      },
      beforeEnter: async (to, from, next) => {
        await store.preloadInitialData();
        if (store.isContentReady) {
          next();
        } else {
          to.meta.title = 'Error al cargar - Mi Tienda';
          to.meta.description = 'No se pudieron cargar los datos iniciales en Mi Tienda.';
          next('/404');
        }
      },
    },
    {
      path: '/categoria/:slug',
      name: 'CategoriaView',
      component: () => import('../views/CategoriaView.vue'),
      props: (route) => ({
        slug: route.params.slug,
        page: parseInt(route.query.page) || 1,
      }),
      meta: {},
      beforeEnter: async (to, from, next) => {
        const slug = to.params.slug;
        const page = parseInt(to.query.page) || 1;
        const category = await store.fetchCategoryBySlug(slug);
        if (category) {
          await store.fetchProductsByCategory(slug, page);
          const yoastMeta = store.getYoastMetaForCategory(slug);
          to.meta.title = yoastMeta.yoast_head_json?.title || `${category.name} - Mi Tienda`;
          to.meta.description = yoastMeta.yoast_head_json?.description || `Explora productos en ${category.name} en Mi Tienda.`;
          next();
        } else {
          to.meta.title = 'Categoría no encontrada - Mi Tienda';
          to.meta.description = 'Categoría no encontrada en Mi Tienda.';
          next('/404');
        }
      },
    },
    {
      path: '/producto/:slug',
      name: 'ProductoView',
      component: () => import('../views/ProductoView.vue'),
      meta: {},
      beforeEnter: async (to, from, next) => {
        const slug = to.params.slug;
        const product = await store.fetchProductBySlug(slug);
        if (store.isContentReady && product) {
          to.meta.title = `${product.name} - Mi Tienda`;
          to.meta.description = `Detalles de ${product.name} en Mi Tienda. Precio: $${product.price}.`;
          next();
        } else {
          to.meta.title = 'Producto no encontrado - Mi Tienda';
          to.meta.description = 'Producto no encontrado en Mi Tienda.';
          next('/404');
        }
      },
    },
    {
      path: '/carrito',
      name: 'CarritoView',
      component: () => import('../views/CarritoView.vue'),
      meta: {
        title: 'Carrito - Mi Tienda',
        description: 'Revisa tu carrito de compras en Mi Tienda.',
      },
    },
    {
      path: '/politica-cookies',
      name: 'CookiePolicy',
      component: () => import('../views/CookiePolicy.vue'),
      meta: {
        title: 'Política de Cookies - Mi Tienda',
        description: 'Conoce nuestra política de cookies en Mi Tienda.',
      },
    },
    {
      path: '/nosotros',
      name: 'AboutUs',
      component: () => import('../components/AboutUs.vue'),
      meta: {
        title: 'Nosotros - Mi Tienda',
        description: 'Más información sobre Mi Tienda y nuestro equipo.',
      },
    },
    {
      path: '/buscar',
      name: 'SearchView',
      component: () => import('../views/SearchView.vue'),
      props: (route) => ({
        query: route.query.q,
      }),
      meta: {
        title: 'Búsqueda - Mi Tienda',
      },
      beforeEnter: (to, from, next) => {
        to.meta.title = `Búsqueda: ${to.query.q || ''} - Mi Tienda`;
        to.meta.description = `Resultados de búsqueda para "${to.query.q || ''}" en Mi Tienda.`;
        next();
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue'),
      meta: {
        title: 'Página no encontrada - Mi Tienda',
        description: 'Esta página no existe en Mi Tienda.',
      },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 };
  },
});

router.beforeEach(async (to, from, next) => {
  if (to.name === 'CategoriaView') {
    const slug = to.params.slug;
    const category = await store.fetchCategoryBySlug(slug);
    if (category) {
      const yoastMeta = store.getYoastMetaForCategory(slug);
      to.meta.title = yoastMeta.yoast_head_json?.title || `${category.name}`;
      to.meta.description = yoastMeta.yoast_head_json?.description || `Explora productos en ${category.name} en Mi Tienda.`;
    } else {
      to.meta.title = 'Categoría no encontrada - Mi Tienda';
      to.meta.description = 'Categoría no encontrada en Mi Tienda.';
    }
  }

  const title = to.meta.title || '';
  const description = to.meta.description || 'Bienvenido a Mi Tienda, tu lugar para las mejores ofertas.';

  document.title = title;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description;

  const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
  ogTitle.setAttribute('property', 'og:title');
  ogTitle.content = title;
  if (!document.head.contains(ogTitle)) document.head.appendChild(ogTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
  ogDesc.setAttribute('property', 'og:description');
  ogDesc.content = description;
  if (!document.head.contains(ogDesc)) document.head.appendChild(ogDesc);

  next();
});

router.afterEach((to) => {
  console.log(`Navegación completada a: ${to.path}`);
});

export default router;