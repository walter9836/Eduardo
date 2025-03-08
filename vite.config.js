import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite'; // 🔥 Mantenemos Tailwind como lo tienes
import path from 'path'; // 🔥 Importamos `path` para alias

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Alias para '@' apuntando a 'src'
    },
  },
  server: {
    port: 5000, // 🚀 Puerto personalizado
    open: true, // 🔥 Abre el navegador al iniciar
    strictPort: true, // 🔒 No cambia de puerto si está ocupado
    cors: true, // 🌍 Habilita CORS
  },
  build: {
    outDir: 'dist', // 📂 Carpeta de salida
    sourcemap: true, // 🛠 Mapas de fuente para depuración
    terserOptions: {
      compress: {
        drop_console: true, // 🔥 Elimina todos los console.* en producción
      },
    },
  },
});
