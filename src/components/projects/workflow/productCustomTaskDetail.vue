<template>
  <div class="product-custom-detail">
    <header>
      <div class="left">
        <el-tooltip effect="dark" :content="displayName" placement="top">
          <router-link :to="`/v1/projects/detail/${projectName}/pipelines/custom/${workflowName}?display_name=${displayName}`">
            <span class="mg-r8">{{ $utils.tailCut(displayName,20) }}</span>
          </router-link>
        </el-tooltip>#
        <span class="mg-r8">{{taskId}}</span>
        <span
          :class="$translate.calcTaskStatusColor(payload.status)"
        >{{ payload.status? $t(`workflowTaskStatus.${payload.status}`):$t(`workflowTaskStatus.notRunning`)}}</span>
      </div>
      <div class="right">
        <div class="mg-l24">
          <i class="el-icon-video-play"></i>
          <span>{{$utils.convertTimestamp(payload.create_time)}}</span>
        </div>
        <div class="mg-l24">
          <i class="el-icon-time"></i>
          <span>{{ payload.interval }}</span>
        </div>
        <div class="mg-l24">
          <i class="el-icon-user"></i>
          <span>{{payload.task_revoker}}</span>
        </div>
        <template v-if="['waiting', 'running', 'waitforapprove'].includes(payload.status)">
          <div v-if="!payload.debug" class="mg-l24">
            <el-button
              type="text"
              icon="iconfont iconceshi"
              @click="enableDebug"
              v-hasPermi="{projectName: projectName, action: 'debug_workflow',resource: { name: workflowName, type: 'workflow'}, isBtn: true}"
            ></el-button>
          </div>
        </template>
        <div class="mg-l24" v-if="payload.status==='waiting'||payload.status==='running'">
          <el-button size="small" @click="cancel">{{$t(`global.cancel`)}}</el-button>
        </div>
      </div>
    </header>
    <Multipane layout="horizontal" style="height: 100%;">
      <main style="max-height: 20%;">
        <div class="tab">
          <span class="tab-item" :class="{'active': activeName==='workflow'}" @click="activeName = 'workflow'">{{$t(`global.workflow`)}}</span>
          <span
            class="tab-item"
            :class="{'active': activeName==='env'}"
            @click="activeName = 'env';isShowConsoleFooter=false"
          >{{$t(`global.var`)}}</span>
        </div>
        <div class="content" v-if="activeName==='workflow'">
          <span class="text mg-r8">Start</span>
          <div class="line"></div>
          <div class="stages" v-for="(stage,stageIndex) in payload.stages" :key="stage.label">
            <div v-if="stage.approval && stage.approval.enabled" class="stages-approval" @click="handleApprovalChange(stage,stageIndex)">
              <el-button
                type="primary"
                size="small"
              >{{stage.approval.type==='lark'?$t(`approvalType.feishu`):$t(`approvalType.manualApproval`)}}</el-button>
              <div class="line"></div>
            </div>
            <div class="stage">
              <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="stage.name">
                <div class="stage-name">{{$utils.tailCut(stage.name,15)}}</div>
              </el-tooltip>
              <div class="jobs" v-for="(job,index) in stage.jobs" :key="job.name">
                <span
                  class="job"
                  @click="setCurJob(job,index,stageIndex)"
                  :class="{'active': stageIndex === curStageIndex && index === curJobIndex}"
                >
                  <div class="job-status" :class="$translate.calcTaskStatusColor(job.status)">
                    <span v-if="job.status === 'passed'|| job.status === 'success'" class="el-icon-success"></span>
                    <span v-else-if="job.status === 'failed'||job.status === 'failure'||job.status === 'timeout'" class="el-icon-error"></span>
                    <span v-else-if="job.status === 'cancelled'||job.status === 'terminated'" class="el-icon-warning"></span>
                    <span v-else-if="job.status === 'running'||job.status === 'elected'" class="el-icon-loading"></span>
                    <span v-else class="el-icon-warning color-cancelled"></span>
                  </div>
                  <div class="job-content">
                    <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="job.name">
                      <span class="name">{{$utils.tailCut(job.name,16)}}</span>
                    </el-tooltip>
                    <div class="second">{{$utils.timeFormat(job.end_time-job.start_time)}}</div>
                  </div>
                </span>
              </div>
            </div>
            <div class="line"></div>
          </div>
          <span class="text mg-l8">End</span>
        </div>
        <div v-if="activeName==='env'" class="env">
          <el-table :data="envList" v-if="envList.length>0" class="table">
            <el-table-column type="expand">
              <template slot-scope="props">
                <div v-if="props.row.name==='工作流变量'">
                  <div v-for="(env,index) in props.row.envs" :key="index" class="table-env">
                    <span class="item">{{env.name}}</span>
                    <span class="item">{{env.value}}</span>
                  </div>
                </div>
                <div v-if="props.row.type==='zadig-build'">
                  <div v-for="(env,index) in props.row.spec.envs" :key="index" class="table-env">
                    <span class="item">{{env.key}}</span>
                    <span class="item">{{env.value}}</span>
                  </div>
                </div>
                <div v-if="props.row.type==='zadig-deploy'">
                  <div v-for="(env,index) in props.row.spec.key_vals" :key="index" class="table-env">
                    <span class="item">{{env.key}}</span>
                    <span class="item">{{env.value}}</span>
                  </div>
                </div>
                <div v-if="props.row.type === 'freestyle'">
                  <div v-for="(env,index) in props.row.spec.envs" :key="index" class="table-env">
                    <span class="item" v-if="env">{{env.key}}</span>
                    <span class="item" v-if="env">{{env.value}}</span>
                  </div>
                </div>
                <div v-if="props.row.type === 'plugin'">
                  <div v-for="(env,index) in props.row.spec.inputs" :key="index" class="table-env">
                    <span class="item" v-if="env">{{env.name}}</span>
                    <span class="item" v-if="env">{{env.value}}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t(`global.key`)" prop="name"></el-table-column>
            <el-table-column :label="$t(`global.value`)"></el-table-column>
          </el-table>
        </div>
      </main>
      <MultipaneResizer class="multipane-resizer" v-if="isShowConsoleFooter"></MultipaneResizer>
      <footer :style="{minHeight:'500px'}" v-if="isShowConsoleFooter">
        <JobBuildDetail
          v-if="curJob.type === jobType.build"
          :jobInfo.sync="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobDeployDetail @showFooter="showFooter" v-if="curJob.type=== jobType.deploy" :jobInfo="curJob" :projectName="projectName" />
        <StageApproval
          v-if="curJob.type === jobType.approval"
          :approvalInfo="curStage"
          :workflowName="workflowName"
          :taskId="taskId"
          :firstLoad="firstLoad"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobFreestyleDetail
          v-if="curJob.type === jobType.common"
          :commonInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobPluginDetail
          v-if="curJob.type === jobType.plugin"
          :pluginInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobK8sDeployDetail @showFooter="showFooter" v-if="curJob.type=== jobType.k8sDeploy" :jobInfo="curJob" :projectName="projectName" />
        <JobTestDetail
          v-if="curJob.type === jobType.test"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobScanningDetail
          v-if="curJob.type === jobType.scanning"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobImageDistributeDetail
          v-if="curJob.type === jobType.distribute"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
      </footer>
    </Multipane>
  </div>
