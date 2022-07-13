import { registerMicroApps } from 'qiankun'
import router from './router/index.js'

registerMicroApps([
  {
    name: 'plutusVendor',
    entry: 'http://localhost:10000/plutus-vendor/', // //localhost:10000   /plutus-vendor/   http://test34-vendor-test.test.8slan.com/plutus-vendor/
    container: '#container',
    activeRule: '/plutus',
    props: {
      routerBase: '/plutus',
      mainAppRouter: router
    }
  }
], {
  beforeLoad: () => {
    console.log('加载前')
  },
  beforeMount: () => {
    console.log('挂在前')
  },
  afterMount: () => {
    console.log('挂载后')
  },
  beforeUnmount: () => {
    console.log('销毁前')
  },
  afterUnmount: () => {
    console.log('销毁后')
  }
})
