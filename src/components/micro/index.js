import { registerMicroApps, start } from 'qiankun'
// import store from '@/store'
// import utils from '@/assets/js/utils'
import router from '@/router/index.js'

export const microApps = [
  {
    name: 'plutusVendor',
    entry: '/plutus-vendor/', // //localhost:10000   /plutus-vendor/   http://test34-vendor-test.test.8slan.com/plutus-vendor/
    container: '#container',
    activeRule: '/v1/plutus',
    props: {
      routerBase: '/v1/plutus',
      //   mainStore: store,
      //   user: utils.getStorage('user'),
      mainAppRouter: router
    }
  }
]

export const registerApps = () => {
  registerMicroApps(microApps, {
    beforeLoad: (app) => {
    //   store.commit('app/loadingMicro', true)
      console.log('before load app.name====>>>>>', app.name)
    },
    beforeMount: [
      (app) => {
        console.log('[LifeCycle] before mount %c%s', 'color: green;', app.name)
      }
    ],
    afterMount: [
      (app) => {
        // store.commit('app/loadingMicro', false)
        console.log('[LifeCycle] after mount %c%s', 'color: green;', app.name)
      }
    ],
    afterUnmount: [
      (app) => {
        console.log('[LifeCycle] after unmount %c%s', 'color: green;', app.name)
      }
    ]
  })

  start({
    sandbox: {
      prefetch: 'all',
      // strictStyleIsolation: true // true,
      experimentalStyleIsolation: true // true
    }
  })
}
