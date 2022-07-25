<template>
  <div class="micro-container">
    <div id="container"></div>
  </div>
</template>

<script>
import { /* loadMicroApp */ addGlobalUncaughtErrorHandler } from 'qiankun'
import { /* microApps, */ registerApps } from './index'
import bus from '@utils/eventBus'

export default {
  // data () {
  //   return {
  //     microList: {}
  //   }
  // },
  // methods: {
  //   async activationHandleChange (path) {
  //     const activeRules = microApps.map((app) => app.activeRule)
  //     const isMicro = activeRules.some((rule) => path.startsWith(rule))
  //     if (!isMicro) return
  //     const microItem = microApps.find((app) => path.startsWith(app.activeRule.toString()))
  //     if (!microItem) return
  //     const current = this.microList[microItem.activeRule.toString()]
  //     if (current) return
  //     const micro = loadMicroApp({ ...microItem })
  //     this.microList[microItem.activeRule.toString()] = micro
  //     try {
  //       await micro.mountPromise
  //     } catch (e) {
  //       console.error('mountPromise error:', e)
  //     }
  //   }
  // },
  // watch: {
  //   '$route.path': function (newValue) {
  //     this.activationHandleChange(newValue)
  //   }
  // },
  mounted () {
    addGlobalUncaughtErrorHandler(event => console.log('global error: ', event))
    // if (window.qiankunStarted) return
    // window.qiankunStarted = true
    registerApps()
    // this.activationHandleChange(this.$route.path)
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [{ title: '微应用', url: '' }]
    })
  }
  // destroyed () {
  //   window.qiankunStarted = false
  //   Object.values(this.microList).forEach((mic) => {
  //     mic.unmount()
  //   })
  // }
}
</script>

<style lang="less" scoped>
.micro-container {
  height: calc(~'100% - 41px');
  max-height: calc(~'100% - 41px');

  #container {
    position: relative;
    height: 100%;
    max-height: 100%;
    overflow: hidden;
  }
}
</style>
