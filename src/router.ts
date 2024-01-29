import { createRouter, createWebHashHistory } from "vue-router";

const Main = () => import("./views/Main.vue");

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: Main,
    },
  ],
});

export default router;
