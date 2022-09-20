<template>
  <div class="job-build">
    <el-form ref="ruleForm" :model="job" class="mg-t24 mg-b24" label-width="90px" size="small">
      <el-form-item label="任务名称" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-table :data="curItem.key_vals" size="small">
        <el-table-column prop="key" label="键"></el-table-column>
        <el-table-column label="类型">
          <template slot-scope="scope">{{scope.row.type === 'string' ? '字符串' : '枚举'}}</template>
        </el-table-column>
        <el-table-column label="值" width="260">
          <template slot-scope="scope">
            <el-select
              size="small"
              v-model="scope.row.value"
              v-if="scope.row.command !== 'other'&&scope.row.type === 'choice'"
              style="width: 220px;"
            >
              <el-option v-for="option in scope.row.choice_option" :key="option" :label="option" :value="option">{{option}}</el-option>
            </el-select>
            <el-input
              class="password"
              v-model="scope.row.value"
              :type="scope.row.is_credential ? 'passsword' : ''"
              :show-password="scope.row.is_credential ? true : false"
              v-if="scope.row.command !== 'other'&&scope.row.type === 'string'"
              size="small"
              style="width: 220px;"
            ></el-input>
            <el-select
              v-model="scope.row.value"
              placeholder="请选择"
              filterable
              size="small"
              required
              v-if="scope.row.command === 'other'"
              style="display: inline-block; width: 220px;"
            >
              <el-option v-for="(item,index) in globalEnv" :key="index" :label="item" :value="item">{{item}}</el-option>
            </el-select>
            <EnvTypeSelect v-model="scope.row.command" isFixed isRuntime isOther style="display: inline-block;" />
          </template>
        </el-table-column>
      </el-table>
    </el-form>
  </div>
</template>

<script>
import { jobType, buildTabList, validateJobName } from '../../config'
import { getAllBranchInfoAPI, getRegistryWhenBuildAPI } from '@api'
import { differenceWith, cloneDeep } from 'lodash'
import EnvTypeSelect from '../envTypeSelect.vue'
export default {
  name: 'JobBuild',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    originServiceAndBuilds: {
      type: Array,
      default: () => []
    },
    globalEnv: {
      type: Array,
      default: () => []
    },
    job: {
      type: Object,
      default: () => ({})
    }
  },
  components: { EnvTypeSelect },
  data () {
    return {
      validateJobName,
      jobType,
      buildTabList,
      isShowBranchDialog: false,
      isShowVarDialog: false,
      curItem: {},
      dockerList: []
    }
  },
  computed: {
    serviceAndBuilds: {
      get () {
        this.job.spec.service_and_builds.forEach(val => {
          if (
            !val.build_name &&
            val.module_builds &&
            val.module_builds.length > 0
          ) {
            // default select first build
            val.build_name = val.module_builds[0].name
            this.handleBuildChange(val)
          }
          if (val.repos) {
            val.repos.forEach(repo => {
              this.getBranch(repo)
            })
          }
        })
        return this.job.spec.service_and_builds
      }
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    }
  },
  created () {
    this.setServiceBuilds()
    this.getRegistryWhenBuild()
  },
  methods: {
    // validateJob: validateJobName,
    delServiceAndBuild (index) {
      this.serviceAndBuilds.splice(index, 1)
      this.$emit('input', this.serviceAndBuilds)
    },
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    setServiceBuilds () {
      this.serviceAndBuilds.forEach(item => {
        const res = this.originServiceAndBuilds.find(
          build => build.service_name === item.service_name
        )
        this.$set(item, 'module_builds', res.module_builds)

        // set repos
        const result = item.module_builds.find(
          build => build.name === item.build_name
        )
        const originRepos = differenceWith(
          result.repos || [],
          item.repos,
          (a, b) => {
            return a.repo_name === b.repo_name
          }
        )
        this.$set(item, 'originRepos', originRepos || [])
      })
    },
    handleBuildChange (item) {
      const res = item.module_builds.find(
        build => build.name === item.build_name
      )
      if (res) {
        res.key_vals.forEach(item => {
          if (item.is_credential) {
            // item.value = this.$utils.aesDecrypt(item.value)
          }
        })
      }
      this.$set(item, 'key_vals', res.key_vals || [])
      this.$set(item, 'originRepos', res.repos || [])
      this.$set(item, 'repos', [])
    },
    addRepo () {
      if (this.curItem.repos) {
        this.curItem.repos.push(this.curItem.curRepo)
      } else {
        this.$set(this.curItem, 'repos', [this.curItem.curRepo])
      }
      this.curItem.originRepos = this.curItem.originRepos.filter(
        repo => repo.repo_name !== this.curItem.curRepo.repo_name
      )
      this.getBranch(this.curItem.curRepo)
      this.curItem.curRepo = {}
    },
    delRepo (row) {
      this.curItem.repos = this.curItem.repos.filter(
        repo => repo.repo_name !== row.repo_name
      )
      this.curItem.originRepos.push(row)
    },
    async getBranch (item) {
      const repo = [
        {
          repo_owner: item.repo_owner,
          repo: item.repo_name,
          default_branch: item.branch,
          codehost_id: item.codehost_id
        }
      ]
      const payload = {
        infos: repo
      }
      const res = await getAllBranchInfoAPI(payload)
      if (res) {
        this.$set(item, 'branches', res[0].branches)
      }
    },
    handleVarBranchChange (type, item) {
      if (type === 'var') {
        this.isShowVarDialog = true
      } else {
        this.isShowBranchDialog = true
      }
      this.curItem = cloneDeep(item)
    },
    saveCurSetting (type) {
      this.serviceAndBuilds.forEach((item, index) => {
        if (item.build_name === this.curItem.build_name) {
          this.$set(this.serviceAndBuilds, index, this.curItem)
        }
      })
      if (type === 'var') {
        this.isShowVarDialog = false
      } else {
        this.isShowBranchDialog = false
      }
    },
    validate () {
      const valid = []
      return this.$refs.ruleForm.validate().then(val => {
        if (val) {
          this.serviceAndBuilds.forEach((item, index) => {
            valid.push(this.$refs[`ruleForm${index}`][0].validate())
          })
          return Promise.all(valid)
        }
      })
    },
    getData () {
      this.serviceAndBuilds.forEach(item => {
        delete item.currentTab
        delete item.isShowVals
        delete item.originRepos
        delete item.module_builds
        if (item.repos && item.repos.length > 0) {
          item.repos.forEach(repo => {
            delete repo.branches
          })
        }
      })
      return this.serviceAndBuilds
    }
  },
  watch: {
    isShowFooter () {
      this.setServiceBuilds()
    }
  }
}
</script>
<style lang="less" scoped>
.job-build {
  width: 80%;
  color: #606266;
  font-size: 14px;

  .title {
    font-weight: 500;
  }

  .iconfont {
    margin-right: 8px;
    color: #06f;
    cursor: pointer;
  }

  .iconbianliang1 {
    font-weight: 600;
  }

  .password {
    /deep/.el-input__suffix {
      display: none !important;
    }
  }
}
</style>
