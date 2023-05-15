import { createApp } from "vue";
import App from "./App.vue";
import { setupMetamask } from "./metamask.js";
import router from "./router";  // adjust this line if your router file is located somewhere else

async function initApp() {
  await setupMetamask();
  createApp(App).use(router).mount("#app");
}

initApp();
