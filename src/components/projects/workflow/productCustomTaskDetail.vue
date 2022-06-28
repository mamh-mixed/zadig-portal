<template>
  <div class="product-custom-detail">
    <Multipane layout="horizontal">
      <main>
        <i class="el-icon-video-play"></i>
        <div class="line"></div>
        <div class="stages" v-for="(stage) in payload.stages" :key="stage.label">
          <div class="stage">
            <div class="stage-name">{{stage.name}}</div>
            <div class="jobs" v-for="job in stage.jobs" :key="job.name">
              <span class="jobs-name" @click="setCurJob(job)">
                <span class="jobs-status"></span>
                <span>{{job.name}}</span>
              </span>
            </div>
          </div>
          <div class="line"></div>
        </div>
        <i class="el-icon-video-pause"></i>
      </main>
      <div></div>
      <MultipaneResizer class="multipane-resizer" v-if="isShowConsoleFooter"></MultipaneResizer>
      <footer :style="{ minHeight: '350px'}" v-if="isShowConsoleFooter">
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
      console.log(this.curJob)
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
    display: flex;
    align-items: center;
    font-size: 40px;
    .stages {
      display: flex;
      align-items: center;
      // flex-direction: row;
      // width: 6em;
      padding: 16px;
      text-align: center;
      font-size: 24px;
      .stage {
        padding: 16px;
        border-radius: 8px;
        border: 1px dotted @borderGray;
        &-name {
          border-bottom: 1px dotted @borderGray;
        }
      }
      .jobs {
        height: 40px;
        line-height: 40px;
        margin-top: 16px;
        padding: 0 8px;

        &-name {
          width: 100px;
          padding: 0 8px;
          display: inline-block;
          font-size: 24px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 20px;
          font-weight: 400;
          border: 1px dotted @borderGray;
          border-radius: 12px;
        }
        &-status {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 8px;
          border-radius: 50%;
          background: green;
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
    background: #000;
  }
}
</style>
