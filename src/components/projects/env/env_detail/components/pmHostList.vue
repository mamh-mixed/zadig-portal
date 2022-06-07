<template>
  <div class="host-select">
    <el-dialog title="选择主机资源" :visible.sync="editHostDialogVisible" width="50%" center>
      <div class="tab-container">
        <el-tabs v-model="currentTab" type="card">
          <el-tab-pane v-for="item in tabList" :name="item.name" :label="item.label" :key="item.name">
            <keep-alive>
              <pmHostItem
                :ref="'hostItemRef'+ item.name"
                :currentPmServiceData="currentPmServiceData"
                :currentTab="currentTab"
              />
            </keep-alive>
          </el-tab-pane>
        </el-tabs>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="editHostDialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :disabled="!serviceHosts" @click="bindHost">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import { addHostToPmEnvAPI } from '@api'
import pmHostItem from './pmHostItem.vue'
import { uniq } from 'lodash'
export default {
  name: 'pmHostList',
  props: {
    currentPmServiceData: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  data () {
    return {
      editHostDialogVisible: false,
      serviceHosts: [],
      currentTab: 'project',
      keyword: '',
      multipleSelection: [],
      tabList: [
        {
          label: '项目资源',
          name: 'project'
        },
        {
          label: '系统资源',
          name: 'system'
        }
      ],
      envConfigs: []
    }
  },
  components: { pmHostItem },

  methods: {
    bindHost () {
      let hostIds = []
      const refs = this.$refs.hostItemRefproject.concat(this.$refs.hostItemRefsystem)
      refs.forEach(item => {
        hostIds = uniq(hostIds.concat(item.multipleSelection.map(item => item.id)))
      })
      const projectName = this.currentPmServiceData.product_name
      let envConfigs = []
      envConfigs = [
        {
          env_name: this.currentPmServiceData.env_name,
          host_ids: hostIds
        }
      ]
      const payload = {
        product_name: this.currentPmServiceData.product_name,
        service_name: this.currentPmServiceData.service_name,
        env_name: this.currentPmServiceData.env_name,
        revision: this.currentPmServiceData.revision,
        env_configs: envConfigs
      }
      addHostToPmEnvAPI(projectName, payload).then(res => {
        this.$message({
          message: '主机资源修改成功',
          type: 'success'
        })
        this.$emit('success')
        this.editHostDialogVisible = false
      })
    }
  }
}
</script>
<style lang="less" scoped>
.host-select {
  .search {
    width: 300px;
    margin: 20px 0;
  }
}
</style>
