<template>
  <div class="mobile-env-detail">
    <van-nav-bar left-arrow
                 fixed
                 @click-left="backToEnv">
      <template #title>
        <span>{{`${projectName}-${envName}`}}</span>
      </template>
    </van-nav-bar>
    <div class="tabs-container">
      <van-tabs v-model="envName"
                sticky
                :offset-top="46">
        <van-tab v-for="(env,index) in envNameList"
                 :name="env.envName"
                 :key="index">
          <template #title>
            <i class="el-icon-cloudy"></i>
            {{`${env.name}`}}
            <el-tag v-if="env.clusterType==='生产'"
                    effect="light"
                    size="mini"
                    type="danger">生产</el-tag>
          </template>
          <van-divider content-position="left">基本信息</van-divider>
          <div class="env-info">
            <van-row>
              <van-col span="12">
                <div class="mobile-block">
                  <h2 class="mobile-block-title">更新时间</h2>
                  <div class="mobile-block-desc">
                    {{$utils.convertTimestamp(envInfo.update_time)}}
                  </div>
                </div>
              </van-col>
              <van-col span="12">
                <div class="mobile-block">
                  <h2 class="mobile-block-title">命名空间</h2>
                  <div class="mobile-block-desc">
                    {{ envInfo.namespace}}
                  </div>
                </div>
              </van-col>
            </van-row>
            <van-row>
              <van-col span="12">
                <div class="mobile-block">
                  <h2 class="mobile-block-title">环境状态</h2>
                  <div class="mobile-block-desc">
                    {{getProdStatus(envInfo.status,productStatus.updatable)}}
                  </div>
                </div>
              </van-col>
              <van-col span="12">
                <div class="mobile-block">
                  <h2 class="mobile-block-title">服务状态（实际/预期）</h2>
                  <div class="mobile-block-desc">
                    {{runningService}}/{{serviceList.length}}
                  </div>
                </div>
              </van-col>
            </van-row>
          </div>
          <van-divider content-position="left">服务列表</van-divider>
          <div class="service-list">
            <van-cell v-for="(item,index) in serviceList"
                      :to="`/mobile/envs/detail/${projectName}/${item.service_name}?envName=${envName}&projectName=${projectName}&namespace=${envText}&originProjectName=${item.product_name}&isProd=${isProd}`"
                      :key="index">
              <template #title>
                <span class="create-info">
                  {{ item.service_name}}</span>
                <van-tag>{{serviceTypeMap[item.type]}}</van-tag>
              </template>
              <template #label>
                <span class="imgs">
                  <template v-if="item.type==='k8s'">
                    <el-tooltip v-for="(image,index) in item.images"
                                :key="index"
                                effect="dark"
                                :content="image"
                                placement="top">
                      <span style="display: block;">{{imageNameSplit(image) }}</span>
                    </el-tooltip>
                  </template>
                </span>
              </template>

              <template #default>

                <van-tag plain
                         :type="statusIndicator[item.status]">
                  {{ item.status }}</van-tag>
              </template>
            </van-cell>
          </div>
        </van-tab>
      </van-tabs>
    </div>

  </div>
