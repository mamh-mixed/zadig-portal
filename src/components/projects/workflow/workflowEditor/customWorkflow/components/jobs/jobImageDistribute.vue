<template>
  <div class="job-deploy">
    <el-form label-width="90px" :model="job" ref="ruleForm" label-position="left" class="mg-t24 mg-b24">
      <el-form-item label="任务名称" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="服务组件" :required="job.spec.source && job.spec.source!=='runtime'">
        <el-form-item prop="spec.targets" v-if="job.spec.source === 'runtime'" class="form-item">
          <el-select size="small" key="2" v-model="job.spec.targets" filterable clearable value-key="value" multiple style="width: 220px;">
            <el-option
              v-for="(service,index) in originServiceAndBuilds"
              :key="index"
              :value="service"
              :label="`${service.service_name}/${service.service_module}`"
            >{{`${service.service_name}/${service.service_module}`}}</el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          prop="spec.job_name"
          v-if="job.spec.source === 'other'"
          required
          class="form-item"
          :rules="{required: true, message: '请选择服务', trigger: ['blur', 'change']}"
        >
          <el-select key="1" v-model="job.spec.job_name" placeholder="请选择" size="small" style="width: 220px;">
            <el-option v-for="(item,index) in allJobList" :key="index" :label="item.name" :value="item.name">{{item.name}}</el-option>
          </el-select>
        </el-form-item>
        <EnvTypeSelect v-model="job.spec.source" isRuntime isOther isService style="display: inline-block;" />
      </el-form-item>
      <el-form-item
        class="long-item"
        label="源镜像仓库"
        v-if="job.spec.source!=='other'"
        :rules="{required: true, message: '请选择镜像仓库', trigger: ['blur', 'change']}"
        prop="spec.source_registry_id"
      >
        <el-select v-model="job.spec.source_registry_id" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        class="long-item"
        label="目标镜像仓库"
        :rules="{required: true, message: '请选择镜像仓库', trigger: ['blur', 'change']}"
        prop="spec.target_registry_id"
      >
        <el-select v-model="job.spec.target_registry_id" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { getRegistryWhenBuildAPI, getAssociatedBuildsAPI } from '@/api'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName } from '../../config'

export default {
  name: 'JobImageDistrubute',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    },
    globalEnv: {
      type: Array,
      default: () => []
    },
    job: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    EnvTypeSelect
  },
  data () {
    return {
      validateJobName,
      formLabelWidth: '90px',
      dockerList: [],
      originServiceAndBuilds: []
    }
  },
  computed: {
    allJobList () {
      const allJobList = this.workflowInfo.stages
        .map(stage => {
          return stage.jobs
        })
        .flat()
      return allJobList.filter(
        job => job.name !== this.job.name && job.type === 'zadig-build'
      )
    }
  },
  created () {
    this.getRegistryWhenBuild()
    this.getServiceAndBuildList()
  },
  methods: {
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    getServiceAndBuildList () {
      const projectName = this.projectName
      getAssociatedBuildsAPI(projectName, true).then(res => {
        res.forEach(item => {
          item.value = `${item.service_name}/${item.service_module}`
        })
        this.originServiceAndBuilds = res
      })
    },
    getData () {
      if (this.job.spec.targets.length > 0) {
        this.job.spec.targets.forEach(item => {
          delete item.module_builds
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
.job-deploy {
  .form-item {
    display: inline-block;
    width: 220px;
  }

  .long-item {
    /deep/ .el-form-item__label {
      line-height: 20px;
    }
  }
}
</style>
