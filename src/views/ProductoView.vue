<template>
  <div v-if="store.isContentReady" class="container mx-auto px-4 py-6">
    <div class="space-y-8">
      <Breadcrumb :product="product" :category="productCategory" />
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
        <div class="w-full h-64 md:h-96 bg-gray-200 rounded-lg"></div>
        <div class="space-y-4">
          <div class="h-8 bg-gray-200 rounded w-3/4"></div>
          <div class="h-6 bg-gray-200 rounded w-1/2"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div class="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductImage 
          :images="allImages"
          :alt="product?.name" 
        />
        <ProductDetails :product="product" @add-to-cart="addToCart" />
      </div>
      <div v-if="isLoading" class="animate-pulse">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="n in 4" :key="n" class="space-y-3">
            <div class="h-40 bg-gray-200 rounded-lg"></div>
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      <RelatedProducts v-else :products="visibleRelatedProducts" @load-more="loadMoreRelated" />
      <ProductTabs :product="product" v-model:active-section="activeSection" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from '@/store/store';
import { useCartStore } from '@/store/cartStore';
import { useHead } from '@unhead/vue'; // Cambiado a @unhead/vue
import Breadcrumb from '../components/Breadcrumb.vue';
import ProductImage from '../components/ProductImage.vue';
import ProductDetails from '../components/ProductDetails.vue';
import RelatedProducts from '../components/RelatedProducts.vue';
import ProductTabs from '../components/ProductTabs.vue';

const route = useRoute();
const store = useStore();
const cartStore = useCartStore();

const productSlug = computed(() => route.params.slug);
const product = ref(null);
const productCategory = ref(null);
const relatedProducts = ref([]);
const visibleRelatedProducts = ref([]);
const activeSection = ref('description');
const itemsPerPage = 4;
const currentPage = ref(1);
const isLoading = ref(true);

const allImages = computed(() => {
  const images = product.value?.images || [];
  return images.length ? images : [{ src: '/placeholder.jpg', alt: 'Producto no encontrado' }];
});

// Configurar metadatos reactivos con Unhead
useHead({
  title: computed(() => {
    const yoastMeta = product.value?.yoast_head_json || {};
    return yoastMeta.title || product.value?.name || 'Producto - Mi Tienda';
  }),
  meta: [
    {
      name: 'description',
      content: computed(() => {
        const yoastMeta = product.value?.yoast_head_json || {};
        return yoastMeta.description || product.value?.description || 'Descripción del producto';
      }),
    },
    {
      property: 'og:title',
      content: computed(() => {
        const yoastMeta = product.value?.yoast_head_json || {};
        return yoastMeta.og_title || yoastMeta.title || product.value?.name || 'Producto';
      }),
    },
    {
      property: 'og:description',
      content: computed(() => {
        const yoastMeta = product.value?.yoast_head_json || {};
        return yoastMeta.og_description || yoastMeta.description || product.value?.description || 'Descripción del producto';
      }),
    },
    {
      property: 'og:image',
      content: computed(() => product.value?.images?.[0]?.src || '/placeholder.jpg'),
    },
  ],
  link: [
    { rel: 'canonical', href: computed(() => window.location.origin + route.path) },
  ],
});

const loadProductData = async (slug) => {
  try {
    let fetchedProduct = await store.fetchProductBySlug(slug);
    product.value = fetchedProduct || {
      name: 'Producto no encontrado',
      images: [{ src: '/placeholder.jpg', alt: 'Producto no encontrado' }],
      price: '0.00',
      regular_price: null,
      sale_price: null,
      stock_quantity: 5,
      sku: 'N/A',
      description: 'No se pudo cargar la descripción',
      attributes: [],
      slug,
      categories: [],
      id: null,
      yoast_head_json: {},
    };

    product.value.attributes = Array.isArray(product.value.attributes) ? product.value.attributes : [];

    const categorySlug = product.value.categories?.[0] || null;
    productCategory.value = categorySlug
      ? store.categories.find((cat) => cat.slug === categorySlug) || (await store.fetchCategoryBySlug(categorySlug))
      : null;

    relatedProducts.value = categorySlug
      ? store.getProductsByCategory(categorySlug).length > 0
        ? store.getProductsByCategory(categorySlug)
        : (await store.fetchRelatedProducts(categorySlug)) || []
      : [];

    relatedProducts.value = relatedProducts.value.filter((p) => p.slug !== productSlug.value);
    visibleRelatedProducts.value = relatedProducts.value.slice(0, itemsPerPage);
  } catch (error) {
    console.error(`Error cargando datos para '${slug}':`, error);
  } finally {
    isLoading.value = false;
  }
};

const addToCart = (product) => {
  if (product?.id) cartStore.addItem(product);
};

const loadMoreRelated = () => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  visibleRelatedProducts.value = relatedProducts.value.slice(0, end);
  if (end < relatedProducts.value.length) currentPage.value++;
};

const fetchData = async () => {
  isLoading.value = true;
  await loadProductData(productSlug.value);
};

watch(productSlug, async (newSlug, oldSlug) => {
  if (newSlug !== oldSlug) {
    await fetchData();
  }
});

onMounted(async () => {
  await fetchData();
});
</script>