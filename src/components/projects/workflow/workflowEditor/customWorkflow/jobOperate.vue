<template>
  <div class="job-operate">
    <div
      v-for="(item,index) in taskList"
      :key="index"
      class="item"
      :class="{'active':curTaskIndex===index}"
      @click="setCurTask(index,item)"
    >
      <div class="mg-b8">
        <span class="item-title">{{item.label || item.name}}</span>
        <el-tag size="small" v-if="item.is_offical">官方</el-tag>
      </div>
      <span class="item-dec">{{item.description}}</span>
    </div>
  </div>
</template>

<script>
import { jobTypeList } from './config'
import { getPluginsAPI } from '@api'

export default {
  name: 'JobOperate',
  data () {
    return {
      jobTypeList,
      plugins: [],
      curTaskIndex: 0,
      jobInfo: {
        type: 'zadig-build'
      },
      rules: {
        type: [{ required: true, message: '请选择 Job 类型', trigger: 'blur' }]
      }
    }
  },
  computed: {
    taskList () {
      return this.jobTypeList.concat(this.plugins)
    }
  },
  created () {
    this.getPlugins()
  },
  methods: {
    getPlugins () {
      getPluginsAPI().then(res => {
        res.forEach(item => {
          item.type = 'plugin'
        })
        this.plugins = res
      })
    },
    setCurTask (index, item) {
      this.curTaskIndex = index
      this.$emit('jobInfo', item)
    }
  },
  watch: {
    jobInfo: {
      handler () {
        this.$emit('jobInfo', this.jobInfo)
      },
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.job-operate {
  .item {
    margin: 24px 0;
    padding: 8px;
    text-align: left;
    border-radius: 6px;
    cursor: pointer;

    &-title {
      font-weight: 500;
      font-size: 16px;
    }

    &-dec {
      font-size: 14px;
    }
  }

  .active {
    color: #fff;
    background: #3370ff;
  }
}
</style>
