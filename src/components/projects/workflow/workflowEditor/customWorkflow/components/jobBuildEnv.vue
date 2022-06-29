<template>
  <div class="build-env">
    <el-form :label-width="formLabelWidth" :model="form" ref="ruleForm">
      <el-form-item label="环境" prop="env" required>
        <!-- <el-select v-model="form.runtime" placeholder="请选择" size="small">
          <el-option label="运行时输入"></el-option>
        </el-select>-->
        <el-select v-model="form.env" placeholder="请选择" size="small">
          <el-option v-for="item in envList" :key="item.id" :label="item.name" :value="item.name"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="服务" prop="source" required>
        <el-select v-model="form.source" placeholder="请选择" size="small">
          <el-option label="运行时输入" value="runtime"></el-option>
          <el-option label="其他 Job输出" value="fromjob"></el-option>
        </el-select>
        <el-form-item prop="job_name" required v-if="form.source==='fromjob'&&allJobList.length > 0">
          <el-select v-model="form.job_name" placeholder="请选择" size="small">
            <el-option v-for="item in allJobList" :key="item.name" :label="item.name" :value="item.name">{{item.name}}</el-option>
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
      formLabelWidth: '60px',
      envList: []
    }
  },
  computed: {
    form: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    },
    allJobList () {
      return this.workflowInfo.stages
        .map(stage => {
          return stage.jobs
        })
        .flat()
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
