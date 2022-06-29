<template>
  <div class="product-custom-detail">
    <Multipane layout="horizontal">
      <main>
        <div class="content">
          <!-- <i class="el-icon-video-play"></i> -->
          <span class="text mg-r8">Start</span>
          <div class="line"></div>
          <div class="stages" v-for="(stage) in payload.stages" :key="stage.label">
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
          <!-- <i class="el-icon-video-pause"></i> -->
        </div>
      </main>
      <div></div>
      <MultipaneResizer class="multipane-resizer" v-if="isShowConsoleFooter"></MultipaneResizer>
      <footer :style="{ minHeight: '400px'}" v-if="isShowConsoleFooter">
        <BuildConsole
          v-if="curJob.type === jobType.build"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
        />
        <DeployConsole v-if="curJob.type=== jobType.deploy" :jobInfo="curJob" />
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
import { jobType } from './workflowEditor/customWorkflow/config'
export default {
  data () {
    return {
      jobType,
      isShowConsoleFooter: false,
      curJobIndex: 0,
      curJob: {},
      payload: {}
    }
  },
  components: {
    Stage,
    Multipane,
    MultipaneResizer,
    BuildConsole,
    DeployConsole
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
    }
  },
  created () {
    this.getWorkflowTaskDetail(this.workflowName, this.taskId)
  },
  methods: {
    getWorkflowTaskDetail (workflow_name, task_id) {
      getCustomWorkflowTaskDetailAPI(workflow_name, task_id).then(res => {
        this.payload = res
      })
    },
    setCurJob (item) {
      this.isShowConsoleFooter = true
      this.curJob = item
    }
  }
}
</script>
<style lang="less" scoped>
.product-custom-detail {
  height: 100%;
  padding: 24px;
  background: #fff;

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

        .stage {
          width: 140px;
          padding: 8px;
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
            border-radius: 12px;
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
