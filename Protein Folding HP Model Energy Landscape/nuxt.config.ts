export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'HP蛋白质折叠可视化系统',
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Roboto+Mono:wght@300;400;500;600&display=swap'
        }
      ]
    }
  },
  vite: {
    optimizeDeps: {
      include: ['three', 'chart.js', 'gsap']
    }
  }
})
