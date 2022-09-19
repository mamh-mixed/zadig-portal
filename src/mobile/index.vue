<template>
  <div>
    <van-nav-bar v-if="title==='Zadig'" title="Zadig Mobile" />
    <van-notice-bar
      v-if="title==='Zadig'"
      color="#0066ff"
      background="#ecf9ff"
      :scrollable="true"
      left-icon="info-o"
    >欢迎使用 Zadig 移动端，功能有限，如需更多功能请前往 PC 端使用</van-notice-bar>
    <router-view />
      <van-tabbar fixed placeholder v-model="active" active-color="#0066ff" inactive-color="#4a4a4a" route>
        <van-tabbar-item replace name="status" to="/mobile/status" icon="icon iconfont iconyunhangzhuangtai">运行状态</van-tabbar-item>
        <van-tabbar-item replace name="projects" to="/mobile/projects" icon="icon iconfont iconxiangmuloading">项目</van-tabbar-item>
        <van-tabbar-item replace name="forum" url="https://community.koderover.com/" icon="friends-o">论坛</van-tabbar-item>
        <van-tabbar-item replace name="profile" to="/mobile/profile" icon="user-circle-o">账号设置</van-tabbar-item>
      </van-tabbar>
  </div>
</template>

<script>
import { NavBar, Tabbar, TabbarItem, NoticeBar } from 'vant'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Tabbar.name]: Tabbar,
    [TabbarItem.name]: TabbarItem,
    [NoticeBar.name]: NoticeBar
  },

  data () {
    return {
      active: ''
    }
  },
  computed: {
    title () {
      return this.$route.meta.title
    }
  },
  methods: {
    goBack () {
      this.$router ? this.$router.back() : window.history.back()
    }
  },
  created () {
    this.$store.dispatch('GETUSERINFO')
  }
}
</script>

<style lang="less" scoped>
@import '~@assets/css/component/mobile.less';
</style>
