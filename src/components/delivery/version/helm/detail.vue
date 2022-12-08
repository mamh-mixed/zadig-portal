<template>
  <div class="helm-version-detail">
    <el-tabs type="border-card">
      <el-tab-pane label="版本信息">
        <div v-loading="loading">
          <div class="version-title">基本信息</div>
          <div class="basic-info">
            <el-row :gutter="10">
              <el-col :span="10">
                版本：
                <span class="dark-color">{{versionInfo.version}}</span>
              </el-col>
              <el-col :span="10">
                标签：
                <el-tag size="mini" v-for="(label,index) in versionInfo.labels" :key="index" style="margin-right: 5px;">{{label}}</el-tag>
              </el-col>
            </el-row>
            <el-row :gutter="10">
              <el-col :span="10">
                创建人：
                <span class="dark-color">{{versionInfo.createdBy}}</span>
              </el-col>
              <el-col :span="10">
                创建时间：
                <span class="dark-color">{{$utils.convertTimestamp(versionInfo.created_at)}}</span>
              </el-col>
            </el-row>
            <el-row :gutter="10">
              <el-col :span="10">
                描述：
                <span class="dark-color">{{versionInfo.desc}}</span>
              </el-col>
              <el-col :span="10">
                状态：
                <span
                  class="dark-color"
                  :style="{color: uploadProgressList(versionInfo.status).color}"
                >{{uploadProgressList(versionInfo.status).desc}}</span>
              </el-col>
            </el-row>
          </div>
          <div class="version-title">
            交付内容
            <el-popover placement="right" trigger="hover">
              <div>
                <div>
                  进度详情
                  <el-button v-if="versionInfo.status !== 'success'" type="text" class="little-btn" @click="retryCreate">重试</el-button>
                </div>
                <div style="width: 250px; padding: 0 5px; font-size: 13px;">
                  <p>上传 Chart 和镜像：{{versionInfo.progress.successChartCount}}/{{versionInfo.progress.totalChartCount}}</p>
                  <!-- <p>
                    上传离线包：
                    <span :style="{color: uploadProgress.color}">{{uploadProgress.desc}}</span>
                  </p> -->
                  <p v-if="versionInfo.progress.error">错误信息：{{versionInfo.progress.error}}</p>
                </div>
              </div>
              <el-button slot="reference" type="text" class="little-btn">进度详情</el-button>
            </el-popover>
          </div>
          <div class="push-info">
            <div class="push-title">Chart 信息</div>
            <el-table :data="distributeChart" style="width: 100%;">
              <el-table-column type="expand" width="50px">
                <template slot-scope="{row}">
                  <el-table :data="row.subDistributes" style="width: 100%;">
                    <el-table-column prop="serviceName" label="组件名称"></el-table-column>
                    <el-table-column label="镜像名称">
                      <template slot-scope="{row}">
                        <router-link :to="`/v1/delivery/artifacts?image=${row.registryName}`">{{row.registryName}}</router-link>
                      </template>
                    </el-table-column>
                  </el-table>
                </template>
              </el-table-column>
              <el-table-column prop="chartName" label="Chart 名称"></el-table-column>
              <el-table-column prop="chartRepoName" label="Chart 仓库"></el-table-column>
              <el-table-column prop="chartVersion" label="版本库"></el-table-column>
              <el-table-column :label="$t(`global.operation`)">
                <template slot-scope="{row}">
                  <!-- <el-button type="text">预览</el-button> -->
                  <a :download="`${row.chartName}-${row.chartVersion}`" :href="downloadChartUrl(row)">
                    <el-button type="text">下载</el-button>
                  </a>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="packageFile">
              <div class="push-title">离线包信息</div>
              <el-table :data="packageFile" style="width: 100%;">
                <el-table-column prop="packageFile" label="离线包名称"></el-table-column>
                <el-table-column label="对象存储">
                  <template slot-scope="{row}">{{row.storageUrl}}/{{row.storageBucket}}</template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <!-- <el-tab-pane disabled>
        <span slot="label" class="version-push" @click="upgradeVersion">
          <i class="el-icon-upload2"></i> 版本升级
        </span>
      </el-tab-pane> -->
    </el-tabs>
  </div>
