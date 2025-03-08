<template>
  <div class="container mx-auto px-4 py-6">
    <div class="space-y-8">
      <Breadcrumb :product="product" :category="productCategory" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductImage :image="product?.image" :alt="product?.name" />
        <ProductDetails :product="product" @add-to-cart="addToCart" />
      </div>
      <RelatedProducts :products="visibleRelatedProducts" @load-more="loadMoreRelated" />
      <ProductTabs :product="product" v-model:active-section="activeSection" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from '@/store/store';
import { useCartStore } from '@/store/cartStore';
import Breadcrumb from '../components/Breadcrumb.vue';
import ProductImage from '../components/ProductImage.vue';
import ProductDetails from '../components/ProductDetails.vue';
import RelatedProducts from '../components/RelatedProducts.vue';
import ProductTabs from '../components/ProductTabs.vue';

// Servicio para cargar datos
const loadProductData = async (slug, forceRefresh = false) => {
  const store = useStore();
  try {
    // Buscar primero en el store
    let product = store.products.find(p => p.slug === slug);
    if (!product || forceRefresh) {
      product = await store.fetchProductBySlug(slug, forceRefresh) || {
        name: 'Producto no encontrado',
        image: '/placeholder.jpg',
        price: '0.00',
        description: 'No se pudo cargar la descripción',
        attributes: [],
        slug,
        categories: [],
        id: null,
        yoastMeta: {},
      };
    }

    // Asegurar que attributes sea un array
    product.attributes = Array.isArray(product.attributes) ? product.attributes : [];

    // Cargar categoría solo si no está en el store
    const categorySlug = product.categories?.[0] || null;
    let category = categorySlug
      ? store.categories.find(cat => cat.slug === categorySlug) || await store.fetchCategoryBySlug(categorySlug)
      : null;

    // Cargar productos relacionados solo si no están en el store
    const related = categorySlug
      ? store.getProductsByCategory(categorySlug).length > 0
        ? store.getProductsByCategory(categorySlug)
        : await store.fetchRelatedProducts(categorySlug) || []
      : [];

    return { product, category, related };
  } catch (error) {
    console.error(`Error cargando datos para '${slug}':`, error);
    return {
      product: {
        name: 'Error al cargar',
        image: '/placeholder.jpg',
        price: '0.00',
        description: 'Ocurrió un error al cargar el producto.',
        attributes: [],
        slug,
        categories: [],
        id: null,
        yoastMeta: {},
      },
      category: null,
      related: [],
    };
  }
};

// Configuración principal
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

const addToCart = (product) => {
  if (product?.id) {
    cartStore.addItem(product);
  }
};

const loadMoreRelated = () => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  visibleRelatedProducts.value = relatedProducts.value.slice(0, end);
  if (end < relatedProducts.value.length) currentPage.value++;
};

const updateMetaTags = (product) => {
  if (!product?.yoastMeta) return;
  document.title = product.yoastMeta.title || product.name || 'Producto';
  const metaTags = [
    { name: 'description', content: product.yoastMeta.description || product.description },
    { property: 'og:title', content: product.yoastMeta.ogTitle || product.name },
    { property: 'og:description', content: product.yoastMeta.ogDescription || product.description },
    { property: 'og:image', content: product.yoastMeta.ogImage || product.image },
  ];
  metaTags.forEach(tag => {
    let meta = document.querySelector(`meta[${Object.keys(tag)[0]}="${tag[Object.keys(tag)[0]]}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      Object.entries(tag).forEach(([key, value]) => meta.setAttribute(key, value || ''));
      document.head.appendChild(meta);
    } else {
      meta.setAttribute('content', tag.content || '');
    }
  });
};

const fetchData = async () => {
  const { product: loadedProduct, category, related } = await loadProductData(productSlug.value);
  product.value = loadedProduct;
  productCategory.value = category;
  relatedProducts.value = related.filter(p => p.slug !== productSlug.value); // Excluir el producto actual
  visibleRelatedProducts.value = relatedProducts.value.slice(0, itemsPerPage);
  updateMetaTags(loadedProduct);
};

watch(productSlug, fetchData, { immediate: true });
onMounted(fetchData);
</script>