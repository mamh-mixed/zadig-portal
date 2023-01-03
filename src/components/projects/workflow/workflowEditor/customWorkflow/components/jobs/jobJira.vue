<template>
  <div class="job-jira">
    <el-form label-width="100px" :model="job" ref="ruleForm" label-position="left" class="mg-t24 mg-b24 form-item">
      <el-form-item
        :label="$t(`workflow.jobName`)"
        prop="name"
        :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}"
      >
        <el-input v-model="job.name" size="small" class="fix-width"></el-input>
      </el-form-item>
      <el-form-item label="Jira 项目" prop="spec.project_id" :rules="{required: true,message:'请选择 Jira 项目', trigger: ['blur', 'change']}">
        <el-select
          v-model="job.spec.project_id"
          filterable
          placeholder="请选择"
          size="small"
          style="width: 220px;"
          @change="handleProjectChange"
        >
          <el-option v-for="item in jiras" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="问题类型" prop="spec.issue_type" :rules="{required: true, message: '请选择问题类型', trigger: ['blur', 'change']}">
        <el-select v-model="job.spec.issue_type" filterable placeholder="请选择" size="small" style="width: 220px;" @change="searchIssues">
          <el-option v-for="item in issues" :key="item.type" :label="item.type" :value="item.type"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="变更的问题" :required="job.spec.source && job.spec.source !== 'runtime'">
        <el-form-item v-if="job.spec.source === 'runtime'" class="form-item">
          <el-select
            v-model="job.spec.issues"
            filterable
            multiple
            :disabled="!job.spec.project_id||!job.spec.issue_type"
            placeholder="请选择"
            value-key="key"
            size="small"
            style="width: 220px;"
            @focus="handleEnvChange(job.spec, job.spec.source)"
          >
            <el-option v-for="item in changedIssues" :key="item.key" :label="`${item.id}/${item.fields.summary}`" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="job.spec.source === 'other'"
          class="form-item"
          :rules="{required: true, message: '请选择变量', trigger: ['blur', 'change']}"
        >
          <el-select
            v-model="job.spec.issues"
            key="1"
            placeholder="请选择"
            ref="select"
            size="small"
            value-key="key"
            style="width: 220px;"
            @focus="handleEnvChange(job.spec, job.spec.source)"
          >
            <el-option v-for="(item,index) in globalEnv" :key="index" :label="item" :value="item">{{item}}</el-option>
          </el-select>
        </el-form-item>
        <EnvTypeSelect
          v-model="job.spec.source"
          isRuntime
          isOther
          style="display: inline-block;"
          @change="handlesourceChange($event,'select')"
        />
      </el-form-item>
      <el-form-item label="目标状态" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-select
          v-model="job.spec.target_status"
          filterable
          placeholder="请选择"
          :disabled="!job.spec.project_id||!job.spec.issue_type"
          size="small"
          style="width: 220px;"
        >
          <el-option v-for="item in statusList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {
  getJirasAPI,
  getIssueTypesAndStatusAPI,
  getWorkflowGlobalVarsAPI,
  searchIssueAPI
} from '@/api'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName } from '../../config'
import jsyaml from 'js-yaml'
import { cloneDeep } from 'lodash'

export default {
  name: 'JobDeploy',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    },
    originServiceAndBuilds: {
      type: Array,
      default: () => []
    },
    job: {
      type: Object,
      default: () => ({})
    },
    curStageIndex: {
      type: Number,
      default: 0
    },
    curJobIndex: {
      type: Number,
      default: 0
    }
  },
  components: {
    EnvTypeSelect
  },
  data () {
    return {
      validateJobName,
      jiras: [],
      issues: [],
      changedIssues: [],
      globalEnv: []
    }
  },
  computed: {
    statusList () {
      const cur = this.issues.find(
        item => item.type === this.job.spec.issue_type
      )
      return cur ? cur.status : []
    }
  },
  created () {
    this.getJiras()
  },
  methods: {
    handleEnvChange (row, command) {
      if (command === 'other') {
        this.getGlobalEnv()
      }
    },
    handlesourceChange (val, ref) {
      if (val === 'other') {
        this.$nextTick(() => {
          this.$refs[ref].toggleMenu()
        })
      }
    },
    handleProjectChange () {
      this.getIssues()
      this.searchIssues()
      this.job.spec.issue_type = ''
      this.job.spec.issues = []
      this.job.spec.target_status = ''
    },
    getGlobalEnv () {
      const params = cloneDeep(this.workflowInfo)
      const curJob = cloneDeep(this.job)
      curJob.name = Math.random()
      params.stages[this.curStageIndex].jobs[this.curJobIndex] = curJob
      getWorkflowGlobalVarsAPI(curJob.name, jsyaml.dump(params)).then(res => {
        this.globalEnv = res
      })
    },
    getJiras () {
      getJirasAPI().then(res => {
        this.jiras = res
        this.getIssues()
        this.searchIssues()
      })
    },
    getIssues () {
      if (!this.job.spec.project_id) return
      getIssueTypesAndStatusAPI(this.job.spec.project_id).then(res => {
        this.issues = res
      })
    },
    searchIssues () {
      const { project_id, issue_type, target_status } = this.job.spec
      if (!project_id || !issue_type) return
      searchIssueAPI(project_id, issue_type, target_status).then(res => {
        this.changedIssues = res
      })
    },
    getData () {
      if (this.job.spec.source === 'other') {
        this.job.spec.issues = [{ key: this.job.spec.issues }]
      } else {
        this.job.spec.issues = this.job.spec.issues.map(item => {
          return {
            key: item.key,
            name: item.fields.summary
          }
        })
      }
      return this.job
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  }
}
</script>
<style lang="less" scoped>
.job-jira {
  .form-item {
    display: inline-block;

    .fix-width {
      width: 220px;
    }
  }
}
</style>
