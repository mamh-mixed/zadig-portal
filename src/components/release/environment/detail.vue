<template>
  <div class="namespace-detail-container" ref="envContainer">
    <div class="envs-container">
      <ChromeTabs v-model="namespace" :tabList="namespaceList" :label="'namespace'" :name="'namespace'">
        <template v-slot="{ tab }">
          <span>
            {{ $utils.tailCut(tab.namespace,14) }}
            {{`(${tab.alias})`}}
            <!-- <el-tag v-if="tab.production" effect="light" size="mini" type="danger">生产</el-tag> -->
          </span>
        </template>
      </ChromeTabs>
    </div>
    <div class="banner">
      <!-- <el-alert
        title="`注意：自测模式正在${shareEnvStatus.operation ==='enable'?'开启':'关闭'}，过程中服务会重启，短时间内会影响服务的正常访问，请耐心等待。`"
        :closable="false"
        type="warning"
      ></el-alert>-->
    </div>

    <div class="info-container">
      <div element-loading-text="正在获取基本信息" element-loading-spinner="el-icon-loading" class="common-parcel-block basic-info-content">
        <el-row :gutter="10">
          <el-col :span="8">
            <div class="grid-title">K8s 集群</div>
            <div class="grid-content">{{currentNamespace.cluster_name}}</div>
          </el-col>
          <el-col :span="8">
            <div class="grid-title">命名空间</div>
            <div class="grid-content">{{currentNamespace.namespace}}</div>
          </el-col>
          <el-col :span="8" class="operation">
            <el-button type="primary" size="mini" plain>变更记录</el-button>
            <el-dropdown>
              <span class="dropdown-btn">
                <i class="iconfont iconmorelist"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="setAlias()">设置别名</el-dropdown-item>
                <el-dropdown-item @click.native="removeNamespace(namespace)">移除</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </el-col>
        </el-row>
        <!-- <div>
          <div class="grid-title">错误信息</div>
          <div class="grid-content error-info">错误信息</div>
        </div>-->
      </div>
      <!--end of basic info-->
    </div>
    <div class="info-container">
      <div element-loading-text="正在获取基本信息" element-loading-spinner="el-icon-loading" class="common-parcel-block basic-info-content">
        <CategoryTab :routerList="routerList" />
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { getGroupsAPI } from '@api'
import _ from 'lodash'
import CategoryTab from './categoryTab.vue'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      namespaceList: [],
      currentNamespace: {
        namespace: '',
        cluster_name: '',
        alias: ''
      }
    }
  },
  computed: {
    namespace: {
      get: function () {
        if (this.$route.query.namespace) {
          return this.$route.query.namespace
        } else {
          return this.namespaceList[0].name
        }
      },
      set: function (newValue) {
        if (newValue === 'CREATE_NEW_ENV') {
          this.$router.push({
            path: `/v1/projects/detail/${this.projectName}/envs/create`,
            query: { outer: this.envBasePath.startsWith('/v1/envs/detail') }
          })
        } else {
          this.$router.push({
            path: `/v1/release/environment/detail/${this.groupName}/${this.groupId}/${newValue}/${this.namespaceId}`,
            query: { namespace: newValue }
          })
        }
      }
    },
    namespaceId () {
      return this.$route.params.namespaceId
    },
    groupName () {
      return this.$route.params.group
    },
    groupId () {
      return this.$route.params.groupId
    },
    routerList () {
      return [
        {
          name: '工作负载',
          icon: 'iconfont iconvery-k8s',
          url: `/v1/release/environment/detail/${this.groupName}/${this.groupId}/${this.namespace}/${this.namespaceId}/workload?namespace=${this.namespace}`
        },
        {
          name: '网络',
          icon: 'iconfont iconhelmrepo',
          url: `/v1/release/environment/detail/${this.groupName}/${this.groupId}/${this.namespace}/${this.namespaceId}/network?namespace=${this.namespace}`
        },
        {
          name: '存储',
          icon: 'iconfont icondocker',
          url: `/v1/release/environment/detail/${this.groupName}/${this.groupId}/${this.namespace}/${this.namespaceId}/storage?namespace=${this.namespace}`
        },
        {
          name: '配置',
          icon: 'iconfont iconvery-build',
          url: `/v1/release/environment/detail/${this.groupName}/${this.groupId}/${this.namespace}/${this.namespaceId}/config?namespace=${this.namespace}`
        }
      ]
    }
  },
  methods: {
    removeNamespace (namespace) {
      this.$confirm(`确定要移除 ${namespace} 命名空间?`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(({ value }) => {})
    },
    setAlias (name) {
      this.$prompt('设置别名', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button el-button--primary',
        inputValidator: input => {
          if (input === '') {
            return '请输入别名'
          }
        }
      })
        .then(({ value }) => {
          removeGroupAPI(name).then(res => {
            this.getGroups()
            this.$message({
              message: '删除成功',
              type: 'success'
            })
          })
        })
        .catch(() => {
          this.$message({
            type: 'warning',
            message: '取消操作'
          })
        })
    },
    async getProductEnvInfo (projectName, namespace) {
      this.envLoading = true
      this.serviceLoading = true
      const envInfo = await getEnvInfoAPI(projectName, namespace)
      if (envInfo) {
        if (!envInfo.registry_id) {
          envInfo.registry_id = ''
        }
        envInfo.editRegistryID = envInfo.registry_id
        this.productInfo = envInfo
        this.envLoading = false
        this.recycleDay = envInfo.recycle_day ? envInfo.recycle_day : undefined
      }
    },
    async getNamespaceList () {
      const groupName = this.groupName
      const groups = await getGroupsAPI()
      const currentGroup = _.find(groups.groups, { name: groupName })
      const namespaceList = currentGroup.namespaces
      if (namespaceList) {
        this.namespaceList = _.sortBy(namespaceList, 'namespace')
        this.currentNamespace = this.namespaceList.find(
          item => item.namespace === this.namespace
        )
      }
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '发布中心', url: `` },
        { title: '环境组', url: `/v1/release/environment` },
        { title: this.groupName, url: `/v1/release/environment` },
        { title: this.namespace, url: `` }
      ]
    })
    this.getNamespaceList()
  },
  watch: {
    $route: {
      handler: function (to, from) {
        bus.$emit(`set-topbar-title`, {
          title: '',
          breadcrumb: [
            { title: '发布中心', url: `` },
            { title: '环境组', url: `/v1/release/environment` },
            { title: this.groupName, url: `/v1/release/environment` },
            { title: this.namespace, url: `` }
          ]
        })
        if (this.namespace) {
          this.getNamespaceList()
        }
        // if (this.projectName !== '') {
        //   this.ctlCancel && this.ctlCancel.cancel('CANCEL_1')
        //   this.ctlCancel = initSource()
        //   this.fetchAllData()
        // }
      },
      immediate: true
    }
  },
  components: {
    CategoryTab
  },
  props: {
    // envBasePath: {
    //   type: String,
    //   required: true
    // }
  }
}
</script>

<style lang="less">
@import '~@assets/css/component/namespace-detail.less';

.el-message-box__wrapper {
  .el-message-box__title {
    padding-right: 20px;
  }
}
</style>
