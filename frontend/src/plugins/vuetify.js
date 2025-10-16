/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import {createVuetify} from 'vuetify'

// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#000000",

          "on-primary": "#FFFFFF",

          surface: "#FFFFFF",
          background: "#F8F9FA",
        }
      }
    }
  },
})
