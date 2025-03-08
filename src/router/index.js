import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomePage.vue'),
    },
    {
      path: '/categoria/:slug',
      name: 'CategoriaView',
      component: () => import(/* webpackChunkName: "categoria" */ '../views/CategoriaView.vue'),
      props: (route) => ({
        slug: route.params.slug, // Pasar slug explícitamente
        page: parseInt(route.query.page) || 1, // Pasar page desde query
      }),
    },
    {
      path: '/producto/:slug',
      name: 'ProductoView',
      component: () => import(/* webpackChunkName: "producto" */ '../views/ProductoView.vue'),
    },
    {
      path: '/carrito',
      name: 'CarritoView',
      component: () => import(/* webpackChunkName: "carrito" */ '../views/CarritoView.vue'),
    },
    {
      path: '/politica-cookies',
      name: 'CookiePolicy',
      component: () => import(/* webpackChunkName: "legal" */ '../views/CookiePolicy.vue'),
    },
    {
      path: '/nosotros',
      name: 'AboutUs',
      component: () => import(/* webpackChunkName: "about" */ '../components/AboutUs.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import(/* webpackChunkName: "notfound" */ '../views/NotFound.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

export default router;