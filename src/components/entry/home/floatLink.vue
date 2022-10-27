<template>
  <div class="float-link">
    <el-popover class="link-popover" placement="top-end" trigger="hover">
      <div slot="reference" class="icon">
        <el-button type="primary" plain circle icon=" iconfont iconlink1" ></el-button>
      </div>
      <div class="link-title">快捷链接</div>
      <div class="link-outer" v-for="(link, index) in links" :key="index">
        <el-link :href="link.url" target="_blank" rel="noopener noreferrer">{{link.name}}</el-link>
      </div>
      <div class="link-outer" v-if="links.length === 0">暂无链接</div>
    </el-popover>
  </div>
</template>

<script>
import { getExternalLinksAPI } from '@api'
import { mapState } from 'vuex'
export default {
  data () {
    return {}
  },
  computed: {
    ...mapState({
      links: state => state.externalLink.links
    })
  },
  methods: {
    getExternalLinks () {
      getExternalLinksAPI().then(res => {
        this.$store.commit('SET_EXTERNAL_LINK', res || [])
      })
    }
  },
  created () {
    this.getExternalLinks()
  }
}
</script>

<style lang="less" scoped>
.float-link {
  .icon {
    transform: rotate(-45deg);
  }
}

.link-title {
  min-width: 150px;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 14px;
}

.link-outer {
  margin-left: 10px;
  font-size: 12px;
  line-height: 1.8;
}
</style>
