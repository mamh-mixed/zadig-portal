<template>
  <div class="integration-external">
    <Other class="content" />
  </div>
</template>

<script>
import Jira from './jira.vue'
import Jenkins from './jenkins.vue'
import Other from './other.vue'

export default {
  components: {
    Jira,
    Jenkins,
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
