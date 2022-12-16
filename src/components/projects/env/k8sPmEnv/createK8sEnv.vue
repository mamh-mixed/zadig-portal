<template>
  <div class="create-product-detail-container" v-loading="loading" element-loading-text="正在加载中" element-loading-spinner="el-icon-loading">
    <div v-if="$utils.isEmpty(this.containerMap) && !loading" class="no-resources">
      <img src="@assets/icons/illustration/environment.svg" alt />
      <div class="description">
        <p>
          <span>{{$t('environments.k8s.environmentWithoutService')}}</span>
          <router-link :to="`/v1/projects/detail/${projectName}/services`">
            <el-button type="primary" size="mini" round plain>{{$t('project.services')}}</el-button>
          </router-link>
          <span>{{$t('environments.k8s.toCreateService')}}</span>
        </p>
      </div>
    </div>
    <div v-else>
      <el-form
        class="common-parcel-block primary-form"
        label-width="120px"
        label-position="left"
        ref="createEnvRef"
        :model="projectConfig"
        :rules="rules"
        inline-message
      >
        <el-form-item :label="$t('environments.k8s.envName')" prop="env_name">
          <el-input @input="changeEnvName" v-model="projectConfig.env_name" size="small"></el-input>
        </el-form-item>
        <el-form-item :label="$t('environments.k8s.creationMethod')" prop="source" v-if="!createShare">
          <el-select class="select" @change="changeCreateMethod" v-model="projectConfig.source" size="small" :placeholder="$t('environments.k8s.selectCreationMethod')">
            <el-option :label="$t('environments.k8s.createNewEnv')" value="system"></el-option>
            <el-option :label="$t('environments.k8s.copyEnv')" value="copy"></el-option>
            <el-option v-if="currentProductDeliveryVersions.length > 0"  :label="$t('environments.k8s.envRollback')" value="versionBack"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="projectConfig.source==='copy'" :label="$t('environments.k8s.copyFrom')" prop="base_env_name">
          <el-select @change="changeSourceEnv" :placeholder="$t('environments.k8s.selectSourceEnv')" size="small" v-model="projectConfig.base_env_name" value-key="version">
            <el-option v-for="(item,index) in envNameList" :key="index" :label="item.name" :value="item.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="projectConfig.source==='versionBack'" :label="$t('environments.k8s.rollbackVersion')">
          <el-select @change="changeSelectValue" :placeholder="$t('environments.k8s.selectVersion')" size="small" v-model="selection" value-key="version">
            <el-option
              v-for="(item,index) in currentProductDeliveryVersions"
              :key="index"
              :disabled="!item.versionInfo.productEnvInfo"
              :label="$t('environments.k8s.versionLabel',{version: item.versionInfo.version, time: $utils.convertTimestamp(item.versionInfo.created_at), createBy: item.versionInfo.createdBy})"
              :value="item.versionInfo"
            ></el-option>
          </el-select>
        </el-form-item>
        <div class="primary-title">{{$t('environments.k8s.selectResources')}}</div>
        <el-form-item :label="$t('environments.k8s.k8sCluster')" prop="cluster_id" class="secondary-label">
          <el-select
            class="select"
            filterable
            @change="changeCluster"
            v-model="projectConfig.cluster_id"
            size="small"
            :disabled="createShare"
            :placeholder="$t('environments.k8s.selectK8sCluster')"
          >
            <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          :label="$t('environments.k8s.k8sNamespace')"
          v-if="projectConfig.source==='system'||projectConfig.source==='copy'"
          prop="defaultNamespace"
          class="secondary-label"
        >
          <el-select
            v-model="projectConfig.defaultNamespace"
            :disabled="editButtonDisabled"
            size="small"
            :placeholder="$t('environments.k8s.selectK8sNamespace')"
            filterable
            allow-create
            clearable
          >
            <el-option :value="`${projectName}-env-${projectConfig.env_name}`">{{ projectName }}-env-{{ projectConfig.env_name }}</el-option>
            <el-option v-for="(ns,index) in hostingNamespace" :key="index" :label="ns" :value="ns"></el-option>
          </el-select>
          <span class="editButton" @click="editButtonDisabled = !editButtonDisabled">
            <i :class="[editButtonDisabled ? 'el-icon-edit-outline': 'el-icon-finished' ]"></i>
          </span>
          <span class="ns-desc" v-show="nsIsExisted">{{$t('environments.k8s.namespaceAlreadyExistsTip')}}</span>
        </el-form-item>
        <el-form-item :label="$t(`status.imageRepo`)" class="secondary-label">
          <el-select class="select" filterable v-model.trim="projectConfig.registry_id" :placeholder="$t('environments.k8s.selectImageRepository')" size="small" @change="getImages">
            <el-option
              v-for="registry in imageRegistry"
              :key="registry.id"
              :label="registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr"
              :value="registry.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('environments.k8s.services')" v-if="projectConfig.source==='system'||projectConfig.source==='copy'" prop="selectedService">
          <div class="select-service">
            <el-select v-model="projectConfig.selectedService" size="small" :placeholder="$t('environments.k8s.selectServices')" filterable clearable multiple collapse-tags>
              <el-option
                disabled
                :label="$t('environments.k8s.checkAllServices')"
                value="ALL"
                :class="{selected: projectConfig.selectedService.length === serviceNames.length}"
                style="color: #606266;"
              >
                <span
                  style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                  @click="projectConfig.selectedService = serviceNames"
                >{{$t('environments.k8s.checkAllServices')}}</span>
              </el-option>
              <el-option v-for="serviceName in serviceNames" :key="serviceName" :label="serviceName" :value="serviceName"></el-option>
            </el-select>
            <el-button size="mini" plain @click="projectConfig.selectedService = []">{{$t('environments.k8s.clearServices')}}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <EnvConfig class="common-parcel-block" ref="envConfigRef" />
      <div
        v-if="(variables.length && !$utils.isEmpty(containerMap) && (projectConfig.source==='system')||projectConfig.source==='copy')"
        class="common-parcel-block box-card-service"
      >
        <div class="primary-title">
          {{$t('environments.k8s.variablesList')}}
          <VariablePreviewEditor :services="previewServices" :projectName="projectConfig.product_name" :variables="variables" />
        </div>
        <VarList :variables="variables" :rollbackMode="rollbackMode" />
      </div>
      <K8sServiceList
        v-if="projectConfig.source==='system'||projectConfig.source==='copy'"
        ref="k8sServiceListRef"
        :showFilter="showFilter"
        :cantOperate="rollbackMode"
        :selectedContainerMap="selectedContainerMap"
        :registryId="projectConfig.registry_id"
      />
      <el-form label-width="35%" class="ops">
        <el-form-item>
          <el-button @click="$router.back()" :loading="startDeployLoading" size="medium">{{$t(`global.cancel`)}}</el-button>
          <el-button  v-hasPermi="{projectName: projectName, action: 'create_environment',isBtn:true}" @click="deployK8sEnv" :loading="startDeployLoading" type="primary" size="medium">{{$t('environments.k8s.createEnv')}}</el-button>
        </el-form-item>
      </el-form>
      <footer v-if="startDeployLoading" class="create-footer">
        <div class="description">
          <el-tag type="primary">{{$t('environments.k8s.envIsCreating')}}</el-tag>
        </div>
        <div class="deploy-loading">
          <div class="spinner__item1"></div>
          <div class="spinner__item2"></div>
          <div class="spinner__item3"></div>
          <div class="spinner__item4"></div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import EnvConfig from '../env_detail/common/envConfig.vue'
