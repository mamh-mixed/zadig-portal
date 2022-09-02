<template>
  <div class="build-env">
    <el-form :label-width="formLabelWidth" :model="form" ref="ruleForm">
      <el-form-item label="镜像仓库" prop="docker_registry_id" :rules="{required: true, message: '镜像仓库不能为空', trigger: ['blur','change']}">
        <el-select v-model="form.docker_registry_id" placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="集群" prop="cluster_id" :rules="{ required: true, message: '请选择集群名称', trigger: ['change', 'blur'] }">
        <el-select v-model="form.cluster_id" placeholder="请选择集群名称" size="small" style="width: 220px;" @change="getNamespaceList">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="命名空间" prop="namespace" :rules="{required: true, message: '命名空间不能为空', trigger: ['blur','change']}">
        <el-select v-model="form.namespace" filterable placeholder="请选择" size="small" style="width: 220px;" @change="getWorkloadList">
          <el-option v-for="item in namespaceList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="容器" prop="targets" :rules="{required: true, message: '容器不能为空', trigger: ['blur','change']}">
        <el-select v-model="form.targets" placeholder="请选择" size="small" style="width: 220px;" filterable multiple value-key="target">
          <el-option v-for="item in workloadList" :key="item.target" :label="item.target" :value="item"></el-option>
        </el-select>
        <EnvTypeSelect v-model="form.source" isRuntime isFixed style="display: inline-block;" />
      </el-form-item>
      <el-form-item label="服务状态检测" class="status-check">
        <span slot="label">
          容器状态检测
          <el-tooltip effect="dark" content="开启后，部署任务会轮询容器运行状态，待容器正常运行，任务状态才为成功。" placement="top">
            <i class="el-icon-question" style="cursor: pointer;"></i>
          </el-tooltip>
        </span>
        <el-form-item prop="skip_check_run_status" class="form-item" :rules="{required: false}">
          <el-switch v-model="form.skip_check_run_status" :active-value="false" :inactive-value="true" active-color="#0066ff"></el-switch>
        </el-form-item>
      </el-form-item>
      <el-form-item label="超时时间">
        <el-input-number size="mini" :min="1" v-model="form.timeout"></el-input-number>
        <span>分钟</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {
  getRegistryWhenBuildAPI,
  getClusterListAPI,
  getNamespaceListAPI,
  getWorkloadListAPI
} from '@api'
import EnvTypeSelect from './envTypeSelect.vue'

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
    },
    globalEnv: {
      type: Array,
      default: () => []
    },
    originServiceAndBuilds: {
      type: Array,
      default: () => []
    }
  },
  components: {
    EnvTypeSelect
  },
  data () {
    return {
      formLabelWidth: '90px',
      namespaceList: [],
      workloadList: [],
      dockerList: [],
      clusters: []
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
    this.getClusterList()
    this.getRegistryWhenBuild()
  },
  methods: {
    getRegistryWhenBuild () {
      getRegistryWhenBuildAPI().then(res => {
        this.dockerList = res
      })
    },
    getClusterList () {
      return getClusterListAPI().then(res => {
        this.clusters = res.filter(element => element.status === 'normal')
        this.getNamespaceList()
      })
    },
    getNamespaceList () {
      if (this.form.cluster_id) {
        return getNamespaceListAPI(this.form.cluster_id).then(res => {
          this.namespaceList = res
          this.getWorkloadList()
        })
      }
    },
    getWorkloadList () {
      if (this.form.cluster_id) {
        return getWorkloadListAPI(
          this.form.cluster_id,
          this.form.namespace
        ).then(res => {
          this.workloadList = res.map(item => {
            const obj = {
              target: item,
              image: ''
            }
            return obj
          })
        })
      }
    },
    getData () {
      this.value.spec.targets = this.value.spec.targets.map(item => {
        const obj = {
          target: item.target || item,
          image: ''
        }
        return obj
      })
      return this.value
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  }
}
</script>
<style lang="less" scoped>
.build-env {
  .form-item {
    display: inline-block;
    width: 220px;
  }

  .status-check {
    /deep/ .el-form-item__label {
      line-height: 20px;
    }
  }
}
</style>