</template>
<script>
import {
  getCustomWorkflowTaskDetailAPI,
  deleteCustomWorkflowTaskAPI
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import JobBuildDetail from './productCustomTaskDetail/jobBuildDetail.vue'
import JobDeployDetail from './productCustomTaskDetail/jobDeployDetail.vue'
import StageApproval from './productCustomTaskDetail/stageApproval.vue'
import JobFreestyleDetail from './productCustomTaskDetail/jobFreestyleDetail.vue'
import JobPluginDetail from './productCustomTaskDetail/jobPluginDetail.vue'
import JobK8sDeployDetail from './productCustomTaskDetail/jobK8sDeployDetail.vue'
import JobTestDetail from './productCustomTaskDetail/jobTestDetail.vue'
import JobScanningDetail from './productCustomTaskDetail/jobScanningDetail.vue'
import JobImageDistributeDetail from './productCustomTaskDetail/jobImageDistributeDetail.vue'
import { jobType } from './workflowEditor/customWorkflow/config'
import bus from '@utils/eventBus'

export default {
  data () {
    return {
      jobType,
      isShowConsoleFooter: false,
      firstLoad: true,
      curJobIndex: 0,
      curJob: {},
      payload: {},
      curStageIndex: 0,
      timerId: null,
      timeTimeoutFinishFlag: false,
      activeName: 'workflow',
      activeEnvName: 'env',
      envList: []
    }
  },
  components: {
    Multipane,
    MultipaneResizer,
    JobBuildDetail,
    JobDeployDetail,
    JobFreestyleDetail,
    JobPluginDetail,
    JobK8sDeployDetail,
    JobTestDetail,
    JobScanningDetail,
    StageApproval,
    JobImageDistributeDetail
  },
  computed: {
    taskId () {
      return this.$route.params.task_id
    },
    workflowName () {
      return this.$route.params.workflow_name
    },
    displayName () {
      return this.$route.query.display_name
    },
    projectName () {
      return this.$route.params.project_name
    },
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.buildStage)
    },
    buildOverallColor () {
      return this.colorTranslation(this.buildOverallStatus, 'pipeline', 'task')
    },
    curStage () {
      if (this.payload.stages) {
        return this.payload.stages[this.curStageIndex]
      } else {
        return {}
      }
    }
  },
  methods: {
    getWorkflowTaskDetail (workflow_name, task_id) {
      getCustomWorkflowTaskDetailAPI(
        workflow_name,
        task_id,
        this.projectName
      ).then(res => {
        this.$router.replace({
          query: {
            ...this.$route.query,
            status: res.status
          }
        })
        // show approval detail when init data
        res.stages.forEach((item, index) => {
          if (
            item.approval &&
            item.approval.enabled &&
            (item.status === 'running' || item.status === 'waitforapprove') &&
            this.firstLoad
          ) {
            this.handleApprovalChange(item, index)
            this.firstLoad = false
          }
        })
        if (
          this.curJob.type &&
          this.curJob.type !== 'zadig-approval' &&
          this.payload.stages &&
          this.payload.stages.length > 0
        ) {
          // can't use computed hook because approval footer is stage level data but use job level data
          this.curJob = this.payload.stages[this.curStageIndex].jobs[
            this.curJobIndex
          ]
        }
        this.payload = res
        this.adaptTaskDetail(res)
        if (this.envList.length === 0) {
          // global env and stage are not in same level data,  so need to handle data
          this.handleEnv()
          const globalEnv = [
            {
              name: this.$t(`workflow.workflowVars`),
              envs: this.payload.params
            }
          ]
          const jobs = this.payload.stages.map(item => {
            return item.jobs.map(job => job)
          })
          this.envList = globalEnv.concat(jobs.flat())
        }
      })
    },
    handleEnv () {
      // dont show env value includes 'fixed'/'{{'
      for (let i = 0; i < this.payload.params.length; i++) {
        if (
          this.payload.params[i].value.includes('fixed') ||
          this.payload.params[i].value.includes('{{')
        ) {
          this.$delete(this.payload.params, i)
        }
        if (this.payload.params[i].is_credential) {
          this.payload.params[i].value = '******'
        }
      }
      this.payload.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.spec && job.spec.service_and_builds) {
            job.spec.service_and_builds.forEach(service => {
              for (let i = 0; i < service.key_vals.length; i++) {
                if (
                  service.key_vals[i].value.includes('fixed') ||
                  service.key_vals[i].value.includes('{{')
                ) {
                  this.$delete(service.key_vals, i)
                }
                if (service.key_vals[i].is_credential) {
                  service.key_vals[i].value = '******'
                }
              }
            })
          }
          if (job.type === 'freestyle') {
            for (let i = 0; i < job.spec.envs.length; i++) {
              if (
                job.spec.envs[i].value.includes('fixed') ||
                job.spec.envs[i].value.includes('{{')
              ) {
                this.$delete(job.spec.envs, i)
              }
              if (job.spec.envs[i].is_credential) {
                job.spec.envs[i].value = '******'
              }
            }
          }
          if (job.type === 'plugin') {
            for (let i = 0; i < job.spec.inputs.length; i++) {
              if (
                job.spec.inputs[i].value.includes('fixed') ||
                job.spec.inputs[i].value.includes('{{')
              ) {
                this.$delete(job.spec.inputs, i)
              }
              if (job.spec.inputs[i].is_credential) {
                job.spec.inputs[i].value = '******'
              }
            }
          }
        })
      })
    },
    setCurJob (item, index, curStageIndex) {
      this.isShowConsoleFooter = true
      this.curJob = item
      this.curJobIndex = index
      this.curStageIndex = curStageIndex
    },
    async refreshHistoryTaskDetail () {
      await this.getWorkflowTaskDetail(this.workflowName, this.taskId)
      const statusList = ['running', 'waiting', 'waitforapprove']
      if (!this.timeTimeoutFinishFlag && statusList.includes(this.$route.query.status)) {
        this.timerId = setTimeout(this.refreshHistoryTaskDetail, 1000) // 保证内存中只有一个定时器
      }
    },
    adaptTaskDetail (detail) {
      detail.intervalSec =
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      detail.interval = this.$utils.timeFormat(detail.intervalSec)
    },
    handleApprovalChange (stage, index) {
      // approval is stage level data, there use job ui
      this.curStageIndex = index
      this.curJob.type = 'zadig-approval'
      this.isShowConsoleFooter = true
    },
    showFooter (val) {
      this.isShowConsoleFooter = val
    },
    cancel () {
      deleteCustomWorkflowTaskAPI(
        this.workflowName,
        this.taskId,
        this.projectName
      ).then(res => {
        this.$message.success(this.$t(`workflow.cancelSuccess`))
      })
    },
    closeFooter () {
      this.isShowConsoleFooter = false
    },
    setTitle () {
      bus.$emit('set-topbar-title', {
        title: '',
        breadcrumb: [
          { title: this.$t(`global.project`), url: '/v1/projects' },
          {
            title: this.projectName,
            isProjectName: true,
            url: `/v1/projects/detail/${this.projectName}/detail`
          },
          {
            title: this.$t(`global.workflow`),
            url: `/v1/projects/detail/${this.projectName}/pipelines`
          },
          {
            title: this.displayName || this.workflowName,
            url: `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.workflowName}?display_name=${this.displayName}`
          },
          { title: this.taskId, url: `` }
        ]
      })
    }
  },
  mounted () {
    this.setTitle()
    this.refreshHistoryTaskDetail()
    this.curJobIndex = -1
  },
  beforeDestroy () {
    this.timeTimeoutFinishFlag = true
    clearTimeout(this.timerId)
  },
  watch: {
    isShowConsoleFooter (newVal, val) {
      if (!newVal) {
        this.curJobIndex = -1
      }
    }
  }
}
</script>
<style lang="less" scoped>
.product-custom-detail {
  height: 100%;
  font-size: 14px;
  background: #fff;

  header {
    display: flex;
    justify-content: space-between;
    height: 42px;
    margin: 24px;
    padding: 0 24px;
    color: #121212;
    line-height: 42px;
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);

    .left {
      width: 20%;
    }

    .right {
      display: flex;
      flex: 1 0 300px;
      justify-content: flex-end;
    }
  }

  .tab {
    margin: 4px 0 24px 0;
    color: @projectNameColor;
    font-size: 14px;
    cursor: pointer;

    span:first-child {
      position: relative;
      margin-right: 16px;

      &::after {
        position: absolute;
        top: 0;
        right: -10px;
        width: 2px;
        height: 100%;
        background: @borderGray;
        content: '';
      }
    }

    .active {
      color: @themeColor;
    }
  }

  main {
    padding: 0 24px;

    .content {
      display: flex;

      .text {
        line-height: 52px;
      }

      .stages {
        display: flex;
        font-size: 16px;
        text-align: center;

        &-approval {
          display: flex;
          height: 40px;
        }

        .stage {
          width: 180px;
          margin: -6px 4px;
          padding: 8px 0 16px 0;
          border: 2px dotted @borderGray;
          border-radius: 4px;
          cursor: pointer;

          &-name {
            margin-right: 16px;
            margin-left: 16px;
            padding-left: -8px;
            color: #121212;
            font-size: 14px;
            line-height: 24px;
            text-align: left;
            border-bottom: 1px solid @borderGray;
            cursor: pointer;
          }
        }

        .jobs {
          margin-top: 8px;
          padding: 0 16px;
          line-height: 20px;

          .job {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-sizing: border-box;
            padding: 8px;
            font-weight: 400;
            font-size: 14px;
            text-align: left;
            border: 1px solid @borderGray;
            border-radius: 4px;
            cursor: pointer;

            &-status {
              flex: 0 0 12px;
              font-size: 18px;
            }

            &-content {
              flex: 1 1 auto;
              margin-left: 8px;
              text-align: left;

              .name {
                display: inline-block;
                flex: 1 1 auto;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }

              .second {
                color: @fontGray;
                font-size: 13px;
              }
            }

            &:hover {
              border: 1px solid #06f;
              box-shadow: 1px 1px 2px 1px rgb(150, 185, 238);
            }
          }

          .active {
            border: 1px solid #06f;
            box-shadow: 1px 1px 2px 1px rgb(150, 185, 238);
          }
        }
      }
    }

    .env {
      width: 50%;
      min-height: 400px;
      max-height: 80%;
      overflow-y: auto;

      .table {
        &-env {
          height: 30px;
          padding: 0 60px;
          line-height: 30px;

          .item {
            display: inline-block;
            width: 40%;
          }
        }
      }
    }
  }

  footer {
    height: 100%;
  }

  .multipane-resizer {
    z-index: 10;
    cursor: row-resize;
  }

  .multipane-resizer::before {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    width: 100px;
    height: 8px;
    margin-left: -5.5px;
    background-color: #fff;
    border: 1px solid #dbdbdb;
    border-radius: 5px;
    content: '';
  }

  .line {
    position: relative;
    min-width: 46px;
    height: 2px;
    margin-top: 24px;
    background: @themeColor;

    &::before {
      position: absolute;
      top: -2px;
      left: -5px;
      width: 4px;
      height: 4px;
      border: 1px solid @themeColor;
      border-radius: 50%;
      content: '';
    }

    &::after {
      position: absolute;
      top: -2px;
      right: -5px;
      width: 4px;
      height: 4px;
      border: 1px solid @themeColor;
      border-radius: 50%;
      content: '';
    }
  }
}
</style>
