<template>
  <div class="task-detail-container" ref="task-detail-container">
    <el-card class="box-card" :body-style="{ padding: '0px', margin: '15px 0 0 0' }">
      <div slot="header" class="clearfix">
        <span>基本信息</span>
      </div>
      <div class="text item">
        <el-row>
          <el-col :span="12">
            <div class="bg-purple">
              <el-row :gutter="0">
                <el-col :span="5">
                  <div class="status item-title">状态</div>
                </el-col>
                <el-col :span="4">
                  <div class>
                    <el-tag :type="statusTag(taskDetail.status)" size="small" close-transition>{{myTranslate(taskDetail.status)}}</el-tag>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="0">
                <el-col :span="5">
                  <div class="item-title">创建者</div>
                </el-col>
                <el-col :span="4">
                  <div class="item-desc">{{taskDetail.task_creator}}</div>
                </el-col>
              </el-row>
              <el-row v-if="taskDetail.task_revoker" :gutter="0">
                <el-col :span="5">
                  <div class="item-title">取消者</div>
                </el-col>
                <el-col :span="4">
                  <div class="item-desc">{{taskDetail.task_revoker}}</div>
                </el-col>
              </el-row>
              <el-row :gutter="0">
                <el-col :span="5">
                  <div class="item-title">持续时间</div>
                </el-col>
                <el-col :span="4">
                  <div v-if="taskDetail.status!=='running'" class="item-desc">
                    {{ $utils.timeFormat(taskDetail.end_time -
                    taskDetail.start_time) }}
                  </div>
                  <div v-else class="item-desc">
                    {{
                    taskDuration(taskDetail.task_id,taskDetail.start_time) +
                    $utils.timeFormat(durationSet[taskDetail.task_id])}}
                    <el-tooltip v-if="durationSet[taskDetail.task_id]<0" content="本地系统时间和服务端可能存在不一致，请同步。" placement="top">
                      <i class="el-icon-warning" style="color: red;"></i>
                    </el-tooltip>
                  </div>
                </el-col>
              </el-row>
              <el-row v-if="showOperation()" :gutter="0">
                <el-col :span="5">
                  <div class="item-title operation">操作</div>
                </el-col>
                <el-col :span="10">
                  <div class="item-desc">
                    <el-button
                        v-hasPermi="{projectName: projectName, action: 'run_workflow',isBtn:true}"
                        v-if="(taskDetail.status!=='running' && taskDetail.status !=='created') && taskDetail.status!=='passed'"
                        @click="taskOperation('restart',taskDetail.task_id,taskDetail.pipeline_name)"
                        type="text"
                        size="medium"
                      >失败重试</el-button>
                      <el-button
                        v-hasPermi="{projectName: projectName, action: 'run_workflow',isBtn:true}"
                        v-if="taskDetail.status==='running' || taskDetail.status ==='created'"
                        @click="taskOperation('cancel',taskDetail.task_id,taskDetail.pipeline_name)"
                        type="text"
                        size="medium"
                      >取消任务</el-button>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
    <!--end of basic info-->

    <el-card
      v-if="!$utils.isEmpty(buildStage)"
      class="box-card task-process"
      :body-style="{ padding: '0px', margin: '15px 0 0 0' }"
    >
      <div slot="header" class="clearfix">
        <span>构建</span>
        <div v-if="buildStage.status==='running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <el-alert v-if="buildStage.error" title="错误信息" :description="buildStage.error" type="error" close-text="知道了"></el-alert>
      <div class="text item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="item-title">
              <i class="iconfont iconzhuangtai"></i> 构建状态
            </div>
          </el-col>
          <el-col :span="6">
            <div class="item-desc">
              <a :class="buildOverallColor" href="#buildv3-log">{{buildStage.status?buildOverallStatusZh:"未运行"}}</a>
            </div>
          </el-col>
          <el-col v-if="buildStage.status!=='running'" :span="6">
            <div class="item-title">
              <i class="iconfont iconshijian"></i> 持续时间
            </div>
          </el-col>
          <el-col v-if="buildStage.status!=='running'" :span="6">
            <span class="item-desc">
              {{$utils.timeFormat(buildStage.sub_tasks.end_time -
              buildStage.sub_tasks.start_time)}}
            </span>
          </el-col>
        </el-row>
        <template v-if="buildStage.sub_tasks.job_ctx">
          <el-row :gutter="0" v-for="(build,index) in buildStage.sub_tasks.job_ctx.builds" :key="index">
            <el-col :span="6">
              <div class="item-title">
                <i class="iconfont icondaima"></i>
                代码库({{build.source}})
              </div>
            </el-col>
            <el-col :span="6">
              <div class="item-desc">{{build.repo_name}}</div>
            </el-col>
            <el-col :span="6">
              <div class="item-title">
                <i class="iconfont iconinfo"></i> 代码信息
              </div>
            </el-col>
            <el-col :span="6">
              <el-tooltip :content="`在 ${build.source} 上查看 Release`" placement="top" effect="dark">
                <span v-if="build.tag" class="link">
                  <a :href="`${build.address}/${build.repo_owner}/${build.repo_name}/releases/tag/${build.tag}`" target="_blank">{{"Tag-"+build.tag}}</a>
                </span>
              </el-tooltip>
              <el-tooltip :content="`在 ${build.source} 上查看 Branch`" placement="top" effect="dark">
                <span v-if="build.branch" class="link">
                  <a
                    v-if="build.source==='github'"
                    :href="`${build.address}/${build.repo_owner}/${build.repo_name}/tree/${build.branch}`"
                    target="_blank"
                  >{{"Branch-"+build.branch}}</a>
                  <a
                    v-if="build.source==='gitlab'"
                    :href="`${build.address}/${build.repo_owner}/${build.repo_name}/tree/${build.branch}`"
                    target="_blank"
                  >{{"Branch-"+build.branch}}</a>
                  <a
                    v-if="!build.source"
                    :href="`${build.address}/${build.repo_owner}/${build.repo_name}/tree/${build.branch}`"
                    target="_blank"
                  >{{"Branch-"+build.branch}}</a>
                </span>
              </el-tooltip>
              <el-tooltip :content="`在 ${build.source} 上查看 PR`" placement="top" effect="dark">
                <span v-if="build.pr && build.pr>0" class="link">
                  <a
                    v-if="build.source==='github'"
                    :href="`${build.address}/${build.repo_owner}/${build.repo_name}/pull/${build.pr}`"
                    target="_blank"
                  >{{"PR-"+build.pr}}</a>
                  <a
                    v-if="build.source==='gitlab'"
                    :href="`${build.address}/${build.repo_owner}/${build.repo_name}/merge_requests/${build.pr}`"
                    target="_blank"
                  >{{"PR-"+build.pr}}</a>
                  <a
                    v-if="!build.source"
                    :href="`${build.address}/${build.repo_owner}/${build.repo_name}/pull/${build.pr}`"
                    target="_blank"
                  >{{"PR-"+build.pr}}</a>
                </span>
              </el-tooltip>
              <el-tooltip :content="`在 ${build.source} 上查看 Commit`" placement="top" effect="dark">
                <span v-if="build.commit_id" class="link">
                  <a
                    :href="`${build.address}/${build.repo_owner}/${build.repo_name}/commit/${build.commit_id}`"
                    target="_blank"
                  >{{"Commit-"+build.commit_id.substring(0, 10)}}</a>
                </span>
              </el-tooltip>
            </el-col>
          </el-row>
        </template>

      </div>
    </el-card>

    <el-card
      id="buildv3-log"
      v-if="!$utils.isEmpty(buildStage)"
      class="box-card task-process"
      :body-style="{ padding: '0px', margin: '15px 0 0 0' }"
    >
      <div class="log-container">
        <div class="log-content">
          <el-collapse @change="getBuildLog">
            <el-collapse-item id="log-container" title="查看构建日志">
              <XtermLog v-if="showBuildLog" @mouseleave.native="leaveLog" :id="buildStage.sub_tasks.service_name" :logs="buildv3AnyLog"/>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-card>

    <!-- end of buildv3 -->
    <el-card
      v-if="!$utils.isEmpty(extensionStage)"
      class="box-card task-process"
      :body-style="{ padding: '0px', margin: '15px 0 0 0' }"
    >
      <el-alert v-if="extensionStage.sub_tasks && extensionStage.sub_tasks.error" title="错误信息" :description="extensionStage.sub_tasks.error" type="error" close-text="知道了"></el-alert>
      <div slot="header" class="clearfix">
        <span>扩展</span>
        <div v-if="extensionStage.status==='running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="text item">
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="item-title">
              <i class="iconfont iconzhuangtai"></i> 状态
            </div>
          </el-col>
          <el-col :span="6">
            <div
              class="item-desc"
              :class="colorTranslation(extensionStage.status,'pipeline','task')"
            >{{extensionStage.status?myTranslate(extensionStage.status):"未运行"}}</div>
          </el-col>
          <el-col v-if="extensionStage.status!=='running'" :span="6">
            <div class="item-title">
              <i class="iconfont iconshijian"></i> 持续时间
            </div>
          </el-col>
          <el-col v-if="extensionStage.status!=='running'" :span="6">
            <span class="item-desc">
              {{$utils.timeFormat(extensionStage.sub_tasks.end_time -
              extensionStage.sub_tasks.start_time)}}
            </span>
          </el-col>
        </el-row>
        <!-- <el-row :gutter="0">
          <el-col :span="6">
            <div class="item-title">
              <i class="iconfont iconSliceCopy"></i> APP ID
            </div>
          </el-col>
          <el-col :span="6">
            <div class="item-desc">N/A</div>
          </el-col>
          <el-col :span="6">
            <div class="item-title">
              <i class="iconfont iconfuwu"></i> 版本号
            </div>
          </el-col>
          <el-col :span="6">
            <div class="item-desc">N/A</div>
          </el-col>
        </el-row> -->
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="item-title">
              <i class="iconfont iconinfo"></i> 体验码
            </div>
          </el-col>
          <el-col :span="6">
            <!-- <QrcodeVue v-if="codeURL" :value="codeURL" class="item-desc"></QrcodeVue> -->
            <el-link v-if="codeURL" type="primary" :href="codeURL" target="_blank" rel="noopener noreferrer">{{codeURL}}</el-link>
            <div v-else class="item-desc">N/A</div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
