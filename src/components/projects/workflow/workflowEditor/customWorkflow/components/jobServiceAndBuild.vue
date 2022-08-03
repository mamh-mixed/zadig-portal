<template>
  <div class="service-build-val">
    <el-row :gutter="24" class="mg-b16">
      <el-col :span="6" class="title">服务组件</el-col>
      <el-col :span="6" class="title">构建名称</el-col>
      <el-col :span="6" class="title">构建变量</el-col>
    </el-row>
    <el-form :model="form" ref="ruleForm" size="small">
      <div v-for="(item,index) in serviceAndBuilds" :key="index">
        <el-row :gutter="24" class="mg-t24">
          <el-col :span="6">
            <span>{{item.service_name}}/{{item.service_module}}</span>
          </el-col>
          <el-col :span="6">
            <el-select v-model="item.build_name" size="small" @change="handleBuildChange(item)" style="width: 200px;">
              <el-option v-for="build in item.module_builds" :key="build.name" :label="build.name" :value="build.name">{{build.name}}</el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="text" @click="toggleIsShowVals(item,index)">
              <span>设置</span>
              <span :class="{'el-icon-caret-bottom':item.isShowVals,'el-icon-caret-top': !item.isShowVals}"></span>
            </el-button>
          </el-col>
          <el-col :span="4">
            <el-button type="danger" size="mini" @click="delServiceAndBuild(index)">删除</el-button>
          </el-col>
        </el-row>
        <el-row>
          <el-card class="box-card" v-if="item.isShowVals" style="width: 80%;">
            <div class="tab">
              <span
                class="tab-item"
                :class="{'active': item.currentTab===tab.name}"
                v-for="(tab) in buildTabList"
                :key="tab.name"
                @click="item.currentTab = tab.name"
              >{{tab.label}}</span>
            </div>
            <el-table :data="item.key_vals" size="small" v-if="item.currentTab===`env`">
              <el-table-column prop="key" label="键"></el-table-column>
              <el-table-column label="类型">
                <template slot-scope="scope">{{scope.row.type === 'string' ? '字符串' : '枚举'}}</template>
              </el-table-column>
              <el-table-column label="值" width="300">
                <template slot-scope="scope">
                  <el-select size="small" v-model="scope.row.value" v-if="scope.row.type === 'choice'" style="width: 220px;">
                    <el-option v-for="option in scope.row.choice_option" :key="option" :label="option" :value="option">{{option}}</el-option>
                  </el-select>
                  <el-input
                    class="password"
                    v-model="scope.row.value"
                    :type="scope.row.is_credential ? 'passsword' : ''"
                    show-password
                    v-if="scope.row.type === 'string'"
                    size="small"
                    style="width: 220px;"
                  ></el-input>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="item.currentTab==='branch'">
              <el-table :data="item.repos" size="small">
                <el-table-column prop="repo_name" label="代码库" width="200px"></el-table-column>
                <el-table-column prop="branch" label="默认分支">
                  <template slot-scope="scope">
                    <el-select size="small" v-model="scope.row.branch" filterable style="width: 220px;">
                      <el-option
                        v-for="option in scope.row.branches"
                        :key="option.name"
                        :label="option.name"
                        :value="option.name"
                      >{{option.name}}</el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100px">
                  <template slot-scope="scope">
                    <el-button @click="delRepo(item,scope.row)" type="danger" icon="el-icon-delete" size="mini">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="mg-t16">
                <el-select v-model="item.curRepo" value-key="repo_name" filterable size="small" placeholder="请选择代码库">
                  <el-option v-for="repo of item.originRepos" :key="repo.repo_name" :label="repo.repo_name" :value="repo"></el-option>
                </el-select>
                <el-button
                  @click="addRepo(item)"
                  :disabled="item.originRepos.length === 0"
                  type="primary"
                  size="mini"
                  icon="el-icon-plus"
                >添加</el-button>
              </div>
            </div>
          </el-card>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script>
import { getAllBranchInfoAPI } from '@api'
import { buildTabList } from '../config'
import { differenceWith } from 'lodash'

export default {
  name: 'ServiceAndBuild',
  props: {
    value: {
      type: Array,
      default: () => []
    },
    projectName: {
      type: String,
      default: ''
    },
    originServiceAndBuilds: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      form: {},
      buildTabList
    }
  },
  computed: {
    serviceAndBuilds: {
      get () {
        this.value.forEach(val => {
          if (val.repos) {
            val.repos.forEach(repo => {
              this.getBranch(repo)
            })
          }
        })
        return this.value
      }
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    }
  },
  created () {
    this.setServiceBuilds()
  },
  methods: {
    toggleIsShowVals (item) {
      this.$set(item, 'isShowVals', !item.isShowVals)
      this.$set(item, 'currentTab', 'env')
    },
    delServiceAndBuild (index) {
      this.serviceAndBuilds.splice(index, 1)
      this.$emit('input', this.serviceAndBuilds)
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
        const originRepos = differenceWith(result.repos, item.repos, (a, b) => {
          return a.repo_name === b.repo_name
        })
        this.$set(item, 'originRepos', originRepos)
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
    addRepo (item) {
      if (item.repos) {
        item.repos.push(item.curRepo)
      } else {
        this.$set(item, 'repos', [item.curRepo])
      }
      item.originRepos = item.originRepos.filter(
        repo => repo.repo_name !== item.curRepo.repo_name
      )
      this.getBranch(item.curRepo)
      item.curRepo = {}
    },
    delRepo (item, row) {
      item.repos = item.repos.filter(repo => repo.repo_name !== row.repo_name)
      item.originRepos.push(row)
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
    validate () {
      return this.serviceAndBuilds.length > 0
    },
    getData () {
      this.serviceAndBuilds.forEach(item => {
        delete item.currentTab
        delete item.isShowVals
        delete item.originRepos
        delete item.module_builds
        item.repos.forEach(repo => {
          delete repo.branches
        })
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
.service-build-val {
  width: 80%;
  color: #606266;
  font-size: 14px;

  .title {
    font-weight: 500;
  }

  .password {
    /deep/.el-input__suffix {
      display: none !important;
    }
  }

  .tab {
    margin: 16px 0;
    color: @projectNameColor;
    font-size: 14px;
    cursor: pointer;

    span:first-child {
      position: relative;
      margin-right: 16px;

      &::after {
        position: absolute;
        top: 0;
        right: -10px;
        width: 2px;
        height: 100%;
        background: @borderGray;
        content: '';
      }
    }

    .active {
      color: @themeColor;
    }
  }
}
</style>
