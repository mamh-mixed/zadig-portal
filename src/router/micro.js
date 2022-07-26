export const plutusRoute = [{
  path: '/v1/plutus',
  component: () => import(/* webpackChunkName: "micro-app" */ '@/components/entry/home.vue'),
  meta: {
    requiresAuth: true
  },
  children: [
    {
      path: '*',
      component: () => import(/* webpackChunkName: "micro-app" */ '@/components/micro/index.vue'),
      meta: {
        title: '微应用'
      }
    }
  ]
}]
