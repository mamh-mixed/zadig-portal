<template>
  <el-dialog :title="`请输入项目名 ${projectName} 确认删除`" :visible.sync="deleteDialogVisible" width="40%">
    <div class="delete-project-content">
      <template v-if="projectDeleteInfo.deploy_type === 'external'">
        <div style="margin-bottom: 4px;">
          该项目下的以下资源会被取消托管，
          <span style="color: red;">请谨慎操作！！</span>
        </div>
        <div>
          <span style="font-weight: 500;">服务：</span>
          <span>{{ services.join(', ') || '无' }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">环境：</span>
          <span>{{ envNames.join(', ') || '无' }}</span>
        </div>
        <div style="margin: 12px 0 4px;">
          该项目下的以下资源会同时被删除，
          <span style="color: red;">请谨慎操作！！</span>
        </div>
        <div>
          <span style="font-weight: 500;">构建：</span>
          <span>{{ buildConfigs.join(', ') || '无' }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">工作流：</span>
          <span>{{ workflows.join(', ') || '无' }}</span>
        </div>
      </template>
      <template v-else>
        <div>
          该项目下的资源会同时被删除
          <span style="color: red;">请谨慎操作！！</span>
        </div>
        <div>
          <span style="font-weight: 500;">服务：</span>
          <span>{{ services.join(', ') || '无' }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">环境：</span>
          <span>{{ envNames.join(', ') || '无' }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">构建：</span>
          <span>{{ buildConfigs.join(', ') || '无' }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">工作流：</span>
          <span>{{ workflows.join(', ') || '无' }}</span>
        </div>
      </template>
      <div style="margin: 16px 0 6px;">
        <el-checkbox
          v-if="['k8s', 'helm'].includes(projectDeleteInfo.deploy_type)"
          v-model="projectDeleteInfo.is_delete"
        >同时删除环境对应的 K8s 命名空间和服务</el-checkbox>
      </div>
      <el-form ref="deleteForm" :model="projectDeleteInfo" :rules="deleteRules" label-width="80px">
        <el-form-item label-width="0" prop="project_name">
          <el-input v-model="projectDeleteInfo.project_name" placeholder="输入项目名称" size="small"></el-input>
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer">
      <el-button @click="deleteDialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
      <el-button type="danger" @click="identifyDeleteProject" size="small">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  getServiceTemplatesAPI,
  getProductWorkflowsInProjectAPI,
  getBuildConfigsAPI,
  getEnvironmentsAPI,
  deleteProjectAPI
} from '@api'

export default {
  props: {
    followUpFn: Function
  },
  data () {
    return {
      deleteDialogVisible: false,
      projectName: '',
      services: [],
      envNames: [],
      buildConfigs: [],
      workflows: [],
      projectDeleteInfo: {
        is_delete: true,
        project_name: '',
        deploy_type: ''
      },
      deleteRules: {
        project_name: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error('请输入项目名称'))
              } else if (value !== this.projectName) {
                callback(new Error('项目名称不相符'))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      }
    }
  },
  methods: {
    async openDialog (projectName) {
      this.projectName = projectName
      this.deleteDialogVisible = true
      this.services = []
      this.envNames = []
      this.buildConfigs = []
      this.workflows = []
      this.projectDeleteInfo = {
        is_delete: true,
        project_name: '',
        deploy_type: this.$store.getters.projectDeployType(projectName)
      }
      this.$nextTick(() => {
        this.$refs.deleteForm.resetFields()
      })
      this.initDeleteProject()
    },
    async initDeleteProject () {
      const projectName = this.projectName
      const result = await Promise.all([
        getServiceTemplatesAPI(projectName),
        getProductWorkflowsInProjectAPI(projectName),
        getBuildConfigsAPI(projectName),
        getEnvironmentsAPI(projectName)
      ])
      this.services = result[0].data.map(element => {
        return element.service_name
      })
      this.workflows = result[1].map(element => {
        return element.name
      })
      this.buildConfigs = result[2].map(element => {
        return element.name
      })
      this.envNames = result[3].map(element => {
        return element.name
      })
    },
    identifyDeleteProject () {
      this.$refs.deleteForm.validate((valid) => {
        if (valid) {
          deleteProjectAPI(
            this.projectName,
            this.projectDeleteInfo.is_delete
          ).then(() => {
            this.$message({
              type: 'success',
              message: '项目删除成功'
            })
            this.deleteDialogVisible = false
            this.followUpFn && this.followUpFn()
          })
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.delete-project-content {
  margin: -10px 10px;
  line-height: 22px;
}
</style>
