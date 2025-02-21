  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  import tailwindcss from '@tailwindcss/vite' // 🔥 Mantenemos Tailwind si prefieres usarlo así
  import path from 'path' // 🔥 Importamos `path` para alias

  export default defineConfig({
    plugins: [
      vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src') // <-- Asegúrate de que esta línea esté aquí
      }
    },
    server: {
      port: 5000, // 🚀 Puedes cambiar el puerto si lo necesitas
      open: true, // 🔥 Abre el navegador automáticamente al iniciar
      strictPort: true, // 🔒 Evita que cambie de puerto automáticamente si está ocupado
      cors: true // 🌍 Habilita CORS si necesitas consumir APIs externas
    },
    build: {
      outDir: 'dist', // 📂 Carpeta de salida para la compilación
      sourcemap: true, // 🛠 Habilita mapas de fuente para depuración
    }
  })
