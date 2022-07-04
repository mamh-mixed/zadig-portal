<template>
  <div class="product-custom-detail">
    <header>
      <el-row>
        <el-col :span="8">
          <span>{{workflowName}}#</span>
          <span>{{taskId}}</span>
        </el-col>
        <el-col :offset="8" :span="4">
          <span>{{$utils.convertTimestamp(payload.create_time)}}</span>
        </el-col>
        <el-col :span="2">
          <span>{{ payload.interval }}</span>
        </el-col>
        <el-col :span="2">
          <span>{{payload.task_revoker}}</span>
        </el-col>
      </el-row>
    </header>
    <Multipane layout="horizontal">
      <main>
        <div class="content">
          <span class="text mg-r8">Start</span>
          <div class="line"></div>
          <div class="stages" v-for="(stage,index) in payload.stages" :key="stage.label">
            <div v-if="stage.approval" class="stages-approval" @click="handleApprovalChange(stage,index)">
              <el-button type="primary" size="small">人工审核</el-button>
              <div class="line"></div>
            </div>
            <div class="stage">
              <div class="stage-name">{{stage.name}}</div>
              <div class="jobs" v-for="job in stage.jobs" :key="job.name">
                <span class="job" @click="setCurJob(job)">
                  <span :class="$translate.calcTaskStatusColor(job.status)">•</span>
                  <span class="job-name">{{job.name}}</span>
                </span>
              </div>
            </div>
            <div class="line"></div>
          </div>
          <span class="text mg-l8">End</span>
        </div>
      </main>
      <div></div>
      <MultipaneResizer class="multipane-resizer" v-if="isShowConsoleFooter"></MultipaneResizer>
      <footer :style="{ minHeight: '300px'}" v-if="isShowConsoleFooter">
        <BuildConsole
          v-if="curJob.type === jobType.build"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
        />
        <DeployConsole v-if="curJob.type=== jobType.deploy" :jobInfo="curJob" />
        <Approval v-if="!curJob.type" :approvalInfo="curStage" :workflowName="workflowName" :taskId="taskId" @showFooter="showFooter" />
      </footer>
    </Multipane>
  </div>
</template>
<script>
import { getCustomWorkflowTaskDetailAPI } from '@api'
import Stage from './workflowEditor/customWorkflow/stage.vue'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import BuildConsole from './productCustomTaskDetail/buildConsole.vue'
import DeployConsole from './productCustomTaskDetail/deployConsole.vue'
import Approval from './productCustomTaskDetail/approval.vue'
import { jobType } from './workflowEditor/customWorkflow/config'
import bus from '@utils/eventBus'

export default {
  data () {
    return {
      jobType,
      isShowConsoleFooter: false,
      curJobIndex: 0,
      curJob: {},
      payload: {},
      curStageIndex: 0,
      timerId: null,
      timeTimeoutFinishFlag: false
    }
  },
  components: {
    Stage,
    Multipane,
    MultipaneResizer,
    BuildConsole,
    DeployConsole,
    Approval
  },
  computed: {
    taskId () {
      return this.$route.params.task_id
    },
    workflowName () {
      return this.$route.params.workflow_name
    },
    projectName () {
      return this.$route.params.project_name
    },
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.buildStage)
    },
    buildOverallStatusZh () {
      return this.myTranslate(this.buildOverallStatus)
    },
    buildOverallColor () {
      return this.colorTranslation(this.buildOverallStatus, 'pipeline', 'task')
    },
    curStage () {
      return this.payload.stages[this.curStageIndex]
    }
  },
  created () {
    this.getWorkflowTaskDetail(this.workflowName, this.taskId)
  },
  methods: {
    getWorkflowTaskDetail (workflow_name, task_id) {
      getCustomWorkflowTaskDetailAPI(workflow_name, task_id).then(res => {
        this.payload = res
        this.adaptTaskDetail(res)
      })
    },
    setCurJob (item) {
      this.isShowConsoleFooter = true
      this.curJob = item
    },
    async refreshHistoryTaskDetail () {
      await this.getWorkflowTaskDetail(this.workflowName, this.taskId)
      if (!this.timeTimeoutFinishFlag) {
        this.timerId = setTimeout(this.refreshHistoryTaskDetail, 3000) // 保证内存中只有一个定时器
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
      this.curStageIndex = index
      this.curJob.type = ''
      this.isShowConsoleFooter = true
    },
    showFooter (val) {
      this.isShowConsoleFooter = val
    }
  },
  mounted () {
    this.refreshHistoryTaskDetail()
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: '工作流',
          url: `/v1/projects/detail/${this.projectName}/pipelines`
        },
        {
          title: this.workflowName,
          url: `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.workflowName}`
        },
        { title: this.taskId, url: `` }
      ]
    })
  },
  beforeDestroy () {
    this.timeTimeoutFinishFlag = true
    clearTimeout(this.timerId)
  }
}
</script>
<style lang="less" scoped>
.product-custom-detail {
  height: 100%;
  padding: 24px;
  background: #fff;

  header {
    margin-bottom: 24px;
    line-height: 40px;
    background: #eee;
  }

  main {
    .content {
      display: flex;

      .text {
        line-height: 52px;
      }

      .stages {
        display: flex;
        font-size: 24px;
        text-align: center;

        &-approval {
          display: flex;
          height: 40px;
        }

        .stage {
          width: 140px;
          padding: 16px 8px;
          border: 1px dotted @borderGray;
          border-radius: 8px;

          &-name {
            border-bottom: 1px dotted @borderGray;
          }
        }

        .jobs {
          height: 40px;
          margin-top: 16px;
          padding: 0 8px;
          line-height: 40px;

          .job {
            display: inline-block;
            width: 100px;
            padding: 0 8px;
            overflow: hidden;
            font-weight: 400;
            font-size: 24px;
            font-size: 20px;
            white-space: nowrap;
            text-overflow: ellipsis;
            border: 1px dotted @borderGray;
            // border-radius: 12px;
          }
        }
      }
    }
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
    width: 100px;
    height: 2px;
    margin-top: 24px;
    background: #d2d7dc;
  }
}
</style>
