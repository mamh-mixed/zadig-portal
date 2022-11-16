<template>
  <div class="create-product-detail-container" v-loading="projectInitLoading">
    <el-form
      class="common-parcel-block primary-form"
      label-width="120px"
      label-position="left"
      ref="createEnvRef"
      :model="projectConfig"
      :rules="rules"
      inline-message
    >
      <el-form-item label="K8s 集群" prop="cluster_id">
        <el-select
          class="select"
          filterable
          @change="changeCluster"
          v-model="projectConfig.cluster_id"
          size="small"
          placeholder="请选择 K8s 集群"
        >
          <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="K8s 命名空间" prop="namespace">
        <el-select
          v-model="projectConfig.namespace"
          :disabled="editButtonDisabled"
          size="small"
          placeholder="选择或自定义命名空间"
          filterable
          allow-create
          clearable
        >
          <el-option :value="`${projectName}-env-${projectConfig.env_name}`">{{ projectName }}-env-{{ projectConfig.env_name }}</el-option>
          <el-option v-for="(ns,index) in (hostingNamespace[projectConfig.cluster_id] || [])" :key="index" :label="ns" :value="ns"></el-option>
        </el-select>
        <span class="editButton" @click="editButtonDisabled = !editButtonDisabled">
          <i :class="[editButtonDisabled ? 'el-icon-edit-outline': 'el-icon-finished' ]"></i>
        </span>
        <span class="ns-desc" v-show="nsIsExisted">Zadig 中定义的服务将覆盖所选命名空间中的同名服务，请谨慎操作！</span>
      </el-form-item>
      <el-form-item label="镜像仓库">
        <el-select
          class="select"
          filterable
          v-model.trim="projectConfig.registry_id"
          placeholder="请选择镜像仓库"
          size="small"
          @change="getImages"
        >
          <el-option
            v-for="registry in imageRegistry"
            :key="registry.id"
            :label="registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr"
            :value="registry.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="服务选择" prop="selectedService">
        <div class="select-service">
          <el-select v-model="projectConfig.selectedService" size="small" placeholder="选择服务" filterable clearable multiple collapse-tags>
            <el-option
              disabled
              label="全选"
              value="ALL"
              :class="{selected: projectConfig.selectedService.length === serviceNames.length}"
              style="color: #606266;"
            >
              <span
                style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                @click="projectConfig.selectedService = serviceNames"
              >全选</span>
            </el-option>
            <el-option v-for="serviceName in serviceNames" :key="serviceName" :label="serviceName" :value="serviceName"></el-option>
          </el-select>
          <el-button size="mini" plain @click="projectConfig.selectedService = []">清空</el-button>
        </div>
      </el-form-item>
    </el-form>
    <EnvConfig class="common-parcel-block" ref="envConfigRef" :envName="currentEnv" />
    <div v-if="variables.length" class="common-parcel-block box-card-service">
      <div class="primary-title">
        变量列表
        <VariablePreviewEditor :services="previewServices" :projectName="projectConfig.product_name" :variables="variables" />
      </div>
      <VarList :variables="variables" />
    </div>
    <K8sServiceList ref="k8sServiceListRef" :selectedContainerMap="selectedContainerMap" :registryId="projectConfig.registry_id" />
  </div>
</template>

<script>
import EnvConfig from '../../env/env_detail/common/envConfig.vue'
import K8sServiceList from '../../env/k8sPmEnv/k8sServiceList.vue'
import VarList from '../../env/k8sPmEnv/varList.vue'
import {
  productHostingNamespaceAPI,
  initProjectEnvAPI,
  getClusterListAPI,
  createEnvAPI,
  getRegistryWhenBuildAPI
} from '@api'
import { uniq, cloneDeep, intersection, debounce } from 'lodash'

