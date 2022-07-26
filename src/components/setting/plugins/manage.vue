<template>
  <div class="plugins">
    <el-row class="repo-select">
      <el-form :model="source" label-position="left" ref="sourceForm" label-width="130px" inline>
        <el-col :span="4">自定义插件源</el-col>
        <el-col :span="3">
          <el-select
            v-model="source.codehostId"
            size="small"
            style="width: 100%;"
            placeholder="请选择代码源"
            @change="getRepoOwnerById(source.codehostId)"
            filterable
          >
            <el-option
              v-for="(host,index) in allCodeHosts"
              :key="index"
              :label="host.address + '('+host.alias+')'"
              :value="host.id"
            >{{host.address + '('+host.alias+')'}}</el-option>
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select
            v-model.trim="source.repoOwner"
            size="small"
            style="width: 100%;"
            @change="getRepoNameById(source.codehostId,source.repoOwner)"
            @clear="clearRepoOwner"
            remote
            :remote-method="searchRepoOwner"
            :loading="searchRepoOwnerLoading"
            allow-create
            clearable
            placeholder="请选择组织名/用户名"
            filterable
          >
            <el-option v-for="(repo,index) in codeInfo['repoOwners']" :key="index" :label="repo.path" :value="repo.path"></el-option>
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select
            @change="getBranchInfoById(source.codehostId,source.repoOwner,source.repoName,source)"
            @clear="clearRepoName"
            v-model.trim="source.repoName"
            remote
            :remote-method="searchRepoName"
            :loading="searchRepoNameLoading"
            style="width: 100%;"
            allow-create
            clearable
            size="small"
            placeholder="请选择代码库"
            filterable
          >
            <el-option v-for="(repo,index) in codeInfo['repos']" :key="index" :label="repo.name" :value="repo.name"></el-option>
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model.trim="source.branchName" placeholder="请选择" style="width: 100%;" size="small" filterable allow-create clearable>
            <el-option v-for="(branch,branch_index) in codeInfo['branches']" :key="branch_index" :label="branch.name" :value="branch.name"></el-option>
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" size="small">保存</el-button>
          <el-button size="small" :disabled="source">同步</el-button>
        </el-col>
      </el-form>
    </el-row>
  </div>
</template>

