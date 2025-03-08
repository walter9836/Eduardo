import { defineStore } from 'pinia';
import { saveToIndexedDB, getFromIndexedDB } from '@/utils/indexedDB';

export const useCartStore = defineStore('cartStore', {
  state: () => {
    let initialCart = [];
    try {
      const sessionCart = sessionStorage.getItem('cart');
      if (sessionCart) {
        const parsed = JSON.parse(sessionCart);
        initialCart = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('❌ Error al parsear sessionStorage.cart:', error);
      initialCart = [];
    }
    return {
      cart: initialCart, // ✅ Siempre un array
    };
  },

  actions: {
    /**
     * ✅ Agregar un producto al carrito
     */
    async addItem(product) {
      if (!product || !product.id) {
        console.error('Producto inválido:', product);
        return;
      }
      const existingProduct = this.cart.find(item => item.id === product.id);
      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        this.cart.push({ ...product, quantity: 1 });
      }
      await this.saveCart(); // ✅ Guardar el carrito actualizado
    },

    /**
     * ✅ Eliminar un producto del carrito
     */
    async removeItem(productId) {
      this.cart = this.cart.filter(item => item.id !== productId);
      await this.saveCart();
    },

    /**
     * ✅ Vaciar todo el carrito
     */
    async clearCart() {
      this.cart = [];
      await this.saveCart();
    },

    /**
     * ✅ Guardar el carrito en IndexedDB y sessionStorage
     */
    async saveCart() {
      try {
        await saveToIndexedDB('cart', this.cart);
        sessionStorage.setItem('cart', JSON.stringify(this.cart)); // ✅ Guardar copia en `sessionStorage`
      } catch (error) {
        console.error("❌ Error al guardar el carrito:", error);
      }
    },

    /**
     * ✅ Cargar el carrito desde IndexedDB al iniciar la app
     */
    async loadCart() {
      try {
        const cachedCart = await getFromIndexedDB('cart');
        if (cachedCart) {
          // ✅ Validar que cachedCart sea un array
          this.cart = Array.isArray(cachedCart) ? cachedCart : [];
          sessionStorage.setItem('cart', JSON.stringify(this.cart)); // ✅ Actualizar `sessionStorage`
        } else {
          // ✅ Si no hay datos en IndexedDB, intentar con sessionStorage
          const sessionCart = sessionStorage.getItem('cart');
          if (sessionCart) {
            const parsed = JSON.parse(sessionCart);
            this.cart = Array.isArray(parsed) ? parsed : [];
          } else {
            this.cart = [];
          }
        }
      } catch (error) {
        console.error("❌ Error al cargar el carrito desde IndexedDB:", error);
        this.cart = []; // ✅ Resetear a array vacío en caso de error
      }
    },
  },

  getters: {
    /**
     * ✅ Obtener el total del carrito
     */
    cartTotal: (state) => {
      return Array.isArray(state.cart)
        ? state.cart.reduce((total, item) => total + (item.price * item.quantity || 0), 0)
        : 0;
    },

    /**
     * ✅ Obtener el número total de productos en el carrito
     */
    cartItemCount: (state) => {
      return Array.isArray(state.cart)
        ? state.cart.reduce((count, item) => count + (item.quantity || 0), 0)
        : 0;
    },
  },
});