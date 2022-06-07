<template>
  <div class="host-select">
    <el-input placeholder="请输入内容" v-model="keyword" size="small" class="search" @input="getHosts">
      <el-button slot="append" icon="el-icon-search"></el-button>
    </el-input>
    <el-table :data="allHost" @selection-change="handleSelectionChange" ref="multipleTable">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="name" label="主机名称"></el-table-column>
      <el-table-column prop="ip" label="主机 IP"></el-table-column>
      <el-table-column prop="label" label="标签" width="100" :filters="filtersList" :filter-method="filterTag" filter-placement="bottom-end">
        <template slot-scope="scope" v-if="scope.row.label">
          <el-tag disable-transitions>{{scope.row.label}}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
import { getHostListAPI } from '@api'
import { concat } from 'lodash'

export default {
  name: 'pmHostItem',
  props: {
    currentPmServiceData: {
      type: Object,
      default: function () {
        return {}
      }
    },
    currentTab: {
      type: String,
      default: 'project'
    },
    hostIds: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      serviceHosts: [],
      allHost: [],
      keyword: '',
      multipleSelection: [],
      firstLoad: true
    }
  },
  computed: {
    filtersList: function () {
      return this.allHost.map(item => {
        item.text = item.label
        item.value = item.label
        return item
      })
    }
  },
  created () {
    this.getHosts()
  },
  methods: {
    updateRowSelection (ids) {
      ids.forEach(id => {
        this.allHost.forEach(host => {
          if (host.id === id) {
            this.$nextTick(() => {
              this.$refs.multipleTable.toggleRowSelection(host, true)
            })
          }
        })
      })
    },
    getHosts () {
      const key = this.$utils.rsaEncrypt()
      const keyword = this.keyword
      const projectName =
        this.currentTab === 'project'
          ? this.currentPmServiceData.product_name
          : ''
      getHostListAPI(key, projectName, keyword).then(res => {
        this.allHost = res
        this.updateRowSelection(this.serviceHosts)
      })
    },
    handleSelectionChange (val) {
      this.multipleSelection = val
    },
    filterTag (value, row) {
      return row.label === value
    }
  },

  watch: {
    currentPmServiceData: {
      handler (val) {
        if (val.env_configs) {
          this.serviceHosts = []
          val.env_configs.forEach(item => {
            this.serviceHosts = concat(
              this.serviceHosts,
              item.host_ids,
              item.labels
            )
          })
        }
      },
      immediate: true
    },
    serviceHosts: {
      handler (val) {
        this.updateRowSelection(val)
      },
      immediate: true
    },
    currentTab () {
      this.getHosts()
    }
  }
}
</script>
<style lang="less" scoped>
.host-select {
  .search {
    width: 300px;
    margin: 20px 0;
  }
}
</style>
