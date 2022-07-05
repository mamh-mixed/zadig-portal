<template>
  <div class="product-custom-detail">
    <header>
      <el-row>
        <el-col :span="8">
          <span>{{workflowName}}#</span>
          <span>{{taskId}}</span>
          <span :class="$translate.calcTaskStatusColor(payload.status)">{{translateStatus(payload.status)}}</span>
        </el-col>
        <el-col :offset="4" :span="4">
          <i class="el-icon-video-play"></i>
          <span>{{$utils.convertTimestamp(payload.create_time)}}</span>
        </el-col>
        <el-col :span="3">
          <i class="el-icon-time"></i>
          <span>{{ payload.interval }}</span>
        </el-col>
        <el-col :span="2">
          <i class="el-icon-user"></i>
          <span>{{payload.task_revoker}}</span>
        </el-col>
        <el-col :span="1">
          <el-button size="small" @click="cancel">取消</el-button>
        </el-col>
      </el-row>
    </header>
    <Multipane layout="horizontal">
      <main>
        <div class="content">
          <span class="text mg-r8">Start</span>
          <div class="line"></div>
          <div class="stages" v-for="(stage,index) in payload.stages" :key="stage.label">
            <div v-if="stage.approval && stage.approval.enabled" class="stages-approval" @click="handleApprovalChange(stage,index)">
              <el-button type="primary" size="small">人工审核</el-button>
              <div class="line"></div>
            </div>
            <div class="stage">
              <div class="stage-name">{{stage.name}}</div>
              <div class="jobs" v-for="job in stage.jobs" :key="job.name">
                <span class="job" @click="setCurJob(job)">
                  <span :class="$translate.calcTaskStatusColor(job.status)">•</span>
                  <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="job.name">
                    <span class="job-name">{{job.name}}</span>
                  </el-tooltip>
                </span>
              </div>
            </div>
            <div class="line"></div>
          </div>
          <span class="text mg-l8">End</span>
        </div>
      </main>
      <MultipaneResizer class="multipane-resizer" v-if="isShowConsoleFooter"></MultipaneResizer>
      <footer :style="{ minHeight: '500px',maxHeight: '600px'}" v-if="isShowConsoleFooter">
        <BuildConsole
          v-if="curJob.type === jobType.build"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
        />
        <DeployConsole v-if="curJob.type=== jobType.deploy" :jobInfo="curJob" :projectName="projectName" />
        <Approval v-if="!curJob.type" :approvalInfo="curStage" :workflowName="workflowName" :taskId="taskId" @showFooter="showFooter" />
      </footer>
    </Multipane>
  </div>
</template>
<script>
import { getCustomWorkflowTaskDetailAPI, deleteWorkflowTaskAPI } from '@api'
import Stage from './workflowEditor/customWorkflow/stage.vue'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import BuildConsole from './productCustomTaskDetail/buildConsole.vue'
import DeployConsole from './productCustomTaskDetail/deployConsole.vue'
import Approval from './productCustomTaskDetail/approval.vue'
import { jobType } from './workflowEditor/customWorkflow/config'
import bus from '@utils/eventBus'
import { wordTranslate } from '@utils/wordTranslate.js'

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
    },
    translateStatus (word) {
      return wordTranslate(word, 'pipeline', 'task')
    },
    cancel () {
      deleteWorkflowTaskAPI(this.workflowName, this.taskId).then(res => {
        this.$message.success(' 取消成功')
      })
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
    padding: 0 8px;
    line-height: 40px;
    background: #f6f6f6;
    box-shadow: 1px 0 4px -1px rgba(0, 0, 0, 0.3);
  }

  main {
    .content {
      display: flex;

      .text {
        line-height: 52px;
      }

      .stages {
        display: flex;
        font-size: 20px;
        text-align: center;

        &-approval {
          display: flex;
          height: 40px;
        }

        .stage {
          width: 140px;
          margin: -6px 4px;
          padding: 8px 0 16px 0;
          border: 1px dotted @themeColor;
          border-radius: 4px;
        }

        .jobs {
          height: 40px;
          margin-top: 8px;
          padding: 0 8px;
          line-height: 40px;

          .job {
            display: inline-block;
            width: 100px;
            padding: 0 8px;
            overflow: hidden;
            font-weight: 400;
            font-size: 16px;
            white-space: nowrap;
            text-overflow: ellipsis;
            border: 1px dotted @borderGray;
          }
        }
      }
    }
  }

  footer {
    overflow-y: auto;
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
    width: 98px;
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
