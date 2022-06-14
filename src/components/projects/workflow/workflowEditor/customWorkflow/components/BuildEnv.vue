<template>
  <div class="build-env">
    <el-form :label-width="formLabelWidth" :model="form">
      <el-form-item label="环境">
        <!-- <el-select v-model="form.runtime" placeholder="请选择" size="small">
          <el-option label="运行时输入"></el-option>
        </el-select>-->
        <el-select v-model="form.env" placeholder="请选择" size="small">
          <el-option v-for="item in envList" :key="item.id" :label="item.name" :value="item.name"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="服务">
        <el-select v-model="form.source" placeholder="请选择" size="small">
          <el-option label="运行时输入" value="runtime"></el-option>
          <el-option label="其他 Job输出" value="fromjob"></el-option>
        </el-select>
        <el-select v-model="form.job_name" v-if="form.source==='fromjob'" placeholder="请选择" size="small">
          <el-option v-for="item in allJobList" :key="item.name" :label="item.name" :value="item.name">{{item.name}}</el-option>
        </el-select>
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
      default: () => {}
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
    workflowInfo () {
      return this.$store.state.customWorkflow.workflowInfo
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
    }
  }
}
</script>
<style lang="less" scoped>
.build-env {
}
</style>