const projectConfig = {
  product_name: '',
  cluster_id: '',
  env_name: '',
  source: 'system',
  namespace: '',
  vars: [],
  revision: null,
  isPublic: true,
  roleIds: [],
  registry_id: '',
  services: [],
  selectedService: [] // will be deleted when created
}
export default {
  props: {
    envInfos: Array,
    currentEnv: String
  },
  data () {
    this.projectConfigInit = cloneDeep(projectConfig)

    return {
      projectInitLoading: true,
      editButtonDisabled: true,
      hostingNamespace: {},
      allCluster: [],
      serviceNames: [],
      rules: {
        cluster_id: [
          { required: true, trigger: 'change', message: '请选择 K8s 集群' }
        ],
        namespace: [
          { required: true, trigger: 'change', message: '命名空间不能为空' }
        ],
        selectedService: {
          type: 'array',
          required: true,
          message: '请选择服务',
          trigger: 'change'
        }
      },
      imageRegistry: [],
      containerNames: [],
      defaultResource: {
        clusterId: '',
        registryId: ''
      }
    }
  },

  computed: {
    projectConfig () {
      const cur = this.envInfos.find(info => info.initName === this.currentEnv)
      if (!cur) {
        return cloneDeep(this.projectConfigInit)
      }
      if (!cur.projectConfig) {
        cur.projectConfig = cloneDeep(this.projectConfigInit)
      }
      return cur.projectConfig
    },
    projectName () {
      return this.$route.params.project_name
    },
    nsIsExisted () {
      if (!this.hostingNamespace[this.projectConfig.cluster_id]) {
        this.$set(this.hostingNamespace, this.projectConfig.cluster_id, [])
      }
      const nsIsExisted = this.hostingNamespace[this.projectConfig.cluster_id].includes(
        this.projectConfig.namespace
      )
      this.projectConfig.is_existed = nsIsExisted
      return nsIsExisted
    },
    previewServices () {
      return this.serviceNames.map(item => {
        return { service_name: item }
      })
    },
    variables () {
      const services = this.projectConfig.selectedService
      const currentVars = this.projectConfig.vars.filter(
        item => intersection(item.services, services).length
      )
      currentVars.forEach(item => {
        item.allServices = item.services
        item.services = intersection(item.services, services)
      })
      this.projectConfig.curVars = currentVars
      return currentVars
    },
    selectedContainerMap () {
      // Filtered Container Services
      const containerMap = {}
      const svcMap = this.projectConfig.servicesMap
      this.projectConfig.selectedService.forEach(service => {
        containerMap[service] = svcMap[service]
      })
      return containerMap
    }
  },
  methods: {
    changeEnvName (value) {
      if (!this.nsIsExisted) {
        this.projectConfig.namespace = this.projectName + '-env-' + value
      }
      this.projectConfig.env_name = value
      this.checkSvcResource({ env_name: value, namespace: this.projectConfig.namespace })
    },
    async initProjectInfo () {
      this.projectInitLoading = true

      await Promise.all([
        // init cluster
        getClusterListAPI(this.projectName).then(res => {
          this.allCluster = res.filter(element => {
            if (element.local) {
              this.defaultResource.clusterId = element.id
              this.projectConfigInit.cluster_id = element.id
              this.changeCluster(element.id)
            }
            return element.status === 'normal'
          })
        }),
        // init registry
        getRegistryWhenBuildAPI(this.projectName).then(res => {
          this.imageRegistry = res
          const defaultRegistry = res.find(reg => reg.is_default)
          this.defaultResource.registryId = defaultRegistry
            ? defaultRegistry.id
            : ''
          this.projectConfigInit.registry_id = this.defaultResource.registryId
        }),
        // init project information
        this.getTemplateAndImg()
      ])

      // init service image info
      await this.getImages(
        this.projectConfigInit.registry_id,
        this.projectConfigInit.services
      )

      this.envInfos.forEach(info => {
        info.projectConfig = {
          ...cloneDeep(this.projectConfigInit),
          env_name: info.envName,
          namespace: this.projectName + '-env-' + info.envName
        }
      })

      this.projectInitLoading = false
    },
    async getTemplateAndImg () {
      // init all project information
      const projectName = this.projectName
      const template = await initProjectEnvAPI(projectName)
      this.projectConfigInit.product_name = projectName
      this.projectConfigInit.revision = template.revision
      this.projectConfigInit.vars = template.vars || []
      this.projectConfigInit.curVars = template.vars || []
      this.projectConfigInit.source = 'system'

      const servicesMap = {}
      const containerNames = []
      for (const group of template.services) {
        group.sort((a, b) => {
          if (a.service_name !== b.service_name) {
            return a.service_name.charCodeAt(0) - b.service_name.charCodeAt(0)
          }
          if (a.type === 'k8s' || b.type === 'k8s') {
            return a.type === 'k8s' ? 1 : -1
          }
          return 0
        })
        for (const ser of group) {
          if (ser.type === 'k8s') {
            servicesMap[ser.service_name] = ser
            ser.picked = true
            ser.deploy_strategy = 'deploy'
            const containers = ser.containers
            if (containers) {
              for (const con of containers) {
                con.defaultImage = con.image // not use
                containerNames.push(con.image_name)
              }
            }
          }
        }
      }
      this.projectConfigInit.services = template.services
      this.projectConfigInit.servicesMap = servicesMap
      this.serviceNames = Object.keys(servicesMap)
      this.containerNames = uniq(containerNames)
      this.projectConfigInit.selectedService = Object.keys(servicesMap)
    },
    async getImages (
      registry_id = this.projectConfig.registry_id,
      services = this.projectConfig.services
    ) {
      // init current project information: services by registry_id
      // When the current project switches mirroring, switching projects(Can you save an imageMap of the current project)
      await this.$refs.k8sServiceListRef.getImages(
        this.containerNames,
        registry_id || '',
        true,
        services
      )
    },
    changeCluster (clusterId) {
      if (this.hostingNamespace[clusterId]) {
        return
      }
      productHostingNamespaceAPI(clusterId, 'create').then(res => {
        this.$set(
          this.hostingNamespace,
          clusterId,
          res.map(ns => ns.name)
        )
      })
    },
    deployK8sEnv () {
      return this.$refs.createEnvRef.validate().then(() => {
        const envConfigs = this.$refs.envConfigRef.getEnvConfig()
        const payload = []
        this.envInfos.forEach(envInfo => {
          const projectConfig = envInfo.projectConfig
          // for each projectConfig
          const selectedServices = [] // filtered service: keep the same format as the original services
          const selectedServiceNames = projectConfig.selectedService
          for (const group of projectConfig.services) {
            const currentGroup = []
            for (const ser of group) {
              const containers = ser.containers
              if (containers && ser.picked && ser.type === 'k8s') {
                if (selectedServiceNames.includes(ser.service_name)) {
                  currentGroup.push(ser)
                }
                for (const con of ser.containers) {
                  if (!con.image) {
                    this.$message.warning(`${con.name}未选择镜像`)
                    return
                  }
                }
              }
            }
            selectedServices.push(currentGroup)
          }
          const curPayload = cloneDeep(projectConfig)
          curPayload.services = selectedServices

          curPayload.vars = curPayload.curVars.map(vars => {
            delete vars.allServices
            return vars
          })
          curPayload.source = 'spock'
          curPayload.env_configs = envConfigs[envInfo.initName] || []

          delete curPayload.selectedService
          delete curPayload.curVars
          delete curPayload.servicesMap

          payload.push(curPayload)
        })

        return payload
      }).catch(() => {
        console.log('not-valid')
      })
    },
    checkSvcResource: debounce(function ({
      env_name = this.projectConfig.env_name,
      namespace = this.projectConfig.namespace,
      cluster_id = this.projectConfig.cluster_id,
      vars = this.projectConfig.vars
    }) {
      const payload = {
        env_name,
        namespace,
        cluster_id,
        vars: vars.map(va => ({ alias: va.alias, key: va.key, value: va.value }))
      }
      if (this.$refs.k8sServiceListRef && env_name && namespace && cluster_id && vars.length) {
        this.$refs.k8sServiceListRef
          .checkSvcResource(this.projectName, payload)
          .then(res => {
            this.serviceNames.forEach(name => {
              this.projectConfig.servicesMap[name].deploy_strategy = res[name]
                ? 'import'
                : 'deploy'
            })
          })
      }
    }, 300)
  },
  watch: {
    'projectConfig.namespace' (val) {
      this.checkSvcResource({ namespace: val })
    },
    'projectConfig.cluster_id' (val) {
      this.checkSvcResource({ cluster_id: val })
    },
    variables: {
      handler (val) {
        this.checkSvcResource({ vars: val })
      },
      deep: true
    }
  },
  created () {
    this.initProjectInfo()
  },
  components: {
    VarList,
    EnvConfig,
    K8sServiceList
  }
}
</script>

<style lang="less" scoped>
.create-product-detail-container {
  position: relative;
  flex: 1;
  box-sizing: border-box;
  height: 100%;
  padding: 16px 24px;
  overflow: auto;

  .ns-desc {
    display: inline-block;
    margin-left: 8px;
    color: #e6a23c;
    font-size: 13px;
  }

  .editButton {
    display: inline-block;
    margin-left: 6px;
    padding: 0 6px;
    font-size: 14px;
    line-height: 24px;
    border: 1px solid rgba(118, 122, 200, 0.5);
    border-radius: 4px;
    cursor: pointer;
  }

  .no-resources {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }

  .select-service {
    position: relative;
    display: inline-block;
    width: 410px;

    /deep/.el-button {
      position: absolute;
      right: 12px;
      bottom: 6px;
    }
  }
}
</style>
