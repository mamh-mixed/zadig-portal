<template>
  <div class="project-rbac-container">
    <el-tabs v-model="activeTab" :tab-position="tabPosition" type="card" class="permission-tabs">
      <el-tab-pane name="member" label="成员管理">
        <Member v-if="activeTab==='member'" :projectName="projectName" />
      </el-tab-pane>
      <el-tab-pane name="role" label="角色管理">
        <Role v-if="activeTab==='role'" :projectName="projectName" />
      </el-tab-pane>
      <el-tab-pane name="policy" label="策略管理">
        <Policy v-if="activeTab==='policy'" :projectName="projectName" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import Member from './member.vue'
import Role from './role.vue'
import Policy from './policy'

export default {
  name: 'rbac',
  components: {
    Member,
    Role,
    Policy
  },
  data () {
    return {
      activeTab: 'member',
      tabPosition: 'top'
    }
  },
  methods: {},
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  }
}
</script>

<style lang="less" scoped>
.project-rbac-container {
  box-sizing: border-box;
  height: 100%;
  padding: 25px 20px;
  font-size: 15px;

  /deep/.el-tabs.permission-tabs {
    height: 100%;

    .el-tabs__content {
      height: calc(~'100% - 70px');
      margin-bottom: 10px;
      overflow: auto;
    }
  }
}
</style>
