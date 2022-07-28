<template>
  <div class="job-operate">
    <div
      v-for="(item,index) in taskList"
      :key="index"
      class="item"
      :class="{'active':curTaskIndex===index}"
      @click="setCurTask(index,item)"
    >
      <div class="mg-b16">
        <span class="item-title">{{item.label || item.name}}</span>
        <el-tag size="small" class="mg-l8" v-if="item.is_offical">官方</el-tag>
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
      curTaskIndex: -1
    }
  },
  model: {
    prop: 'value',
    event: 'change'
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
      if (item.type === 'plugin') {
        const obj = {
          name: 'default',
          type: 'plugin',
          spec: {
            properties: {
              timeout: 60,
              res_req: 'low', // high/medium/low/min/define
              res_req_spec: {
                cpu_limit: 1000,
                memory_limit: 512
              },
              cluster_id: ''
            },
            plugin: item
          }
        }
        this.$emit('change', obj)
      } else {
        this.$emit('change', item)
      }
      this.curTaskIndex = -1
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
      font-size: 16px;
    }

    &-dec {
      color: #888;
      font-size: 14px;
    }

    &:hover {
      background: rgba(0, 102, 255, 0.07);
    }
  }

  .active {
    background: rgba(0, 102, 255, 0.07);
  }
}
</style>
