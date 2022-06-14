<template>
  <div class="new-workflow-home">
    <div class="left">
      <header class="header">
        <div class="header-name">
          <CanInput v-model="payload.name" placeholder="名称" width="150px" class="mg-r24" />
          <CanInput v-model="payload.description" placeholder="描述" />
        </div>
        <el-tabs v-model="activeName">
          <el-tab-pane :label="item.label" :name="item.name" v-for="item in tabList" :key="item.name"></el-tab-pane>
        </el-tabs>
        <div>
          <el-button type="primary" size="small" @click="operateWorkflow">保存</el-button>
          <el-button type="success" size="small" :disabled="Object.keys(workflowInfo).length === 0" @click="runWorkflow">执行</el-button>
          <el-button type="default" size="small" @click="cancelWorkflow">取消</el-button>
        </div>
      </header>
      <Multipane layout="horizontal">
        <main>
          <section v-show="activeName === 'ui'" class="ui">
            <div class="start">
              <i class="el-icon-video-play"></i>
            </div>
            <div class="line"></div>
            <div class="ui-stage" v-for="(item,index) in payload.stages" :key="item.label">
              <div class="item" @click="setCurStage(index,item)">
                <div @click="showStageOperateDialog('edit',item)" class="edit">
                  <i class="el-icon-edit"></i>
                </div>
                <Stage v-model="payload.stages[index]" :curJobIndex.sync="curJobIndex" />
                <div @click="delStage(index,item)" class="del">
                  <i class="el-icon-close"></i>
                </div>
              </div>
              <div class="line"></div>
            </div>
            <div @click="showStageOperateDialog('add')" class="stage-add">+ Stage</div>
            <div class="line"></div>
            <div>
              <i class="el-icon-video-pause"></i>
            </div>
          </section>
          <section v-show="activeName === 'yaml'" class="yaml">
            <codemirror class="codemirror" ref="yamlEditor" v-model="yaml" :options="editorOptions"></codemirror>
          </section>
        </main>
        <MultipaneResizer class="multipane-resizer" v-if="isShowFooter&&activeName === 'ui'"></MultipaneResizer>
        <footer :style="{ minHeight: '350px'}" v-if="isShowFooter">
          <el-tabs v-model="jobActiveName">
            <el-tab-pane :label="item.label" :name="item.name" v-for="item in jobTabList" :key="item.name"></el-tab-pane>
            <div v-show="jobActiveName === 'base'" v-if="payload.stages.length > 0">
              <el-form :rules="JobConfigrules" ref="jobRuleForm" :model="job">
                <el-form-item
                  label="Job 名称"
                  prop="name"
                  v-if="payload.stages[curStageIndex] && payload.stages[curStageIndex].jobs.length > 0"
                >
                  <el-input v-model="job.name" size="small" style="width: 200px;"></el-input>
                </el-form-item>
                <div v-if="payload.stages[curStageIndex].jobs.length > 0" v-show="job.type === 'zadig-build'" class="mg-t40">
                  <ServiceAndBuild :projectName="projectName" v-model="job.spec.service_and_builds" class="mg-b24" />
                  <el-select size="small" v-model="service">
                    <el-option
                      v-for="service in serviceAndBuilds"
                      :key="service.service_name"
                      :value="service.service_name"
                      :label="service.service_name"
                    >{{service.service_name}}/{{service.service_module}}</el-option>
                  </el-select>
                  <el-button type="success" size="mini" @click="addServiceAndBuild(job.spec.service_and_builds)">+ 添加</el-button>
                </div>
                <div class="mg-t64">
                  <el-button type="primary" size="mini" @click="saveJobConfig">确定</el-button>
                </div>
              </el-form>
            </div>
            <div v-show="jobActiveName === 'env'" v-if="payload.stages.length > 0 && payload.stages[curStageIndex].jobs.length  > 0">
              <Env :projectName="projectName" v-model="job" />
              <div class="mg-t64">
                <el-button type="primary" size="mini" @click="saveJobConfig">确定</el-button>
              </div>
            </div>
          </el-tabs>
        </footer>
      </Multipane>
    </div>
    <!-- <div class="right">
      <div v-for="item in configList" :key="item.value" class="config" @click="isShowDrawer = true">{{item.label}}</div>
      <el-drawer title="变量" :visible.sync="isShowDrawer" direction="rtl">
      </el-drawer>
    </div>-->
    <el-dialog :title="stageOperateType === 'add' ? '新建 Stage' : '编辑 Stage'" :visible.sync="isShowStageOperateDialog" width="20%">
      <StageOperate ref="stageOperate" v-model="stage" />
      <div slot="footer">
        <el-button @click="isShowStageOperateDialog = false" size="small">取 消</el-button>
        <el-button type="primary" @click="operateStage('',stage)" size="small">确 定</el-button>
      </div>
    </el-dialog>
    <el-dialog :visible.sync="isShowRunWorkflowDialog" title="执行工作流" custom-class="run-workflow" width="60%" class="dialog">
      <RunCustomWorkflow
        v-if="isShowRunWorkflowDialog"
        :workflowName="payload.name"
        :projectName="projectName"
        @success="hideAfterSuccess"
      />
    </el-dialog>
  </div>
