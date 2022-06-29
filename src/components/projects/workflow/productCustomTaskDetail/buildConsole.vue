<template>
  <div class="build-console">
    <el-card :body-style="{padding: '8px 20px', margin: '5px 0 0 0' }"  class="box-card task-process">
      <div slot="header" class="mg-b8">
        <el-col :span="4">
          <span class="build-console-type">构建</span>
          <span>{{jobInfo.name}}</span>
        </el-col>
        <div v-if="jobInfo.status==='running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <el-col v-if="jobInfo.status!=='running'" :span="2">
          <div class="grid-content item-desc">
            <a :class="buildOverallColor" href="#buildv4-log">{{jobInfo.status?buildOverallStatusZh:"未运行"}}</a>
          </div>
        </el-col>
        <el-col v-if="jobInfo.status!=='running'" :span="2">
          <span class="item-desc">{{$utils.timeFormat(jobInfo.end_time - jobInfo.start_time)}}</span>
        </el-col>
      </div>
      <div class="error-wrapper">
        <el-alert v-if="jobInfo.error" title="错误信息" :description="jobInfo.error" type="error" close-text="知道了"></el-alert>
      </div>
      <el-row class="text item mg-t24" :gutter="0" v-for="(build,index) in jobInfo.spec.repos" :key="index">
        <el-col :span="4">
          <div class="grid-content item-title">代码库({{build.source}})</div>
        </el-col>
        <el-col :span="8">
          <div>{{build.repo_name}}</div>
        </el-col>
        <el-col :span="4">
          <div class="item-title">代码信息</div>
        </el-col>
        <el-col :span="8">
          <RepoJump :build="build" showIcon />
        </el-col>
      </el-row>
      <el-row :gutter="0" class="mg-t24">
        <el-col :span="4">
          <div class="item-title">服务名称</div>
        </el-col>
        <el-col :span="8">
          <span class="item-desc">{{jobInfo.spec.service_name}}({{jobInfo.spec.service_module}})</span>
        </el-col>
        <el-col :span="4">
          <div class="item-title">
            镜像名称
            <el-tooltip effect="dark" placement="top">
              <div slot="content">
                构建镜像标签生成规则 ：
                <br />选择 Tag 进行构建 ： 构建时间戳 -
                Tag
                <br />只选择分支进行构建：构建时间戳
                - 任务 ID - 分支名称
                <br />选择分支和 PR 进行构建：构建时间戳 - 任务 ID - 分支名称 - PR ID
                <br />只选择 PR
                进行构建：构建时间戳 - 任务 ID - PR ID
              </div>
              <span>
                <i class="el-icon-question"></i>
              </span>
            </el-tooltip>
          </div>
        </el-col>
        <el-col :span="8">
          <el-tooltip effect="dark" :content="jobInfo.spec.image" placement="top">
            <span class="item-desc">{{jobInfo.spec.image.split('/').pop()}}</span>
          </el-tooltip>
        </el-col>
      </el-row>
      <div class="log-content mg-t24">
        <XtermLog :id="jobInfo.spec.service_name" @mouseleave.native="leaveLog" :logs="buildv4AnyLog" />
      </div>
    </el-card>
  </div>
</template>

<script>
import RepoJump from '@/components/projects/workflow/common/repoJump.vue'
import mixin from '@/mixin/killSSELogMixin'
import { getHistoryLogsAPI } from '@api'

export default {
  data () {
    return {
      buildv4AnyLog: [],
      wsBuildDataBuffer: [],
      buildLogStarted: true
    }
  },
  props: {
    jobInfo: {
      type: Object,
      default: () => ({})
    },
    projectName: {
      type: String,
      default: ''
    },
    taskId: {
      type: [String, Number],
      default: 1
    },
    workflowName: {
      type: String,
      default: ''
    }
  },
  mixins: [mixin],
  components: {
    RepoJump
  },
  computed: {
    buildIsRunning () {
      return this.jobInfo && this.jobInfo.status === 'running'
    },
    buildIsDone () {
      return this.isSubTaskDone(this.jobInfo)
    },
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.jobInfo, {})
    },
    buildOverallStatusZh () {
      return this.$translate.translateTaskStatus(this.buildOverallStatus)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  },
  methods: {
    getBuildv2Log () {
      this.buildLogStarted = true
    },
    leaveLog () {
      const el = document.querySelector('.product-custom-detail').style
      el.overflow = 'auto'
    },
    openBuildLog (buildType) {
      const url = `/api/aslan/logs/sse/v4/workflow/${this.workflowName}/${this.taskId}/${this.jobInfo.name}/999999`
      if (typeof window.msgServer === 'undefined') {
        window.msgServer = {}
        window.msgServer[
          `${this.jobInfo.spec.service_module}_${this.jobInfo.spec.service_name}`
        ] = {}
      }
      this[`${buildType}IntervalHandle`] = setInterval(() => {
        if (this.hasNewMsg) {
          this.buildv4AnyLog = this.buildv4AnyLog.concat(this.wsBuildDataBuffer)
          this.wsBuildDataBuffer = []
        }
        this.hasNewMsg = false
      }, 500)
      this.$sse(url, { format: 'plain' })
        .then(sse => {
          // Store SSE object at a higher scope
          window.msgServer[
            `${this.jobInfo.spec.service_module}_${this.jobInfo.spec.service_name}`
          ] = sse
          sse.onError(e => {
            console.error('lost connection; giving up!', e)
            sse.close()
            this.killLog('customWorkflow')
          })
          // Listen for messages without a specified event
          sse.subscribe('', data => {
            this.hasNewMsg = true
            this.wsBuildDataBuffer = this.wsBuildDataBuffer.concat(
              Object.freeze(data + '\n')
            )
          })
        })
        .catch(err => {
          console.error('Failed to connect to server', err)
          this.killLog('customWorkflow')
        })
    },
    getHistoryBuildLog () {
      return getHistoryLogsAPI(
        this.workflowName,
        this.taskId,
        this.jobInfo.name
      ).then(response => {
        this.buildv4AnyLog = response.split('\n').map(element => {
          return element + '\n'
        })
      })
    },
    getLog () {
      if (this.buildIsRunning) {
        this.openBuildLog('customWorkflow')
      } else {
        this.getHistoryBuildLog()
      }
    }
  },
  watch: {
    buildIsRunning (val, oldVal) {
      if (!oldVal && val && this.buildLogStarted) {
        this.openBuildLog('customWorkflow')
      }
      if (oldVal && !val) {
        this.killLog('customWorkflow')
      }
    },
    jobInfo: {
      handler (val) {
        if (val) {
          this.getLog()
        }
      },
      deep: true,
      immediate: true
    }
  },
  beforeDestroy () {
    this.killLog('docker_build')
  }
}
</script>
<style lang="less" scoped>
@import '~@assets/css/component/subtask.less';

.build-console {
  height: 100%;
  font-size: 14px;

  &-type {
    margin-right: 8px;
    font-weight: 500;
  }

  .item {
    &-title {
      color: #8d9199;
    }
  }
}
</style>
