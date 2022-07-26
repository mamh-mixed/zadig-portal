<template>
  <div class="enterprise-container">

  </div>
</template>
<script>
import bus from '@utils/eventBus'
export default {
  methods: {},
  mounted () {
    bus.$emit(`show-sidebar`, true)
    this.$router.replace('/v1/enterprise/info')
  }
}
</script>

<style lang="less" >
.enterprise-container {
  position: relative;
  flex: 1;
  width: 100%;
  padding: 15px 20px;
  overflow: auto;
}
</style>
