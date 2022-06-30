<template>
  <div class="stage">
    <div class="stage-name">{{stageInfo.name}}</div>
    <div v-for="(item,index) in stageInfo.jobs" :key="item.value" @click="setCurIndex(index,item)" class="job-wrap">
      <span class="job-name">{{item.name}}</span>
      <div class="del" @click="delJob(item,index)" v-if="isShowJobAddBtn">
        <i class="el-icon-close"></i>
      </div>
    </div>
    <el-dialog title="新建 Job" :visible="isShowJobOperateDialog" width="20%">
      <JobOperate v-model="jobInfo" ref="jobOperate" />
      <div slot="footer" class="dialog-footer">
        <el-button @click="isShowJobOperateDialog = false" size="small">取 消</el-button>
        <el-button type="primary" @click="operateJob" size="small">确 定</el-button>
      </div>
    </el-dialog>
    <div @click="addJob" v-if="isShowJobAddBtn" class="job-wrap">+ Job</div>
  </div>
</template>

<script>
import JobOperate from './jobOperate.vue'
import { jobType } from './config'
export default {
  name: 'Stage',
  components: {
    JobOperate
  },
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    curJobIndex: {
      type: Number,
      default: 0
    },
    isShowJobAddBtn: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      jobType,
      jobInfos: {
        'zadig-build': {
          name: 'default',
          type: 'zadig-build',
          spec: {
            docker_registry_id: '',
            service_and_builds: []
          }
        },
        'zadig-deploy': {
          name: 'default',
          type: 'zadig-deploy',
          env: '',
          spec: {
            env: '',
            source: '',
            job_name: ''
          }
        }
      },
      jobInfo: {},
      isShowJobOperateDialog: false
    }
  },
  computed: {
    stageInfo: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    },
    JobIndex: {
      get () {
        return this.curJobIndex
      },
      set (val) {
        this.$emit('update:curJobIndex', val)
      }
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    }
  },
  methods: {
    operateJob () {
      this.$refs.jobOperate.$refs.ruleForm.validate(valid => {
        if (valid) {
          this.stageInfo.jobs.push(this.jobInfos[this.jobInfo.type])
          this.JobIndex = this.stageInfo.jobs.length - 1
          this.isShowJobOperateDialog = false
          this.$store.dispatch('setIsShowFooter', true)
          this.jobInfo = { type: '' }
        }
      })
    },
    addJob () {
      const curJob = this.stageInfo.jobs[this.curJobIndex]
      if (this.stageInfo.jobs.length > 0) {
        if (!curJob.name) {
          this.$message.error('请填写 Job 名称并保存')
          return
        }
        if (curJob.type === jobType.build) {
          if (!curJob.spec.docker_registry_id) {
            this.$message.error('请选择镜像仓库并保存')
            return
          }
        } else {
          if (!curJob.spec.env) {
            this.$message.error('请选择环境并保存')
            return
          }
          if (!curJob.spec.source) {
            this.$message.error('请选择服务来源并保存')
            return
          }
        }
      }
      this.isShowJobOperateDialog = true
    },
    delJob (item, index) {
      this.$confirm(`确定删除 Job [${item.name}]？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(res => {
        this.stageInfo.jobs.splice(index, 1)
        this.$store.dispatch('setIsShowFooter', false)
        this.JobIndex = 0
      })
    },
    setCurIndex (index) {
      this.JobIndex = index
      this.$store.dispatch('setIsShowFooter', true)
    }
  }
}
</script>

<style lang="less" scoped>
.stage {
  text-align: center;

  &-name {
    width: 5em;
    overflow: hidden;
    font-weight: 500;
    font-size: 30px;
    white-space: nowrap;
    text-overflow: ellipsis;
    border-bottom: 1px solid @borderGray;
  }

  .job-wrap {
    position: relative;
    width: 5em;
    height: 36px;
    margin: 12px auto;
    overflow: hidden;
    // padding: 2px 8px;
    color: #555;
    font-size: 20px;
    line-height: 36px;
    white-space: nowrap;
    text-overflow: ellipsis;
    border: 1px solid @borderGray;
    border-radius: 12px;
    cursor: pointer;

    .del {
      position: absolute;
      top: -8px;
      right: 0;
      display: none;
      font-size: 24px;
    }

    &:hover {
      color: #000;

      .del {
        display: block;
      }
    }
  }
}
</style>