</template>

<script>
import store from 'storejs'
import { getVersionDetailAPI, createHelmVersionAPI } from '@api'
export default {
  data () {
    return {
      loading: false,
      versionInfo: {
        progress: {}
      }, // base info
      distributeChart: [], // chart info
      packageFile: null // offline package information(advanced feature)
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    versionId () {
      return this.$route.params.id
    },
    uploadProgress () {
      return this.uploadProgressList(this.versionInfo.progress.packageStatus)
    }
  },
  methods: {
    uploadProgressList (status) {
      const statusEnum = {
        success: {
          desc: '成功',
          color: '#67c23a'
        },
        failed: {
          desc: '失败',
          color: '#f56c6c'
        },

        waiting: {
          desc: '等待上传',
          color: '#0066ff'
        },
        uploading: {
          desc: '上传中',
          color: '#e6a23c'
        },

        creating: {
          desc: '创建中',
          color: '#e6a23c'
        },
        retrying: {
          desc: '重试中',
          color: '#0066ff'
        },
        undefine: {
          desc: '未知',
          color: '#909399'
        }
      }
      return statusEnum[status] || statusEnum.undefine
    },
    retryCreate () {
      const payload = {
        productName: this.projectName,
        version: this.versionInfo.version,
        retry: true
      }
      this.loading = true
      createHelmVersionAPI(this.projectName, payload).then(() => {
        this.$message.success(`重试成功！`)
        this.getVersionDetail()
      })
    },
    upgradeVersion () {
      this.$message.info('敬请期待！')
    },
    getVersionDetail () {
      this.loading = true
      const versionId = this.versionId
      const projectName = this.projectName
      getVersionDetailAPI(projectName, versionId).then(res => {
        this.loading = false
        this.versionInfo = res.versionInfo

        const distributeChart = []
        res.distributeInfo.forEach(info => {
          if (info.distributeType === 'chart') {
            distributeChart.push(info)
          } else if (info.distributeType === 'file') {
            this.packageFile = [info]
          }
        })
        this.distributeChart = distributeChart
      })
    },
    downloadChartUrl (data) {
      const projectName = this.projectName
      const chartName = data.chartName
      const version = this.versionInfo.version
      const token = store.get('userInfo').token
      return `/api/aslan/delivery/releases/helm/charts?projectName=${projectName}&chartName=${chartName}&version=${version}&token=${token}`
    }
  },
  created () {
    this.getVersionDetail()
  }
}
</script>

<style lang="less" scoped>
.helm-version-detail {
  padding: 24px 24px;

  /deep/.el-tabs {
    .el-tabs__nav.is-top {
      width: 100%;

      .el-tabs__item.is-disabled {
        float: right;

        .version-push {
          color: @themeColor;
          cursor: pointer;
        }
      }
    }
  }

  .version-title {
    padding-bottom: 5px;
    color: #999;
    font-size: 16px;
    line-height: 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .basic-info {
    padding: 12px 20px;
    color: #8d9199;
    font-size: 13px;

    /deep/.el-row {
      margin-bottom: 15px;
    }
  }

  .push-title {
    width: 200px;
    margin: 20px 0 15px;
    color: #666;
    font-size: 14px;
    line-height: 2;
    border-bottom: 1px solid #eee;
  }

  .push-info {
    padding: 0 20px 12px;
  }

  /deep/.el-table {
    .el-table__cell {
      padding: 6px 0;

      &.el-table__expanded-cell {
        padding: 10px 50px;
      }
    }
  }

  .dark-color {
    color: #303133;
  }
}

.little-btn {
  margin-left: 5px;
  font-size: 12px;
}
</style>
