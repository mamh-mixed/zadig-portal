<template>
  <div class="host-select">
    <el-dialog title="选择主机资源" :visible.sync="editHostDialogVisible" width="50%" center>

      <!-- <el-select style="width: 100%;" size="small" multiple filterable v-model="serviceHosts" placeholder="请选择主机">
        <el-option-group label="主机标签">
          <el-option v-for="(item,index) in allHostLabels" :key="index" :label="`${item}`" :value="item"></el-option>
        </el-option-group>
        <el-option-group label="主机列表">
          <el-option v-for="item in allHost" :key="item.name" :label="`${item.name}-${item.ip}`" :value="item.id"></el-option>
        </el-option-group>
      </el-select>-->
      <div class="tab-container">
        <el-tabs v-model="currentTab" type="card">
          <el-tab-pane v-for="item in tabList" :name="item.name" :label="item.label" :key="item.name">
            <keep-alive>
              <pmHostItem
                ref="hostItemRef"
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
      // allHost: [],
      // allHostLabels: [],
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
      // filtersList: []
    }
  },
  components: { pmHostItem },

  methods: {
    bindHost () {
      let hostIds = []
      this.$refs.hostItemRef.forEach(item => {
        hostIds = hostIds.concat(item.multipleSelection.map(item => item.id))
      })
      // console.log(this.$refs.hostItemRef)
      // this.$refs.hostItemRef[0].bindHost()

      // const allHostIds = this.allHost.map(item => {
      //   return item.id
      // })
      // const labels = this.serviceHosts.filter(item => {
      //   return allHostIds.indexOf(item) < 0
      // })
      // const hostIds = this.serviceHosts.filter(item => {
      //   return allHostIds.indexOf(item) >= 0
      // })
      // this.hostIds = hostIds

      const projectName = this.currentPmServiceData.product_name
      let envConfigs = []
      // if (this.serviceHosts.length > 0) {
      envConfigs = [
        {
          env_name: this.currentPmServiceData.env_name,
          host_ids: hostIds
        }
      ]
      // } else {
      //   envConfigs = []
      // }
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