</template>

<script>
import { tabList, configList, jobTabList, editorOptions } from './config'
import {
  getAssociatedBuildsAPI,
  addCustomWorkflowAPI,
  updateCustomWorkflowAPI,
  getCustomWorkfloweDetailAPI
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import CanInput from './components/CanInput'
import Stage from './stage.vue'
import StageOperate from './stageOperate.vue'
import ServiceAndBuild from './components/ServiceAndBuild'
import Env from './env.vue'
import RunCustomWorkflow from '../../common/runCustomWorkflow'
import Service from '../../../guide/helm/service.vue'
import jsyaml from 'js-yaml'
import { codemirror } from 'vue-codemirror'
import { cloneDeep } from 'lodash'

export default {
  name: 'CustomWorkflow',
  data () {
    return {
      tabList,
      configList,
      jobTabList,
      activeName: 'ui',
      jobActiveName: 'base',
      editorOptions,
      stage: {
        name: '',
        parallel: false,
        jobs: []
      },
      job: {},
      stageOperateType: 'add',
      payload: {
        name: '',
        project: '',
        description: '',
        stages: []
      },
      curStageIndex: 0,
      curJobIndex: 0,
      isShowDrawer: false,
      isShowStageOperateDialog: false,
      serviceAndBuilds: [],
      service: '',
      yaml: '',
      JobConfigrules: {
        name: [
          {
            required: true,
            trigger: 'blur',
            validator: this.validateName
          }
        ]
      },
      isShowRunWorkflowDialog: false
    }
  },
  components: {
    CanInput,
    Stage,
    StageOperate,
    Multipane,
    MultipaneResizer,
    ServiceAndBuild,
    Env,
    Service,
    RunCustomWorkflow,
    codemirror
  },
  computed: {
    projectName () {
      return this.$route.query.projectName
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    },
    workflowInfo () {
      return this.$store.state.customWorkflow.workflowInfo
    }
  },
  created () {
    this.getServiceAndBuildList()
    // edit
    if (this.$route.params.workflow_name) {
      this.getWorkflowDetail(this.$route.params.workflow_name)
    }
  },
  methods: {
    validateName (rule, value, callback) {
      const reg = /^[a-z0-9-]{1,32}$/
      if (value === '') {
        callback(new Error('请输入 Job 名称'))
      } else if (!reg.test(value)) {
        callback(new Error('请输入正确格式的 Job 名称'))
      } else {
        callback()
      }
    },
    operateWorkflow () {
      this.payload.project = this.projectName
      const yamlParams = jsyaml.dump(this.payload)
      const workflowName = this.payload.name
      if (!workflowName) {
        this.$message.error(' 请填写工作流名称')
        return
      }
      if (this.payload.stages.length === 0) {
        this.$message.error(' 请填写 Satge')
        return
      }
      if (this.payload.stages.find(item => item.jobs.length === 0)) {
        this.$message.error(' 请填写 Job')
        return
      }
      if (this.$route.fullPath.includes('edit')) {
        updateCustomWorkflowAPI(workflowName, yamlParams).then(res => {
          this.$message.success('编辑成功')
          this.getWorkflowDetail(this.payload.name)
        })
      } else {
        addCustomWorkflowAPI(yamlParams).then(res => {
          this.$message.success('新建成功')
          this.getWorkflowDetail(this.payload.name)
        })
      }
    },
    cancelWorkflow () {
      this.$router.push(`/v1/projects/detail/${this.projectName}/pipelines`)
    },
    runWorkflow () {
      this.isShowRunWorkflowDialog = true
    },
    getWorkflowDetail (workflow_name) {
      getCustomWorkfloweDetailAPI(workflow_name).then(res => {
        this.payload = jsyaml.load(res)
        this.$store.dispatch('setWorkflowInfo', this.payload)
      })
    },
    showStageOperateDialog (type, row) {
      this.stageOperateType = type
      this.isShowStageOperateDialog = true
      if (row) {
        this.stage = cloneDeep(row)
      }
    },
    operateStage (type, row) {
      this.$refs.stageOperate.$refs.ruleForm.validate(valid => {
        if (valid) {
          if (this.stageOperateType === 'add') {
            this.stage.jobs = []
            this.payload.stages.push(this.stage)
          } else {
            // this.payload.stages[this.curStageIndex] = [...this.stage]
            this.$set(this.payload.stages, this.curStageIndex, this.stage)
          }
          this.isShowStageOperateDialog = false
          this.stage = {}
        }
      })
    },
    delStage (index, item) {
      this.$confirm(`确定删除 Stage [${item.name}]？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(res => {
        const stages = this.payload.stages.filter(
          stage => stage.name !== item.name
        )
        this.curJobIndex = 0
        this.curStageIndex = 0
        this.$set(this.payload, 'stages', stages)
      })
    },
    setCurStage (index, item) {
      this.curStageIndex = index
      this.curStageInfo = item
    },
    saveJobConfig () {
      this.$refs.jobRuleForm.validate(valid => {
        this.$set(
          this.payload.stages[this.curStageIndex].jobs,
          this.curJobIndex,
          this.job
        )
        // this.payload.stages[this.curStageIndex].jobs[this.curJobIndex] = this.job
        this.$store.dispatch('setIsShowFooter', false)
      })
    },
    setJob () {
      if (this.payload.stages.length === 0) return
      this.job = cloneDeep(
        this.payload.stages[this.curStageIndex].jobs[this.curJobIndex]
      )
    },
    getServiceAndBuildList () {
      const projectName = this.projectName
      getAssociatedBuildsAPI(projectName).then(res => {
        this.serviceAndBuilds = res
      })
    },
    addServiceAndBuild (val) {
      const curService = this.serviceAndBuilds.find(
        item => item.service_name === this.service
      )
      val.push(cloneDeep(curService))
    },
    hideAfterSuccess () {
      this.isShowRunWorkflowDialog = false
    }
  },
  watch: {
    activeName (newVal, oldVal) {
      if (newVal === 'yaml') {
        this.yaml = jsyaml.dump(this.payload)
        this.$store.dispatch('setIsShowFooter', false)
      } else {
        this.payload = jsyaml.load(this.yaml)
      }
    },
    // isShowFooter (newVal, oldVal) {
    //   this.job = cloneDeep(
    //     this.payload.stages[this.curStageIndex].jobs[this.curJobIndex]
    //   )
    // },
    'payload.stages': {
      handler (val) {
        this.setJob()
      },
      deep: true
    },
    curJobIndex () {
      this.setJob()
    },
    curStageIndex () {
      this.setJob()
    }
  },
  beforeDestroy () {
    this.$store.dispatch('setIsShowFooter', false)
  }
}
</script>

<style lang="less" scoped>
.new-workflow-home {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  background: #fff;
  border-top: 1px solid @borderGray;

  .left {
    flex: 1;
    padding: 24px;

    .header {
      display: flex;
      justify-content: space-between;

      &-name {
        display: flex;
        height: 32px;
      }
    }

    main {
      width: 100%;
      height: 100%;

      .ui {
        display: flex;
        font-size: 40px;

        &-stage {
          position: relative;
          display: flex;

          .item {
            position: relative;

            .stage {
              padding: 24px;
              border: 1px solid @borderGray;
            }

            .del {
              display: none;
              position: absolute;
              top: -6px;
              right: 6px;
              font-size: 24px;
            }

            .edit {
              position: absolute;
              top: 20px;
              right: 15%;
              font-size: 24px;
            }
            &:hover {
              .del {
                display: block;
              }
            }
          }
        }

        .stage-add {
          width: 100px;
          height: 50px;
          font-size: 24px;
          line-height: 50px;
          border: 1px solid @borderGray;
        }
      }
      .yaml {
        height: 100%;
        .codemirror {
          height: calc(~'100% - 100px');
          padding: 5px;
        }
      }
    }

    footer {
      position: relative;
      z-index: 1;
      background: #fff;
      .confirm {
        position: absolute;
        bottom: 24px;
        left: 50%;
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
    background: #000;
  }
}
</style>
