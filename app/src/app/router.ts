import { createRouter, createWebHashHistory } from "vue-router";
export const navigation = [
  { path: "/culture", name: "染艺寻踪" },
  { path: "/learning", name: "一布一染" },
  { path: "/studio", name: "掌上扎染" },
  { path: "/patterns", name: "纹样工坊" },
  { path: "/works", name: "染作生成" },
  { path: "/stories", name: "白乡故事" },
] as const;
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/studio" },
    {
      path: "/studio",
      component: () => import("../modules/studio/StudioPage.vue"),
    },
    {
      path: "/patterns",
      component: () => import("../modules/patterns/PatternsPage.vue"),
    },
    {
      path: "/learning",
      component: () => import("../modules/learning/LearningPage.vue"),
    },
    {
      path: "/works",
      component: () => import("../modules/works/WorksPage.vue"),
    },
    {
      path: "/culture",
      component: () => import("./ContentPage.vue"),
      props: { kind: "culture" },
    },
    {
      path: "/stories",
      component: () => import("./ContentPage.vue"),
      props: { kind: "stories" },
    },
    { path: "/:pathMatch(.*)*", redirect: "/studio" },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
