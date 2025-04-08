import { defineStore } from 'pinia';
import { saveCartToIndexedDB, getCartFromIndexedDB } from '@/utils/indexedDB';

export const useCartStore = defineStore('cartStore', {
  state: () => {
    let initialCart = [];
    const loadInitialCart = async () => {
      try {
        const cachedCart = await getCartFromIndexedDB();
        if (cachedCart.length) {
          initialCart = cachedCart;
          sessionStorage.setItem('cart', JSON.stringify(initialCart));
        } else {
          const sessionCart = sessionStorage.getItem('cart');
          initialCart = sessionCart ? JSON.parse(sessionCart) : [];
          if (!Array.isArray(initialCart)) initialCart = [];
          if (initialCart.length) await saveCartToIndexedDB(initialCart); // Sincronizar con IndexedDB
        }
      } catch (error) {
        console.error('❌ Error al cargar carrito inicial:', error);
        initialCart = [];
      }
    };
    loadInitialCart(); // Ejecutar carga asíncrona (Pinia lo maneja bien en el fondo)
    return { cart: initialCart };
  },

  actions: {
    async addItem(product) {
      if (!product?.id || !product.price || !product.name) {
        console.error('❌ Producto inválido para agregar al carrito:', product);
        return;
      }
      const existing = this.cart.find(item => item.id === product.id);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + 1;
      } else {
        this.cart.push({ ...product, quantity: 1 });
      }
      await this.saveCart();
      console.log(`✅ Producto ${product.name} agregado al carrito`);
    },

    async removeItem(productId) {
      const initialLength = this.cart.length;
      this.cart = this.cart.filter(item => item.id !== productId);
      if (this.cart.length < initialLength) {
        await this.saveCart();
        console.log(`✅ Producto con ID ${productId} eliminado del carrito`);
      }
    },

    async clearCart() {
      this.cart = [];
      await this.saveCart();
      console.log('✅ Carrito vaciado');
    },

    async saveCart() {
      try {
        await saveCartToIndexedDB(this.cart);
        sessionStorage.setItem('cart', JSON.stringify(this.cart));
      } catch (error) {
        console.error('❌ Error al guardar el carrito:', error);
      }
    },

    async loadCart() {
      try {
        const cachedCart = await getCartFromIndexedDB();
        this.cart = cachedCart.length ? cachedCart : JSON.parse(sessionStorage.getItem('cart') || '[]');
        sessionStorage.setItem('cart', JSON.stringify(this.cart));
        console.log(`✅ Carrito cargado con ${this.cart.length} ítems`);
      } catch (error) {
        console.error('❌ Error al cargar carrito:', error);
        this.cart = [];
      }
    },
  },

  getters: {
    cartTotal: (state) => {
      return state.cart.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = item.quantity || 0;
        return total + price * quantity;
      }, 0).toFixed(2);
    },
    cartItemCount: (state) => {
      return state.cart.reduce((count, item) => count + (item.quantity || 0), 0);
    },
  },
});