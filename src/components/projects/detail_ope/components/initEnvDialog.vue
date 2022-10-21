<template>
  <el-dialog :title="`设置 ${currentEnv} 环境变量`" :visible.sync="dialogVisible" width="850px">
    <div>
      <VarList :variables="variables" v-if="deployType === 'k8s'" class="var-list-container"></VarList>
      <HelmEnvTemplate
        v-else-if="deployType === 'helm'"
        class="chart-value"
        ref="helmEnvTemplateRef"
        :envScene="`updateRenderSet`"
        :chartNames="chartNames"
        :currentEnvObj="currentEnvObj"
        :baseEnvObj="baseEnvObj"
      ></HelmEnvTemplate>
    </div>
    <div slot="footer">
      <el-button size="small" type="primary" @click="getEnvInfo">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import VarList from '@/components/projects/env/k8sPmEnv/varList.vue'
import HelmEnvTemplate from '@/components/projects/env/env_detail/components/updateHelmEnvTemp.vue'
import { cloneDeep } from 'lodash'

export default {
  props: {
    visible: Boolean,
    currentEnv: String,
    currentInfo: Object,
    baseEnvObj: Object
  },
  data () {
    return {
      variables: [],
      chartNames: [],
      currentEnvObj: undefined
    }
  },
  computed: {
    dialogVisible: {
      get () {
        return this.visible
      },
      set () {
        this.$emit('resetVisible', false)
      }
    },
    deployType () {
      const projectName = this.$route.params.project_name
      const project = this.$store.getters.projectList.find(
        project => project.name === projectName
      )
      return project ? project.deployType : 'k8s'
    }
  },
  watch: {
    currentEnv: async function (nVal, oVal) {
      if (!nVal) {
        this.variables = []
        this.chartNames = []
        this.currentEnvObj = undefined
        return
      }
      if (this.deployType === 'k8s') {
        this.variables = cloneDeep(this.currentInfo.vars)
      } else {
        // for service charts
        this.chartNames = cloneDeep(this.currentInfo.chartValues || [])
        // for environment
        const valuesData = this.currentInfo.valuesData
        const currentEnvObj = { yamlSource: 'customEdit', envValue: this.currentInfo.defaultValues, gitRepoConfig: null, variableSet: null }
        if (valuesData) {
          currentEnvObj.yamlSource = valuesData.yamlSource
          if (valuesData.yamlSource === 'repo') {
            currentEnvObj.gitRepoConfig = valuesData.gitRepoConfig
          } else if (valuesData.yamlSource === 'variableSet') {
            currentEnvObj.variableSet = {
              autoSync: valuesData.autoSync,
              source_id: valuesData.source_id
            }
          }
        }
        this.currentEnvObj = currentEnvObj
      }
    }
  },
  methods: {
    getEnvInfo () {
      if (this.deployType === 'k8s') {
        this.currentInfo.vars = cloneDeep(this.variables)
      } else {
        const {
          envInfo,
          chartInfo
        } = this.$refs.helmEnvTemplateRef.getAllInfo()
        const defaultEnv = envInfo.DEFAULT
        this.currentInfo.defaultValues = defaultEnv.envValue || ''
        this.currentInfo.valuesData = defaultEnv.valuesData || null
        this.currentInfo.chartValues = chartInfo
      }
      this.dialogVisible = false
    }
  },
  components: {
    VarList,
    HelmEnvTemplate
  }
}
</script>

<style lang="less" scoped>
/deep/.el-dialog {
  .el-dialog__header {
    text-align: center;
  }

  .el-dialog__body {
    padding: 12px 20px;

    .var-list-container {
      .el-table {
        margin: auto;
      }
    }
  }
}

.chart-value {
  width: 100%;
  min-width: 450px;
  margin-left: 5px;
}
</style>
