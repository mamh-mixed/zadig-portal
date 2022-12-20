<template>
  <div v-if="currentInfo" class="k8s-env-temp-container">
    <div class="global-variable">
      <span>全局变量</span>
      <Resize class="desc mirror" @sizeChange="$refs.codemirror.refresh()" :height="'200px'">
        <CodeMirror ref="codemirror" v-model="currentInfo.default_variable" />
      </Resize>
    </div>
    <el-table :data="currentInfo.variables || []" style="width: 100%;" default-expand-all>
      <el-table-column prop="service_name" :label="$t(`global.serviceName`)"></el-table-column>
      <el-table-column type="expand" width="100px" label="变量配置">
        <template slot-scope="{ row }">
          <div v-if="row.canEditYaml">
            <div class="primary-title">变量配置</div>
            <Resize @sizeChange="$refs[`codemirror-${row.service_name}`].refresh()" :height="'150px'">
              <CodeMirror :ref="`codemirror-${row.service_name}`" v-model="row.variable_yaml" />
            </Resize>
          </div>
          <div v-else style="font-size: 12px; text-align: center;">无变量配置</div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import CodeMirror from '@/components/projects/common/codemirror.vue'
import { getEnvDefaultVariableAPI, getServiceDefaultVariableAPI } from '@api'
export default {
  props: {
    currentInfo: Object
  },
  data () {
    return {}
  },
  methods: {
    getEnvInfo () {
      const envName = this.currentInfo.base_name
      const projectName = this.$route.params.project_name
      getEnvDefaultVariableAPI(projectName, envName).then(res => {
        this.$set(this.currentInfo, 'default_variable', res.default_variable)
      })
      getServiceDefaultVariableAPI(projectName, envName).then(res => {
        this.$set(
          this.currentInfo,
          'variables',
          res.map(re => ({ ...re, canEditYaml: !!re.variable_yaml }))
        )
      })
    }
  },
  watch: {
    currentInfo: {
      handler (val) {
        if (val && typeof val.default_variable === 'undefined') {
          this.getEnvInfo()
        }
      },
      immediate: true
    }
  },
  components: {
    Resize,
    CodeMirror
  }
}
</script>

<style lang="less" scoped>
.k8s-env-temp-container {
  .global-variable {
    margin-bottom: 10px;
  }
}
</style>
