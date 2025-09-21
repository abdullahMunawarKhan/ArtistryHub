import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sitemap from 'vite-plugin-sitemap'

const siteUrl = process.env.SITE_URL || 'https://scopebrush.vercel.app'

export default defineConfig({
  plugins: [
    react()
    ,
    sitemap({
      hostname: siteUrl,    // your production URL
      outDir: 'dist',                         // where Vite builds to
      routes: async () => {
        ['/', '/user-login', '/artist-profile/:artistId', '/main-dashboard',
          '/signup', 'update-password', '/frtfgau84hfdja', '/dshakfgadsj',
          '/artist-list', 'artist-profile', 'cart', 'register', '/orders',
          '/upload-work', 'order-process', '/,product', '/track-order',
          'track-order/:trackingId', '/artist-dashboard', '/feed', '/feedback-form',
          '/contact-us', '/privacy-policies', '/terms-conditions']

        return []
      }


    })
  ]

})
