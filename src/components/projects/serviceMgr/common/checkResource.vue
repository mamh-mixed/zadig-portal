
<template>
  <el-table :data="currentResource" style="width: 100%;">
    <el-table-column prop="service_name" :label="$t(`global.serviceName`)"></el-table-column>
    <el-table-column>
      <span slot="header">
        {{$t('environments.k8s.serviceListComp.resourceDetection')}}
        <el-tooltip effect="dark" :content="$t('environments.k8s.serviceListComp.resourceDetectionTip')" placement="top">
          <i class="el-icon-info gray"></i>
        </el-tooltip>
      </span>
      <template slot-scope="{ row }">
        <div class="resource-item" v-for="(resource, index) in row.resources" :key="index">
          <i class="middle" :class="[resource.status === 'deployed' ? 'el-icon-success success' : 'el-icon-error fail']"></i>
          <span>{{ `${resource.type}/${resource.name}` }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column :label="$t(`global.operation`)" width="200px">
      <template slot-scope="{ row }">
        <el-radio-group v-model="row.deploy_strategy">
          <el-radio label="import" :disabled="!row.deployed">{{$t('environments.k8s.serviceListComp.onlyImport')}}</el-radio>
          <el-radio label="deploy">{{$t('environments.k8s.serviceListComp.executeDeploy')}}</el-radio>
        </el-radio-group>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import { checkK8sSvcResourceAPI } from '@api'
import { mapState } from 'vuex'
import { debounce } from 'lodash'
export default {
  props: {
    checkResource: Object,
    currentResourceCheck: Array,
    serviceNames: Array
  },
  data () {
    return {
      svcResources: {}
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    }),
    currentResource () {
      if (this.currentResourceCheck) {
        return this.currentResourceCheck
      } else {
        for (const i in this.serviceNames) {
          const svc = this.serviceNames[i]
          this.$set(this.serviceNames, i, { ...svc, ...this.svcResources[svc.service_name] })
        }
        return this.serviceNames
      }
    }
  },
  watch: {
    checkResource: {
      handler (val) {
        if (
          this.hasPlutus &&
          val &&
          val.env_name &&
          val.namespace &&
          val.cluster_id
        ) {
          //  env_name,
          //  namespace,
          //  cluster_id,
          //  services,
          //  vars({
          //   alias: va.alias,
          //   key: va.key,
          //   value: va.value
          //  })
          this.checkSvcResource(val)
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    checkSvcResource: debounce(async function (payload) {
      this.svcResources = {}
      const res = await checkK8sSvcResourceAPI(
        this.projectName,
        payload
      ).catch(err => console.log(err))
      if (res) {
        const svcResources = {}
        res.forEach(resource => {
          const deployed = !resource.resources.find(
            re => re.status === 'undeployed'
          )
          svcResources[resource.service_name] = {
            ...resource,
            deployed,
            deploy_strategy: deployed ? 'import' : 'deploy'
          }
        })
        this.svcResources = svcResources
        this.$emit('checkRes', svcResources)
      }
    }, 300)
  }
}
</script>

<style lang="less" scoped>
.gray {
  color: @info;
}

.success {
  color: @success;
}

.fail {
  color: @danger;
}
</style>
