import { createApp } from "vue";
import App from "./App.vue";
import { setupMetamask } from "./metamask.js";

async function initApp() {
  await setupMetamask();
  createApp(App).mount("#app");
}

initApp();