import { wordTranslate, colorTranslate } from '@utils/wordTranslate.js'
import {
  getCommonWorkflowTaskDetailSSEAPI,
  getCommonWorkflowTaskDetailAPI,
  restartCommonWorkflowTaskAPI,
  cancelCommonWorkflowTaskAPI,
  getCommonWorkflowHistoryLogAPI
} from '@api'
import bus from '@utils/eventBus'
import { get } from 'lodash'
export default {
  data () {
    return {
      taskDetail: {},
      buildStage: {},
      extensionStage: {},
      switchScroll: true,
      scrollTop: 0,
      buildv3AnyLog: [],
      wsBuildDataBuffer: [],
      showBuildLog: false,
      durationSet: {}
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    workflowName () {
      return this.$route.params.workflow_name
    },
    workflowID () {
      return this.$route.query.id
    },
    serviceName () {
      return this.buildStage && this.buildStage.service_name
    },
    taskID () {
      return this.$route.params.task_id
    },
    buildRunning () {
      return (
        this.buildStage && this.buildStage.status === 'running'
      )
    },
    buildDone () {
      return this.isStageDone(this.buildStage)
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
    codeURL () {
      return get(this.extensionStage.sub_tasks, 'callback_payload.QR_code_URL')
    }
  },
  methods: {
    getCommonWorkflowTaskSSEDetail (workflowName, id) {
      const projectName = this.projectName
      return getCommonWorkflowTaskDetailSSEAPI(projectName, workflowName, id)
        .then(res => {
          this.taskDetail = res.data
          if (this.taskDetail.stages) {
            this.buildStage = this.taskDetail.stages.find(stage => stage.type === 'buildv3')
            if (this.buildStage) {
              this.buildStage.sub_tasks = this.buildStage.sub_tasks[`${workflowName}-job`]
            }
            this.extensionStage = this.taskDetail.stages.find(stage => stage.type === 'trigger')
            if (this.extensionStage) {
              this.extensionStage.sub_tasks = this.extensionStage.sub_tasks[`${workflowName}-job`]
            }
          }
        })
        .closeWhenDestroy(this)
    },
    getCommonWorkflowTaskDetail (workflowName, id) {
      const projectName = this.projectName
      getCommonWorkflowTaskDetailAPI(projectName, workflowName, id).then(res => {
        this.taskDetail = res
        if (this.taskDetail.stages) {
          this.buildStage = this.taskDetail.stages.find(stage => stage.type === 'buildv3')
          if (this.buildStage) {
            this.buildStage.sub_tasks = this.buildStage.sub_tasks[`${workflowName}-job`]
          }
          this.extensionStage = this.taskDetail.stages.find(stage => stage.type === 'trigger')
          if (this.extensionStage) {
            this.extensionStage.sub_tasks = this.extensionStage.sub_tasks[`${workflowName}-job`]
          }
        }
      })
    },
    showOperation () {
      if (
        this.taskDetail.status !== 'running' &&
        this.taskDetail.status !== 'passed'
      ) {
        return true
      }
      if (this.taskDetail.status === 'running') {
        return true
      }
      return false
    },
    taskDuration (taskID, started) {
      const refresh = () => {
        const duration = Math.floor(Date.now() / 1000) - started
        this.$set(this.durationSet, taskID, duration)
      }
      setInterval(refresh, 1000)
      return ''
    },
    taskOperation (operation, taskID, workflowName) {
      const projectName = this.projectName
      if (operation === 'restart') {
        const taskUrl = `/v1/projects/detail/${this.projectName}/pipelines/common/${this.workflowName}/${this.taskID}?id=${this.workflowID}`
        restartCommonWorkflowTaskAPI(projectName, workflowName, taskID).then(res => {
          this.$message({
            message: '任务已重新启动',
            type: 'success'
          })
          this.$router.push(taskUrl)
        })
      } else if (operation === 'cancel') {
        cancelCommonWorkflowTaskAPI(projectName, workflowName, taskID).then(res => {
          this.$notify({
            title: '成功',
            message: '任务取消成功',
            type: 'success',
            offset: 50
          })
        })
      }
    },
    getBuildLog () {
      this.showBuildLog = true
    },
    separateProcess (workflow) {
      workflow.stages.forEach(task => {
        workflow[task.type] = task
      })
      delete workflow.stages
      return workflow
    },
    myTranslate (word) {
      return wordTranslate(word, 'pipeline', 'task')
    },
    colorTranslation (word, category, subitem) {
      return colorTranslate(word, category, subitem)
    },
    statusTag (status) {
      if (status === 'created') {
        return ''
      } else if (status === 'running') {
        return 'primary'
      } else if (status === 'timeout') {
        return 'warning'
      } else if (status === 'cancelled') {
        return 'gray'
      } else if (status === 'passed') {
        return 'success'
      } else if (status === 'failed') {
        return 'danger'
      }
    },
    leaveLog () {
      const el = document.querySelector('.task-detail-container').style
      el.overflow = 'auto'
    },
    openBuildLog (buildType) {
      const url = `/api/aslan/logs/sse/v3/workflow/build/${this.workflowName}/${this.taskID}/999999?subTask=${buildType}`
      if (typeof window.msgServer === 'undefined') {
        this[`${buildType}IntervalHandle`] = setInterval(() => {
          if (this.hasNewMsg) {
            this.buildv3AnyLog = this.buildv3AnyLog.concat(
              this.wsBuildDataBuffer
            )
            this.wsBuildDataBuffer = []
          }
          this.hasNewMsg = false
        }, 500)
        this.$sse(url, { format: 'plain' })
          .then(sse => {
            // Store SSE object at a higher scope
            window.msgServer = sse
            sse.onError(e => {
              console.error('lost connection; giving up!', e)
              sse.close()
              this.killLog(buildType)
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
            this.killLog(buildType)
          })
      }
    },
    killLog (type) {
      clearInterval(this[`${type}IntervalHandle`])
      if (typeof msgServer !== 'undefined' && msgServer) {
        msgServer.close()
        delete window.msgServer
      }
    },
    getHistoryBuildLog () {
      const projectName = this.projectName
      const taskID = this.taskID
      const workflowName = this.workflowName
      return getCommonWorkflowHistoryLogAPI(
        projectName,
        workflowName,
        taskID
      ).then(res => {
        this.buildv3AnyLog = res.split('\n').map(element => {
          return element + '\n'
        })
      })
    },
    isStageDone (stage) {
      return (
        stage &&
        stage.status in
          {
            passed: 1,
            skipped: 1,
            failed: 1,
            timeout: 1,
            cancelled: 1
          }
      )
    },
    scrollToTop () {
      this.$refs['task-detail-container'].scrollTop = 0
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, {
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
          url: `/v1/projects/detail/${this.projectName}/pipelines/common/${this.workflowName}?id=${this.workflowID}`
        },
        { title: `#${this.taskID}`, url: '' }
      ]
    })

    if (
      this.$route.query.status === 'passed' ||
      this.$route.query.status === 'failed' ||
      this.$route.query.status === 'timeout' ||
      this.$route.query.status === 'cancelled'
    ) {
      this.getCommonWorkflowTaskDetail(this.workflowName, this.taskID)
    } else {
      this.getCommonWorkflowTaskSSEDetail(this.workflowName, this.taskID)
    }
  },
  watch: {
    $route (to, from) {
      if (
        this.$route.query.status === 'passed' ||
        this.$route.query.status === 'failed' ||
        this.$route.query.status === 'timeout' ||
        this.$route.query.status === 'cancelled'
      ) {
        this.getCommonWorkflowTaskDetail(this.workflowName, this.taskID)
      } else {
        this.getCommonWorkflowTaskSSEDetail(this.workflowName, this.taskID)
      }
    },
    buildRunning (val, oldVal) {
      if (!oldVal && val && this.showBuildLog) {
        this.openBuildLog('buildv3')
      }
      if (oldVal && !val) {
        this.killLog('buildv3')
      }
    },
    showBuildLog (val, oldVal) {
      if (!oldVal && val) {
        if (this.buildRunning) {
          this.openBuildLog('buildv3')
        } else if (this.buildDone) {
          this.getHistoryBuildLog()
        }
      }
    }
  },
  beforeDestroy () {
    this.killLog('buildv3')
  },
  components: {
    QrcodeVue
  }
}
</script>

<style lang="less">
.issue-popper {
  display: inline-block;
  font-size: 14px;

  p {
    margin: 0.5em 0;
  }

  .issue-url {
    color: @themeColor;
    cursor: pointer;
  }
}

.task-detail-container {
  position: relative;
  flex: 1;
  padding: 0 20px;
  overflow: auto;
  font-size: 13px;

  .el-breadcrumb {
    font-size: 16px;
    line-height: 1.35;

    .el-breadcrumb__item__inner a:hover,
    .el-breadcrumb__item__inner:hover {
      color: @themeColor;
      cursor: pointer;
    }
  }

  .text {
    font-size: 14px;
  }

  .item {
    padding: 10px 0;
    padding-left: 1px;

    .icon-color {
      color: #9ea3a9;
      cursor: pointer;

      &:hover {
        color: @themeColor;
      }
    }

    .icon-color-cancel {
      color: #ff4949;
      cursor: pointer;
    }

    .status {
      line-height: 24px;
    }
  }

  .clearfix::before,
  .clearfix::after {
    display: table;
    content: '';
  }

  .clearfix {
    span {
      color: #303133;
      font-size: 16px;
      line-height: 20px;
    }
  }

  .clearfix::after {
    clear: both;
  }

  .box-card {
    background-color: #fff;

    .item-title {
      color: #8d9199;
    }

    .item-desc {
      .start-build,
      .edit-pipeline {
        color: @themeColor;
        font-size: 13px;
        cursor: pointer;
      }
    }

    .color-passed {
      color: #6ac73c;
      font-weight: 500;
    }

    .color-failed {
      color: #ff1949;
      font-weight: 500;
    }

    .color-cancelled {
      color: #909399;
      font-weight: 500;
    }

    .color-timeout {
      color: #e6a23c;
      font-weight: 500;
    }

    .color-running {
      color: @themeColor;
      font-weight: 500;
    }

    .color-created {
      color: #cdb62c;
      font-weight: 500;
    }

    .color-notrunning {
      color: #303133;
      font-weight: 500;
    }

    .issue-tag {
      margin-right: 5px;
      margin-bottom: 5px;
      cursor: pointer;
    }

    .deploy_env {
      color: @themeColor;
    }

    .error-color {
      color: #fa6464;
    }

    .show-log {
      font-size: 1.33rem;
      cursor: pointer;

      &:hover {
        color: @themeColor;
      }
    }

    .show-test-result {
      color: @themeColor;
      cursor: pointer;
    }

    .show-log-title {
      line-height: 17px;
    }

    .operation {
      line-height: 16px;
    }
  }

  .box-card,
  .task-process {
    margin-top: 15px;
    border: none;
    box-shadow: none;
  }

  .task-process {
    width: 100%;
  }

  .el-card__header {
    padding-left: 0;
  }

  .el-row {
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }
  }
  // .link {
  //   a {
  //     color: @themeColor;
  //     cursor: pointer;
  //   }
  // }
  a.item-desc {
    color: @themeColor;
    cursor: pointer;
  }

  .loader {
    display: inline-block;
    width: 25px;
    height: 25px;
    vertical-align: middle;

    .ball-scale-multiple {
      transform: none;

      div {
        top: 0;
        left: 0;
        width: 25px;
        height: 25px;
        background-color: @themeColor;
      }
    }
  }

  .log-container {
    padding-bottom: 15px;

    .log-content {
      .xterm {
        padding: 15px 10px;
      }

      .el-collapse-item__content {
        padding-bottom: 0;
      }

      .el-collapse-item__arrow {
        margin-right: 16px;
      }

      &.test {
        margin-bottom: 80px;
      }
    }
  }

  .pointer {
    cursor: pointer;
  }
}
</style>