</template>
<script>
import { Col, Collapse, CollapseItem, Row, NavBar, Tag, Panel, Loading, Button, Notify, Tab, Tabs, Cell, CellGroup, Icon, Divider, ActionSheet, List } from 'vant'
import { translateEnvStatus, serviceTypeMap } from '@utils/wordTranslate'
import { envRevisionsAPI, getEnvInfoAPI, productServicesAPI, listProductAPI } from '@api'
import _ from 'lodash'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Tag.name]: Tag,
    [Panel.name]: Panel,
    [Loading.name]: Loading,
    [Button.name]: Button,
    [Notify.name]: Notify,
    [Tab.name]: Tab,
    [Tabs.name]: Tabs,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
    [Icon.name]: Icon,
    [Col.name]: Col,
    [Row.name]: Row,
    [Divider.name]: Divider,
    [ActionSheet.name]: ActionSheet,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem,
    [List.name]: List
  },
  data () {
    return {
      envInfo: {},
      envNameList: [],
      serviceList: [],
      serviceStatus: {},
      productStatus: {
        updateble: false
      },
      serviceTypeMap: serviceTypeMap,
      statusIndicator: {
        Running: 'success',
        Succeeded: 'success',
        Error: 'danger',
        Unstable: 'warning',
        Unstart: 'info'
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envText () {
      return this.envInfo.namespace
    },
    isProd () {
      return this.envInfo.is_prod
    },
    envSource () {
      return this.envInfo.source || ''
    },
    envName: {
      get: function () {
        return this.$route.query.envName
      },
      set: function (newValue) {
        this.$router.push({ path: `/mobile/envs/detail/${this.projectName}`, query: { envName: newValue } })
      }
    },
    runningService () {
      return this.serviceList.filter(s => (s.status === 'Running' || s.status === 'Succeeded')).length
    }
  },
  methods: {
    backToEnv () {
      this.$router.push('/mobile/envs')
    },
    imageNameSplit (name) {
      if (name.includes(':')) {
        return name.split('/')[name.split('/').length - 1]
      } else {
        return name
      }
    },
    async getEnvNameList () {
      const projectName = this.projectName
      const envNameList = await listProductAPI(projectName)
      envNameList.forEach(element => {
        element.envName = element.name
      })
      if (envNameList) {
        this.envNameList = _.sortBy(envNameList, (item) => { return item.production })
      }
    },
    async getEnvInfo (projectName, envName) {
      const envInfo = await getEnvInfoAPI(projectName, envName)
      if (envInfo) {
        this.envInfo = envInfo
      }
    },
    async getEnvServices () {
      const projectName = this.projectName
      const envName = this.envName
      const envSource = this.envSource
      const perPage = 999
      const page = 1
      const res = await productServicesAPI(projectName, envName, envSource, '', perPage, page)
      this.serviceList = res.data
    },
    initTemplateStatus () {
      this.serviceList.forEach(service => {
        this.$set(this.serviceStatus, service.service_name, {
          tpl_updatable: false,
          current_revision: 0,
          next_revision: 0
        })
      })
    },
    fetchEnvRevision () {
      const projectName = this.projectName
      const envName = this.envName
      envRevisionsAPI(projectName, envName).then(revisions => {
        const productStatus = revisions.find(element => { return element.product_name === projectName && element.env_name === this.envName })
        if (productStatus.services) {
          productStatus.services.forEach(service => {
            this.$set(this.serviceStatus, service.service_name, {
              tpl_updatable: !!(service.updatable && service.deleted === false && service.new === false),
              current_revision: service.current_revision,
              next_revision: service.next_revision,
              config: {
                config_name: service.configs && service.configs.length > 0 ? service.configs[0].config_name : null,
                current_revision: service.configs && service.configs.length > 0 ? service.configs[0].current_revision : null,
                next_revision: service.configs && service.configs.length > 0 ? service.configs[0].next_revision : null,
                updatable: service.configs && service.configs.length > 0 ? service.configs[0].updatable : null
              },
              raw: service
            })
          })
        }

        this.productStatus = productStatus
      })
    },
    fetchAllData () {
      this.getEnvNameList()
      this.getEnvInfo(this.projectName, this.envName)
      this.getEnvServices()
    },
    getProdStatus (status, updateble) {
      return translateEnvStatus(status, updateble)
    }
  },
  watch: {
    $route (to, from) {
      if (this.projectName !== '') {
        this.fetchAllData()
      }
    }
  },
  mounted () {
    this.fetchAllData()
  }
}
</script>
<style lang="less">
.mobile-env-detail {
  padding-top: 46px;
  padding-bottom: 50px;
}
</style>
