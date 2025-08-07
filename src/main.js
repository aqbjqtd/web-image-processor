import { createApp } from "vue";
import { Quasar } from "quasar";
import { createPinia } from "pinia";

// Import icon libraries
import "@quasar/extras/material-icons/material-icons.css";

// Import Quasar css
import "quasar/src/css/index.sass";

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from "./App.vue";
import router from "./router";

// Import your css
import "./css/app.scss";

const myApp = createApp(App);

myApp.use(Quasar, {
  plugins: {},
});

myApp.use(createPinia());
myApp.use(router);

// Mount to the Quasar app container
myApp.mount("#q-app");
