<template>
  <div
    class="projects-detail-container"
    v-loading="detailLoading"
    element-loading-text="加载中..."
    element-loading-spinner="iconfont iconfont-loading iconxiangmu"
  >
    <div class="project-header"></div>
    <section class="projects-detail">
      <div v-hasPermi="{projectName: projectName, action: 'get_environment'}" class="env">
        <h4 class="section-title">
          <i class="icon iconfont iconhuanjing"></i>
          环境信息
        </h4>
        <el-table :data="envList" stripe style="width: 100%;">
          <el-table-column label="名称">
            <template slot-scope="{ row }">
              <router-link :to="`/v1/projects/detail/${row.projectName}/envs/detail?envName=${row.name}`">
                <span class="env-name">{{`${row.name}`}}</span>
              </router-link>
            </template>
          </el-table-column>
          <el-table-column label="归属" prop="clusterName">
            <template slot-scope="{ row }">
              <span>{{ row.clusterName.startsWith('local-') ? '本地' : row.clusterName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态">
            <template slot-scope="{ row }">
              <span v-if="row.status" :class="[$translate.calcEnvStatusColor(row.status)]">{{getProdStatus(row.status, row.updatable)}}</span>
              <span v-else>
                <i class="el-icon-loading"></i>
              </span>
            </template>
          </el-table-column>
          <el-table-column width="300" label="更新">
            <template slot-scope="{ row }">
              <span class="update-time">
                <i class="icon el-icon-time"></i>
                {{ $utils.convertTimestamp(row.updateTime) }}
              </span>
              <span class="update-time">
                <i class="icon el-icon-user"></i>
                {{row.updateBy}}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-hasPermi="{projectName: projectName, action: 'get_workflow'}" class="workflow">
        <h4 class="section-title">
          <i class="icon iconfont icongongzuoliucheng"></i>
          工作流信息
        </h4>
        <el-table :data="workflows" stripe style="width: 100%;">
          <el-table-column label="名称">
            <template slot-scope="{ row }">
              <router-link class="pipeline-name" :to="`/v1/projects/detail/${projectName}/pipelines/multi/${row.name}`">{{row.name}}</router-link>
            </template>
          </el-table-column>
          <el-table-column label="步骤">
            <template slot-scope="{ row }">
              <CusTags :values="row.enabledStages.map(stage => wordTranslation(stage, 'workflowStage'))"></CusTags>
            </template>
          </el-table-column>
          <el-table-column label="状态">
            <template slot-scope="{ row }">
              <span
                v-if="row.recentTask"
                :class="[`status-${$utils.taskElTagType(row.recentTask.status)}`]"
              >{{ wordTranslation(row.recentTask.status,'pipeline','task')}}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column width="300" label="更新">
            <template slot-scope="{ row }">
              <span class="update-time">
                <i class="icon el-icon-time"></i>
                {{ $utils.convertTimestamp(row.updateTime) }}
              </span>
              <span class="update-time">
                <i class="icon el-icon-user"></i>
                {{row.updateBy}}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
    <DeleteProduct ref="deleteProduct" :followUpFn="followUpFn"></DeleteProduct>
  </div>
</template>
<script>
import {
  getProjectInfoAPI,
  productEnvInfoAPI,
  queryUserBindingsAPI,
  getProductWorkflowsInProjectAPI,
  listProductAPI
} from '@api'
import DeleteProduct from './components/deleteProduct.vue'
import { translateEnvStatus } from '@utils/wordTranslate'
import { wordTranslate } from '@utils/wordTranslate.js'
import { whetherOnboarding } from '@utils/onboardingRoute'
import bus from '@utils/eventBus'
import store from 'storejs'
export default {
  data () {
    return {
      envList: [],
      workflows: [],
      userBindings: [],
      detailLoading: true
    }
  },
  methods: {
    getProdStatus (status, updateble) {
      return translateEnvStatus(status, updateble)
    },
    async getWorkflows (projectName) {
      const res = await getProductWorkflowsInProjectAPI(projectName)
      if (res) {
        this.workflows = res.filter(item => item.projectName === projectName)
      }
    },
    getEnvList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        this.envList = res.map(element => {
          productEnvInfoAPI(projectName, element.name).then(res => {
            element.status = res.status
          })
          return element
        })
      })
    },
    followUpFn () {
      this.$router.push('/v1/projects')
    },
    deleteProject () {
      this.$refs.deleteProduct.openDialog(this.projectName)
    },
    wordTranslation (word, category, subitem) {
      return wordTranslate(word, category, subitem)
    },
    async getProject (projectName) {
      const userInfo = store.get('userInfo')
      const projectInfo = await getProjectInfoAPI(projectName).catch(error =>
        console.log(error)
      )
      const userBindings = await queryUserBindingsAPI(
        userInfo.uid,
        projectName
      ).catch(error => console.log(error))
      if (projectInfo && userBindings) {
        this.userBindings = userBindings
        if (projectInfo.onboarding_status) {
          this.$router.push(whetherOnboarding(projectInfo))
        }
        this.detailLoading = false
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    isProjectAdmin () {
      if (this.$utils.roleCheck('admin')) {
        return true
      } else if (this.userBindings.length > 0) {
        return this.userBindings.some(item => item.role === 'project-admin')
      } else {
        return false
      }
    },
    showWorkflow () {
      const showWorkflow = this.checkPermissionSyncMixin({
        type: 'project',
        projectName: this.projectName,
        action: 'get_workflow'
      })
      return showWorkflow
    },
    showEnv () {
      const showEnv = this.checkPermissionSyncMixin({
        type: 'project',
        projectName: this.projectName,
        action: 'get_environment'
      })
      return showEnv
    }
  },
  watch: {
    projectName () {
      this.getProject(this.projectName)
      bus.$emit(`show-sidebar`, false)
      bus.$emit('set-topbar-title', {
        title: '',
        breadcrumb: [
          { title: '项目', url: '/v1/projects' },
          { title: this.projectName, isProjectName: true, url: '' }
        ]
      })
    },
    showWorkflow: {
      handler (val) {
        if (val) {
          this.getWorkflows(this.projectName)
        }
      },
      immediate: true
    },
    showEnv: {
      handler (val) {
        if (val) {
          this.getEnvList()
        }
      },
      immediate: true
    }
  },
  mounted () {
    this.getProject(this.projectName)
    this.$emit('injectComp', this)
    bus.$emit(`show-sidebar`, false)
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        { title: this.projectName, isProjectName: true, url: '' }
      ]
    })
  },
  components: {
    DeleteProduct
  }
}
</script>

<style lang="less" scoped>
.projects-detail-container {
  position: relative;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .project-header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-height: 40px;
    padding: 10px 20px 0 20px;
  }

  .projects-detail {
    padding: 0 20px 50px 20px;

    .env,
    .workflow {
      margin-bottom: 32px;
    }

    .section-title {
      margin: 0 0 16px;
      color: @projectNameColor;
      font-weight: 300;
      font-size: 18px;
      line-height: 22px;

      .icon {
        margin-right: 8px;
      }
    }

    /deep/.el-table {
      border-radius: 6px;

      th.el-table__cell {
        padding: 5px 0;
      }

      .pipeline-name,
      .env-name {
        color: @themeColor;
      }
    }

    .update-time {
      display: inline-block;

      &:not(:last-child) {
        width: 150px;
        margin-right: 20px;
      }

      .icon {
        margin-right: 5px;
      }
    }
  }
}
</style>
