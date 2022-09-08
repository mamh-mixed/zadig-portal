<template>
  <div class="job-canary-deploy">
    <el-form label-width="90px" :model="job" ref="ruleForm" class="mg-t24 mg-b24">
      <el-form-item label="任务名称" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="镜像仓库" prop="spec.docker_registry_id" :rules="{required: true, message: '镜像仓库不能为空', trigger: ['blur','change']}">
        <el-select v-model="job.spec.docker_registry_id" placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="集群" prop="spec.cluster_id" :rules="{ required: true, message: '请选择集群名称', trigger: ['change', 'blur'] }">
        <el-select v-model="job.spec.cluster_id" placeholder="请选择集群名称" size="small" style="width: 220px;" @change="getNamespaceList">
          <el-option v-for="cluster in clusters" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="命名空间" prop="spec.namespace" :rules="{required: true, message: '命名空间不能为空', trigger: ['blur','change']}">
        <el-select v-model="job.spec.namespace" filterable placeholder="请选择" size="small" style="width: 220px;" @change="getWorkloadList">
          <el-option v-for="item in namespaceList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="实例列表">
        <div class="service">
          <el-row class="th">
            <el-col :span="6" class="th-title">K8s service 名称</el-col>
            <el-col :span="6" class="th-title">容器名称</el-col>
            <el-col :span="6" class="th-title">实例数(%)</el-col>
            <el-col :span="6" class="th-title">部署超时时间(分钟)</el-col>
          </el-row>
          <el-row>
            <div v-for="(item,index) in job.spec.targets" :key="index"></div>
          </el-row>
        </div>

        <!-- <el-table size="mini">
          <el-table-column label="K8s service 名称">
            <template >
              <el-select v-model="job.docker_registry_id" placeholder="请选择" size="small" style="width: 220px;">
                <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="容器名称"></el-table-column>
          <el-table-column label="实例数(%)"></el-table-column>
          <el-table-column label="部署超时时间(分钟)"></el-table-column>
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button size="mini" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
              <el-button size="mini" type="danger" @click="handleDelete(scope.$index, scope.row)">Delete</el-button>
            </template>
          </el-table-column>
        </el-table>-->
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
import { validateJobName } from '../config'

export default {
  name: 'JobCanaryDeploy',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    job: {
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
      validateJobName,
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
      return getClusterListAPI(this.projectName).then(res => {
        this.clusters = res.filter(element => element.status === 'normal')
        this.getNamespaceList()
      })
    },
    getNamespaceList () {
      if (this.job.cluster_id) {
        return getNamespaceListAPI(this.job.cluster_id, this.projectName).then(
          res => {
            this.namespaceList = res
            this.getWorkloadList()
          }
        )
      }
    },
    getWorkloadList () {
      if (this.job.cluster_id) {
        return getWorkloadListAPI(
          this.job.cluster_id,
          this.job.namespace,
          this.projectName
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
      this.job.spec.targets = this.job.spec.targets.map(item => {
        const obj = {
          target: item.target || item,
          image: ''
        }
        return obj
      })
      return this.job
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
