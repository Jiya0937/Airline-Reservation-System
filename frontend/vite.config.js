import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        results: resolve(__dirname, 'search-results.html'),
        passenger: resolve(__dirname, 'passenger-details.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        profile: resolve(__dirname, 'profile.html'),
        payment: resolve(__dirname, 'payment.html'),
        checkin: resolve(__dirname, 'checkin.html'),
      }
    }
  }
})

