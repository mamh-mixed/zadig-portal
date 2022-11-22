<template>
  <div class="integration-external">
    <Other class="content" />
  </div>
</template>

<script>
import Other from './other.vue'
export default {
  components: {
    Other
  }
}
</script>

<style lang="less" scoped>
.integration-external {
  h4 {
    margin: 14px 0;
  }

  .content {
    margin-bottom: 20px;
  }
}
</style>
