<template>
  <div class="base">
    <div class="column">
      <span class="column-item">服务组件</span>
      <span class="column-item">构建名称</span>
      <span class="column-item">构建变量</span>
    </div>
    <div>
      <div v-for="(item,index) in serviceAndBuilds" :key="index">
        <div class="column">
          <span class="column-item">{{item.service_name}}/{{item.service_module}}</span>
          <el-select class="column-item" v-model="item.build_name" size="small" @change="handleBuildChange(item)">
            <el-option v-for="build in item.module_builds" :key="build.name" :label="build.name" :value="build.name">{{build.name}}</el-option>
          </el-select>
          <el-button type="text" @click="toggleIsShowVals(item,index)" class="column-item">
            <span>设置</span>
            <span :class="{'el-icon-caret-bottom':item.isShowVals,'el-icon-caret-top': !item.isShowVals}"></span>
          </el-button>
          <el-button type="danger" size="mini" @click="delServiceAndBuild(item.service_name,index)" class="mg-l16">删除</el-button>
        </div>
        <el-table :data="item.key_vals" class="mg-t24" v-if="item.isShowVals">
          <el-table-column prop="key" label="键" width="180"></el-table-column>
          <el-table-column label="类型" width="180">
            <template slot-scope="scope">{{scope.row.type === 'string' ? '字符串' : '枚举'}}</template>
          </el-table-column>
          <el-table-column label="值">
            <template slot-scope="scope">
              <el-select size="small" v-model="scope.row.value" v-if="scope.row.type === 'choice'">
                <el-option v-for="option in scope.row.choice_option" :key="option" :label="option" :value="option">{{option}}</el-option>
              </el-select>
              <el-input v-model="scope.row.value" v-if="scope.row.type === 'string'"></el-input>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import { getAssociatedBuildsAPI } from '@api'

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
    }
  },
  data () {
    return {
      originServiceAndBuilds: []
    }
  },
  computed: {
    serviceAndBuilds: {
      get () {
        this.value.forEach(item => {
          item.isShowVals = false
        })
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    }
  },
  created () {
    this.getServiceAndBuild()
  },
  methods: {
    toggleIsShowVals (item) {
      this.$set(item, 'isShowVals', !item.isShowVals)
      // $set is unuseful to the new attr
      this.$forceUpdate()
    },
    getServiceAndBuild () {
      const projectName = this.projectName
      getAssociatedBuildsAPI(projectName).then(res => {
        this.originServiceAndBuilds = res
        this.setServiceBuilds()
      })
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
      })
    },
    handleBuildChange (item) {
      const res = item.module_builds.find(
        build => build.name === item.build_name
      ).key_vals
      this.$set(item, 'key_vals', res)
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
.base {
  width: 70%;

  &-title {
    display: flex;
    margin-bottom: 24px;
  }

  .column {
    display: flex;
    align-items: center;
    margin-top: 16px;
    &-item {
      width: 30%;
      text-align: left;
      font-size: 14px;
    }
  }
}
</style>
