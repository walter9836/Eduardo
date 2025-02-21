import { defineStore } from 'pinia';
import { saveToIndexedDB, getFromIndexedDB } from '@/utils/indexedDB';

export const useCartStore = defineStore('cartStore', {
  state: () => ({
    cart: JSON.parse(sessionStorage.getItem('cart')) || [], // ✅ Usar `sessionStorage` primero
  }),

  actions: {
    /**
     * ✅ Agregar un producto al carrito
     */
    async addItem(product) {
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
        console.log("✅ Carrito guardado correctamente.");
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
          this.cart = cachedCart;
          sessionStorage.setItem('cart', JSON.stringify(this.cart)); // ✅ Actualizar `sessionStorage`
          console.log("✅ Carrito cargado desde IndexedDB.");
        } else {
          console.log("⚠️ No hay datos en IndexedDB, usando sessionStorage.");
          this.cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        }
      } catch (error) {
        console.error("❌ Error al cargar el carrito:", error);
      }
    },
  },

  getters: {
    /**
     * ✅ Obtener el total del carrito
     */
    cartTotal: (state) => {
      return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    },

    /**
     * ✅ Obtener el número total de productos en el carrito
     */
    cartItemCount: (state) => {
      return state.cart.reduce((count, item) => count + item.quantity, 0);
    },
  },
});