<script>
import {
  getCodeSourceMaskedAPI,
  getRepoOwnerByIdAPI,
  getRepoNameByIdAPI,
  getBranchInfoByIdAPI
} from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      allCodeHosts: [],
      isCanInput: false,
      codeInfo: {},
      source: {
        codehostId: '',
        repoOwner: '',
        repoName: '',
        branchName: ''
      },
      searchRepoOwnerLoading: false,
      searchRepoNameLoading: false
    }
  },
  computed: {},
  created () {
    bus.$emit(`set-topbar-title`, { title: '插件管理', breadcrumb: [] })
    this.getInitRepoInfo(this.source)
  },
  methods: {
    handleInput () {
      this.isCanInput = true
    },
    getInitRepoInfo (source) {
      this.$set(this, 'codeInfo', {
        repoOwners: [],
        repos: [],
        branches: []
      })
      const key = this.$utils.rsaEncrypt()
      getCodeSourceMaskedAPI(key).then(res => {
        this.allCodeHosts = res.filter(element => {
          return element
        })
      })
      // getRepoOwnerByIdAPI(codehostId).then(res => {
      //   this.$set(this.codeInfo, 'repoOwners', res)
      //   const item = this.codeInfo.repoOwners.find(item => {
      //     return item.path === repoOwner
      //   })
      //   const type = item ? item.kind : 'group'
      //   getRepoNameByIdAPI(codehostId, type, encodeURI(repoOwner)).then(res => {
      //     this.$set(this.codeInfo, 'repos', res)
      //   })
      // })
      // getBranchInfoByIdAPI(codehostId, source.namespace, repoName).then(res => {
      //   this.$set(this.codeInfo, 'branches', res)
      // })
    },
    searchRepoName (query) {
      this.searchRepoNameLoading = true
      const repoOwner = this.source.repoOwner
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repoOwner
      })
      const type = item ? item.kind : 'group'
      const id = this.source.codehostId
      getRepoNameByIdAPI(id, type, encodeURI(repoOwner), query).then(res => {
        this.searchRepoNameLoading = false
        this.$set(this.codeInfo, 'repos', res)
      })
    },
    clearRepoName () {
      const repoOwner = this.source.repoOwner
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repoOwner || item.name === repoOwner
      })
      const type = item ? item.kind : 'group'
      const project_uuid = item.project_uuid ? item.project_uuid : ''
      const id = this.source.codehostId
      getRepoNameByIdAPI(id, type, encodeURI(repoOwner), '', project_uuid).then(
        res => {
          this.$set(this.codeInfo, 'repos', res)
        }
      )
      this.source.branchName = ''
      this.source.path = ''
      this.source.services = []
      this.$set(this.codeInfo, 'branches', [])
    },
    getRepoNameById (id, repoOwner, key = '') {
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repoOwner || item.name === repoOwner
      })
      const type = item ? item.kind : 'group'
      const project_uuid = item.project_uuid ? item.project_uuid : ''
      this.$refs.sourceForm.clearValidate()
      if (repoOwner) {
        getRepoNameByIdAPI(
          id,
          type,
          encodeURI(repoOwner),
          key,
          project_uuid
        ).then(res => {
          this.$set(this.codeInfo, 'repos', res)
        })
      }
      this.source.repoName = ''
      this.source.branchName = ''
      this.source.path = ''
      this.source.services = []
    },
    searchRepoOwner (query) {
      this.searchRepoOwnerLoading = true
      const id = this.source.codehostId
      const type = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (type === 'github' && query !== '') {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo.repoOwners
        )
        this.$set(this.codeInfo, 'repoOwners', items)
        this.searchRepoOwnerLoading = false
      } else {
        getRepoOwnerByIdAPI(id, query).then(res => {
          this.$set(this.codeInfo, 'repoOwners', res)
          this.searchRepoOwnerLoading = false
        })
      }
    },
    clearRepoOwner () {
      const id = this.source.codehostId
      getRepoOwnerByIdAPI(id).then(res => {
        this.$set(this.codeInfo, 'repoOwners', res)
      })
      this.source.repoName = ''
      this.source.branchName = ''
      this.source.path = ''
      this.source.namespace = ''
      this.source.services = []
      this.$set(this.codeInfo, 'repos', [])
      this.$set(this.codeInfo, 'branches', [])
    },
    getRepoOwnerById (id, key = '') {
      const codehost = this.allCodeHosts.find(item => {
        return item.id === id
      })
      const type = codehost ? codehost.type : 'gitlab'
      this.source.gitType = type
      this.$refs.sourceForm.clearValidate()
      this.$set(this.codeInfo, 'repoOwners', [])
      this.$set(this.codeInfo, 'repos', [])
      this.$set(this.codeInfo, 'branches', [])
      getRepoOwnerByIdAPI(id, key).then(res => {
        this.$set(this.codeInfo, 'repoOwners', res)
      })
      this.source.repoOwner = ''
      this.source.repoName = ''
      this.source.branchName = ''
      this.source.path = ''
      this.source.namespace = ''
      this.source.services = []
    },
    getBranchInfoById (id, repoOwner, repoName, row) {
      const repoItem = this.codeInfo.repos.find(item => {
        return item.name === repoName
      })
      const repoUUID = repoItem.repo_uuid ? repoItem.repo_uuid : ''
      this.source.repoUUID = repoUUID
      this.source.namespace = repoItem.namespace || ''
      if (repoName && repoOwner) {
        getBranchInfoByIdAPI(
          id,
          this.source.namespace,
          repoName,
          repoUUID
        ).then(res => {
          this.$set(this.codeInfo, 'branches', res)
        })
        this.source.branchName = ''
        this.source.path = ''
        this.source.services = []
      }
    }
  }
}
</script>

<style lang="less" scoped>
.plugins {
  padding: 24px;
}
</style>