import K8sServiceList from './k8sServiceList.vue'
import VarList from './varList.vue'
import {
  productHostingNamespaceAPI,
  initProjectEnvAPI,
  getVersionListAPI,
  listProductAPI,
  getEnvInfoAPI,
  envRevisionsAPI,
  getClusterListAPI,
  createEnvAPI,
  getRegistryWhenBuildAPI
} from '@api'
import bus from '@utils/eventBus'
import { uniq, cloneDeep, intersection, flattenDeep, debounce } from 'lodash'
import { serviceTypeMap } from '@utils/wordTranslate'

const projectConfig = {
  product_name: '',
  cluster_id: '',
  env_name: '',
  source: 'system',
  namespace: '',
  defaultNamespace: '',
  vars: [],
  revision: null,
  isPublic: true,
  roleIds: [],
  registry_id: '',
  services: [],
  selectedService: [] // will be deleted when created
}
export default {
  data () {
    return {
      selection: '',
      editButtonDisabled: true,
      currentProductDeliveryVersions: [],
      projectConfig: cloneDeep(projectConfig),
      hostingNamespace: [],
      allCluster: [],
      startDeployLoading: false,
      loading: false,
      containerMap: {},
      serviceTypeMap,
      imageRegistry: [],
      containerNames: [],
      envNameList: [],
      defaultResource: {
        clusterId: '',
        registryId: ''
      }
    }
  },

  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    rollbackMode () {
      return this.projectConfig.source === 'versionBack'
    },
    nsIsExisted () {
      return this.hostingNamespace.includes(this.projectConfig.defaultNamespace)
    },
    serviceNames () {
      return Object.keys(this.containerMap)
    },
    previewServices () {
      return this.serviceNames.map(item => {
        return { service_name: item }
      })
    },
    variables () {
      if (this.projectConfig.source === 'system') {
        const services = this.projectConfig.selectedService
        const currentVars = this.projectConfig.vars.filter(
          item => intersection(item.services, services).length
        )
        currentVars.forEach(item => {
          item.allServices = item.services
          item.services = intersection(item.services, services)
        })
        return currentVars
      } else {
        return this.projectConfig.vars
      }
    },
    selectedContainerMap () {
      // Filtered Container Services
      const containerMap = {}
      this.projectConfig.selectedService.forEach(service => {
        containerMap[service] = this.containerMap[service]
      })
      return containerMap
    },
    createShare () {
      return this.$route.query.createShare === 'true'
    },
    clusterId () {
      return this.$route.query.clusterId
    },
    baseEnvName () {
      return this.$route.query.baseEnvName ? this.$route.query.baseEnvName : ''
    },
    createEnvType () {
      return this.createShare ? 'share' : 'general'
    },
    isBaseEnv () {
      return !this.baseEnvName
    },
    showFilter () {
      return this.projectConfig.source === 'system'
    },
    rules () {
      const validateEnvName = (rule, value, callback) => {
        if (typeof value === 'undefined' || value === '') {
          callback(new Error(this.$t('environments.k8s.inputEnvName')))
        } else {
          if (!/^[a-z0-9-]+$/.test(value)) {
            callback(new Error(this.$t('environments.k8s.checkEnvName')))
          } else {
            callback()
          }
        }
      }
      return {
        cluster_id: [
          { required: true, trigger: 'change', message: this.$t('environments.k8s.selectK8sCluster') }
        ],
        source: [
          { required: true, trigger: 'change', message: this.$t('environments.k8s.selectCreationMethod') }
        ],
        defaultNamespace: [
          { required: true, trigger: 'change', message: this.$t('environments.k8s.selectK8sNamespace') }
        ],
        env_name: [
          { required: true, trigger: 'change', validator: validateEnvName }
        ],
        base_env_name: [
          { required: true, trigger: 'change', message: this.$t('environments.k8s.selectSourceEnv') }
        ],
        selectedService: {
          type: 'array',
          required: true,
          message: this.$t('environments.k8s.selectServices'),
          trigger: 'change'
        }
      }
    }
  },
  methods: {
    changeEnvName (value) {
      if (
        (this.projectConfig.source === 'system' ||
          this.projectConfig.source === 'copy') &&
        !this.nsIsExisted
      ) {
        this.projectConfig.defaultNamespace = this.projectName + '-env-' + value
      }
      this.checkSvcResource({ env_name: value, namespace: this.projectConfig.defaultNamespace })
    },
    async getCluster () {
      const projectName = this.projectName
      const res = await getClusterListAPI(projectName)
      res.forEach(element => {
        if (element.local) {
          this.defaultResource.clusterId = element.id
        }
      })
      const cluster_id = this.projectConfig.cluster_id
      if (!this.rollbackMode) {
        this.allCluster = res.filter(element => {
          return element.status === 'normal'
        })
        if (this.createShare && this.clusterId) {
          this.projectConfig.cluster_id = this.clusterId
        } else if (!cluster_id) {
          this.projectConfig.cluster_id = this.defaultResource.clusterId
        }
      } else if (this.rollbackMode) {
        this.allCluster = res.filter(element => {
          return element.status === 'normal' && !element.production
        })
        if (!cluster_id) {
          this.projectConfig.cluster_id = this.defaultResource.clusterId
        }
      }
      if (this.projectConfig.cluster_id) {
        this.changeCluster(this.projectConfig.cluster_id)
      }
    },
    changeSelectValue (versionInfo) {
      const template = versionInfo.productEnvInfo
      const source = this.projectConfig.source
      const env_name = this.projectConfig.env_name
      this.projectConfig = {
        ...cloneDeep(projectConfig),
        ...cloneDeep(template)
      }

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
      }
      const map = {}
      for (const group of template.services) {
        for (const ser of group) {
          map[ser.service_name] = ser
          if (ser.type === 'k8s') {
            this.hasK8s = true
          }
          ser.picked = true
          ser.deploy_strategy = 'deploy'
          const containers = ser.containers
          if (containers) {
            for (const con of containers) {
              Object.defineProperty(con, 'defaultImage', {
                value: con.image,
                enumerable: false,
                writable: false
              })
            }
          }
        }
      }
      if (template.source === '' || template.source === 'spock') {
        this.projectConfig.source = 'system'
      }
      if (source === 'versionBack') {
        this.projectConfig.source = 'versionBack'
      }
      this.projectConfig.env_name = env_name
      this.projectConfig.cluster_id = this.defaultResource.clusterId
      this.projectConfig.registry_id = this.defaultResource.registryId
      this.containerMap = map
    },
    getVersionList () {
      const projectName = this.projectName
      getVersionListAPI('', projectName).then(res => {
        this.currentProductDeliveryVersions = res
      })
    },
    getEnvNameList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        if (res.length) {
          this.envNameList = res.map(env => {
            return {
              name: env.name
            }
          })
        }
      })
    },
    async changeSourceEnv (envName) {
      const projectName = this.projectName
      const envInfo = await getEnvInfoAPI(projectName, envName)
      const envRevision = await envRevisionsAPI(projectName, envName)
      const vars = envInfo.vars
      const availableServices = flattenDeep(envInfo.services)
      const serviceImages = envRevision[0].services.filter(item => {
        return availableServices.indexOf(item.service_name) >= 0
      })
      const clusterId = envInfo.cluster_id
      for (
        let groupIndex = 0;
        groupIndex < envInfo.services.length;
        groupIndex++
      ) {
        const group = envInfo.services[groupIndex]
        for (
          let serviceIndex = 0;
          serviceIndex < group.length;
          serviceIndex++
        ) {
          const service = group[serviceIndex]
          const currnt = serviceImages.find(elemnet => {
            return elemnet.service_name === service
          })
          group[serviceIndex] = currnt
        }
      }
      for (const group of envInfo.services) {
        group.sort((a, b) => {
          if (a.service_name !== b.service_name) {
            return a.service_name.charCodeAt(0) - b.service_name.charCodeAt(0)
          }
          if (a.type === 'k8s' || b.type === 'k8s') {
            return a.type === 'k8s' ? 1 : -1
          }
          return 0
        })
      }

      const containerMap = {}
      const containerNames = []
      for (const group of envInfo.services) {
        for (const ser of group) {
          if (ser.type === 'k8s') {
            containerMap[ser.service_name] = ser
            ser.picked = true
            ser.deploy_strategy = 'deploy'
            const containers = ser.containers
            if (containers) {
              for (const con of containers) {
                containerNames.push(con.image_name)
                Object.defineProperty(con, 'defaultImage', {
                  value: con.image,
                  enumerable: false,
                  writable: false
                })
              }
            }
          }
        }
      }
      this.containerMap = containerMap
      this.projectConfig.services = envInfo.services
      this.containerNames = uniq(containerNames)
      this.getImages()
      this.$set(
        this.projectConfig,
        'selectedService',
        Object.keys(containerMap)
      )
      this.projectConfig.cluster_id = clusterId
      this.projectConfig.vars = vars
      this.projectConfig.registry_id = envInfo.registry_id
    },
    async getTemplateAndImg () {
      const projectName = this.projectName
      const isStcov = this.isStcov
      const createEnvType = this.createEnvType
      const isBaseEnv = this.isBaseEnv
      const baseEnvName = this.baseEnvName
      this.loading = true
      const template = await initProjectEnvAPI(
        projectName,
        isStcov,
        createEnvType,
        isBaseEnv,
        baseEnvName
      )
      this.loading = false
      this.projectConfig.revision = template.revision
      this.projectConfig.vars = template.vars || []
      if (template.source === '' || template.source === 'spock') {
        this.projectConfig.source = 'system'
      }
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
      }

      const containerMap = {}
      const containerNames = []
      for (const group of template.services) {
        for (const ser of group) {
          if (ser.type === 'k8s') {
            containerMap[ser.service_name] = ser
            ser.picked = true
            ser.deploy_strategy = 'deploy'
            const containers = ser.containers
            if (containers) {
              for (const con of containers) {
                containerNames.push(con.image_name)
                Object.defineProperty(con, 'defaultImage', {
                  value: con.image,
                  enumerable: false,
                  writable: false
                })
              }
            }
          }
        }
      }
      this.projectConfig.services = template.services
      this.containerMap = containerMap
      this.containerNames = uniq(containerNames)
      if (this.createShare) {
        this.projectConfig.selectedService = []
      } else {
        this.projectConfig.selectedService = Object.keys(containerMap)
      }
      this.getImages()
    },
    getImages () {
      this.$refs.k8sServiceListRef.getImages(
        this.containerNames,
        this.projectConfig.registry_id || '',
        !this.rollbackMode && this.projectConfig.source !== 'copy',
        this.projectConfig.services
      )
    },
    changeCluster (clusterId) {
      productHostingNamespaceAPI(clusterId, 'create').then(res => {
        this.hostingNamespace = res.map(ns => ns.name)
      })
    },
    changeCreateMethod (val) {
      if (this.selection) {
        this.getTemplateAndImg()
      }
      if (val === 'system') {
        this.projectConfig.base_env_name = ''
        this.getTemplateAndImg()
      }
      this.selection = ''
    },
    deployK8sEnv () {
      this.$refs.createEnvRef.validate(valid => {
        if (valid) {
          const selectedServices = [] // filtered service: keep the same format as the original services
          const selectedServiceNames = this.projectConfig.selectedService
          for (const group of this.projectConfig.services) {
            const currentGroup = []
            for (const ser of group) {
              const containers = ser.containers
              if (containers && ser.picked && ser.type === 'k8s') {
                if (selectedServiceNames.includes(ser.service_name)) {
                  if (this.projectConfig.source === 'copy') {
                    ser.containers = this.containerMap[ser.service_name].containers
                  }
                  currentGroup.push(ser)
                }
                for (const con of ser.containers) {
                  if (!con.image) {
                    this.$message.warning(this.$t('environments.k8s.servicewithoutImage', { serviceName: con.name }))
                    return
                  }
                }
              }
            }
            selectedServices.push(currentGroup)
          }

          const payload = this.$utils.cloneObj(this.projectConfig)
          if (this.projectConfig.source !== 'versionBack') {
            payload.services = cloneDeep(selectedServices) // full service to partial service
          }

          this.variables.forEach(item => {
            item.services = item.allServices
            delete item.allServices
          })
          payload.vars = this.variables // variables referenced by the selected service
          delete payload.selectedService // unwanted data: selected service name

          payload.source = 'spock'

          payload.namespace = payload.defaultNamespace
          payload.is_existed = this.nsIsExisted

          payload.env_configs = this.$refs.envConfigRef.getEnvConfig().default

          if (this.createShare && this.baseEnvName) {
            payload.share_env = {
              enable: true,
              isBase: false,
              base_env: this.baseEnvName
            }
          }
          this.startDeployLoading = true
          function sleep (time) {
            return new Promise(resolve => setTimeout(resolve, time))
          }
          this.$store.commit('SET_MASK_STATUS', true)
          createEnvAPI(
            this.projectName,
            [payload],
            this.projectConfig.source === 'copy' ? 'copy' : '',
            'k8s'
          ).then(
            res => {
              // Add delay to solve the back-end permission synchronization problem
              sleep(5000).then(() => {
                const envName = payload.env_name
                this.startDeployLoading = false
                this.$message({
                  message: this.$t('environments.k8s.environmentHasBeenSuccessfullyCreated'),
                  type: 'success'
                })
                this.$router.push(
                  `/v1/projects/detail/${this.projectName}/envs/detail?envName=${envName}`
                )
              })
            },
            () => {
              this.startDeployLoading = false
              this.$store.commit('SET_MASK_STATUS', false)
            }
          )
        } else {
          console.log('not-valid')
        }
      })
    },
    checkSvcResource: debounce(function ({
      env_name = this.projectConfig.env_name,
      namespace = this.projectConfig.defaultNamespace,
      cluster_id = this.projectConfig.cluster_id,
      vars = this.projectConfig.vars
    }) {
      const payload = {
        env_name,
        namespace,
        cluster_id,
        vars: vars.map(va => ({ alias: va.alias, key: va.key, value: va.value }))
      }
      if (this.$refs.k8sServiceListRef && env_name && namespace && cluster_id) {
        this.$refs.k8sServiceListRef
          .checkSvcResource(this.projectName, payload)
          .then(res => {
            this.serviceNames.forEach(name => {
              this.containerMap[name].deploy_strategy = res[name]
                ? 'import'
                : 'deploy'
            })
          }).catch((err) => console.log(err))
      }
    }, 300)
  },
  watch: {
    'projectConfig.defaultNamespace' (val) {
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
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        {
          title: this.$t('subTopbarMenu.projects'),
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t('subTopbarMenu.environments'), url: '' },
        { title: this.createShare ? this.$t('environments.k8s.subEnvCreation') : this.$t('environments.k8s.envCreation'), url: '' }
      ]
    })
    this.getVersionList()
    this.getEnvNameList()
    this.projectConfig.product_name = this.projectName
    this.getCluster()
    getRegistryWhenBuildAPI(this.projectName).then(res => {
      this.imageRegistry = res
      if (!this.projectConfig.registry_id) {
        const defaultRegistry = res.find(reg => reg.is_default)
        this.defaultResource.registryId = defaultRegistry
          ? defaultRegistry.id
          : ''
        this.projectConfig.registry_id = this.defaultResource.registryId
      }
      this.getTemplateAndImg()
    })
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

  .create-footer {
    position: fixed;
    bottom: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 15px 0 10px;

    .description {
      flex: 0 0 auto;
      line-height: 36px;

      p {
        margin: 0;
        color: #676767;
        font-size: 16px;
        line-height: 36px;
        text-align: left;
      }
    }

    .deploy-loading {
      flex: 0 0 100px;
      margin-left: 20px;
      line-height: 36px;
      text-align: center;

      div {
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-right: 4px;
        background-color: @themeColor;
        border-radius: 100%;
        animation: sk-bouncedelay 1.4s infinite ease-in-out both;
      }

      .spinner__item1 {
        animation-delay: -0.6s;
      }

      .spinner__item2 {
        animation-delay: -0.4s;
      }

      .spinner__item3 {
        animation-delay: -0.2s;
      }

      @keyframes sk-bouncedelay {
        0%,
        80%,
        100% {
          -webkit-transform: scale(0);
          transform: scale(0);
          opacity: 0;
        }

        40% {
          -webkit-transform: scale(1);
          transform: scale(1);
          opacity: 1;
        }
      }
    }
  }

  .ops {
    margin-top: 25px;
  }
}
</style>
