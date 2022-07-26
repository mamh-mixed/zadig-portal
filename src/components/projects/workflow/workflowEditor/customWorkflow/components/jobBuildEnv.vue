<template>
  <div class="build-env">
    <el-form :label-width="formLabelWidth" :model="form" :rules="rules" ref="ruleForm">
      <el-form-item label="环境" prop="env" required>
        <el-select v-model="form.env" placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in envList" :key="item.id" :label="item.name" :value="item.name"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="服务" prop="source" required>
        <el-select v-model="form.source" placeholder="请选择" size="small" style="width: 220px;">
          <el-option label="运行时输入" value="runtime"></el-option>
          <el-option label="其他 Job 输出" value="fromjob"></el-option>
        </el-select>
        <el-form-item
          prop="job_name"
          required
          v-if="form.source==='fromjob'&&allJobList.length > 0"
          style="display: inline-block; width: 220px;"
          class="mg-l16"
        >
          <el-select v-model="form.job_name" placeholder="请选择" size="small" style="width: 220px;">
            <el-option v-for="(item,index) in allJobList" :key="index" :label="item.name" :value="item.name">{{item.name}}</el-option>
          </el-select>
        </el-form-item>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { listProductAPI } from '@/api'

export default {
  name: 'BuildEnv',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    value: {
      type: Object,
      default: () => ({})
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      formLabelWidth: '90px',
      envList: [],
      rules: {
        env: [
          {
            required: true,
            trigger: 'blur',
            message: '请选择环境'
          }
        ],
        source: [
          {
            required: true,
            trigger: 'blur',
            message: '请选择服务类型'
          }
        ],
        job_name: [
          {
            required: true,
            trigger: 'blur',
            message: '请选择 Job'
          }
        ]
      }
    }
  },
  computed: {
    form: {
      get () {
        return this.value.spec
      },
      set (val) {
        this.$emit('input', val)
      }
    },
    allJobList () {
      const allJobList = this.workflowInfo.stages
        .map(stage => {
          return stage.jobs
        })
        .flat()
      return allJobList.filter(job => job.name !== this.value.name)
    }
  },
  created () {
    this.getEnvList()
  },
  methods: {
    getEnvList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        this.envList = res
      })
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  }
}
</script>
