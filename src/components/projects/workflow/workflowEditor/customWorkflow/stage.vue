<template>
  <div class="stage">
    <div class="stage-name">{{stageInfo.name}}</div>
    <div v-for="(item,index) in stageInfo.jobs" :key="item.value" @click="setCurIndex(index,item)" class="job-wrap">
      <span class="job-name">{{item.name}}</span>
      <div class="del" @click="delJob(item)" v-if="isShowJobAddBtn">
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
    <div @click="isShowJobOperateDialog = true" v-if="isShowJobAddBtn" class="job-wrap">+ Job</div>
  </div>
</template>

<script>
import JobOperate from './jobOperate.vue'

export default {
  name: 'Stage',
  components: {
    JobOperate
  },
  props: {
    value: {
      type: Object,
      default: () => {}
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
      return this.$store.state.CustomWorkflow.isShowFooter
    }
  },
  methods: {
    operateJob () {
      this.$refs.jobOperate.$refs.ruleForm.validate(valid => {
        if (valid) {
          this.stageInfo.jobs.push(this.jobInfos[this.jobInfo.type])
          this.JobIndex = this.stageInfo.jobs.length - 1
          this.isShowJobOperateDialog = false
          // this.stageInfo.jobs[index] = {}
          this.$store.dispatch('setIsShowFooter', true)
          this.jobInfo = { type: '' }
        }
      })
    },
    delJob (item) {
      this.$confirm(`确定删除 Job [${item.name}]？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(res => {
        this.stageInfo.jobs = this.stageInfo.jobs.filter(
          job => job.name !== item.name
        )
        this.$store.dispatch('setIsShowFooter', false)
      })
    },
    setCurIndex (index) {
      this.$store.dispatch('setIsShowFooter', true)
      this.JobIndex = index
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
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 30px;
    font-weight: 500;
    border-bottom: 1px solid  @borderGray;
  }

  .job-wrap {
    position: relative;
    height: 36px;
    line-height: 36px;
    margin: 12px auto;
    // padding: 2px 8px;
    color: #555;
    cursor: pointer;
    border: 1px solid @borderGray;
    width: 5em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 20px;
    border-radius: 12px;

    .del {
      display: none;
      position: absolute;
      top: -8px;
      right: 0px;
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
