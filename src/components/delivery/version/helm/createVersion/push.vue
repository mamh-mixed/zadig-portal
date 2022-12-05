<template>
  <div class="version-push">
    <el-form ref="pushRef" :rules="rules" :model="releaseInfo" label-position="left" label-width="160px">
      <el-form-item label="选择镜像仓库" prop="imageRegistryID">
        <el-select v-model="releaseInfo.imageRegistryID" filterable placeholder="选择镜像仓库" size="small">
          <el-option :label="image.namespace ? `${image.reg_addr}/${image.namespace}` : image.reg_addr" :value="image.id" v-for="image in imageRegistryList" :key="image.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="选择 Chart 仓库" prop="chartRepoName">
        <el-select v-model="releaseInfo.chartRepoName" placeholder="请选择 Chart 仓库" size="small" @change="updateSelectedChart">
          <el-option :label="repo.repo_name" :value="repo.repo_name" v-for="repo in helmRepoList" :key="repo.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="填写 Chart 版本号"></el-form-item>
      <div v-for="(chart, index) in releaseInfo.chartDatas" :key="chart.serviceName">
        <el-form-item
          :label="chart.serviceName"
          :prop="`chartDatas[${index}].version`"
          :rules="[{
          required: true, message: `请输入 Chart ${chart.serviceName} 版本号`, trigger: ['change', 'blur']
        }]"
        >
          <el-input v-model="chart.version" placeholder="请输入 Chart 版本号" size="small"></el-input>
          <span class="last-version">上个版本：{{chart.lastVersion || '无'}}</span>
          <span class="config-btn" @click="showAdvancedConfig(chart.serviceName,index)">
            配置镜像 Tag
            <i v-if="advancedConfigVisible[chart.serviceName]" class="icon el-icon-arrow-up"></i>
            <i v-else-if="!advancedConfigVisible[chart.serviceName]" class="icon el-icon-arrow-down"></i>
          </span>
        </el-form-item>
        <div v-if="advancedConfigVisible[chart.serviceName]" class="advanced-config">
          <span class="title">配置镜像 Tag</span>
          <el-row v-for="(service,chartServiceImgIndex) in chart.imageData" :key="chartServiceImgIndex" class="img-row">
            <el-col :span="1">
              <el-tooltip effect="dark" content="选中后，对应镜像将重新打 tag 并推送到镜像仓库" placement="top">
                <el-checkbox v-model="service.selected" style="line-height: 34px;"></el-checkbox>
              </el-tooltip>
            </el-col>
            <el-col :span="4">
              <span class="service-name">{{service.imageName}}</span>
            </el-col>
            <el-col :span="15">
              <el-input v-model="service.imageTag" placeholder="请输入镜像 Tag" size="small" clearable></el-input>
              <span v-if="chartServiceImgIndex === 0" @click="applyInputTagToAll(service.imageTag,chart.imageData)" class="config-btn">应用全部</span>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- <div>
        <el-button type="text" @click="showEnhanced = !showEnhanced">
          高级功能
          <i :class="{'el-icon-arrow-right': !showEnhanced, 'el-icon-arrow-down': showEnhanced}"></i>
        </el-button>
      </div>
      <div v-if="showEnhanced">
        <el-form-item label="离线包分发">
          <el-switch v-model="releaseInfo.options.enableOfflineDist"></el-switch>
          <span class="desc">将所选服务的镜像和 Chart 打包并上传对象存储</span>
        </el-form-item>
        <el-form-item label="对象存储" prop="options.s3StorageID">
          <el-select v-model="releaseInfo.options.s3StorageID" placeholder="请选择对象存储" size="small">
            <el-option :label="`${storage.bucket}(${storage.endpoint})`" :value="storage.id" v-for="storage in storageList" :key="storage.id"></el-option>
          </el-select>
        </el-form-item>
      </div>-->
    </el-form>
  </div>
</template>

<script>
import {
  getStorageListAPI,
  getHelmRepoAPI,
  getRegistryWhenBuildAPI,
  getChartLastVersionAPI,
  getChartServiceImgsAPI
} from '@api'
import { keyBy } from 'lodash'

export default {
  props: {
    releaseInfo: Object
  },
  data () {
    this.rules = {
      imageRegistryID: {
        required: true,
        message: '请选择镜像仓库',
        trigger: ['change', 'blur']
      },
      chartRepoName: {
        required: true,
        message: '请选择 Chart 仓库',
        trigger: ['change', 'blur']
      },
      'options.s3StorageID': {
        required: true,
        message: '请选择对象存储',
        trigger: ['change', 'blur']
      }
    }
    return {
      showEnhanced: false,
      helmRepoList: [],
      storageList: [],
      imageRegistryList: [],
      chartServiceImgs: {},
      advancedConfigVisible: {}
    }
  },
  methods: {
    validate () {
      return this.$refs.pushRef.validate()
    },
    getStorageList () {
      const key = this.$utils.rsaEncrypt()
      getStorageListAPI(key).then(res => {
        this.storageList = res
      })
    },
    getHelmRepo () {
      const key = this.$utils.rsaEncrypt()
      getHelmRepoAPI(key).then(res => {
        this.helmRepoList = res
      })
    },
    getRegistryList () {
      getRegistryWhenBuildAPI().then(res => {
        this.imageRegistryList = res
      })
    },
    updateSelectedChart () {
      const chartRepoName = this.releaseInfo.chartRepoName
      if (!chartRepoName) {
        return
      }
      const chartName = this.releaseInfo.chartDatas.map(chart => {
        chart.lastVersion = ''
        chart.version = ''
        return chart.serviceName
      })
      getChartLastVersionAPI(
        this.releaseInfo.productName,
        chartRepoName,
        chartName
      ).then(res => {
        const resObj = keyBy(res, 'chartName')
        this.releaseInfo.chartDatas.forEach(chart => {
          chart.lastVersion = resObj[chart.serviceName].chartVersion
          chart.version = resObj[chart.serviceName].nextChartVersion
        })
      })
    },
    getChartServiceImgs (chartName, chartIndex) {
      const projectName = this.releaseInfo.productName
      const envName = this.releaseInfo.envName
      getChartServiceImgsAPI(projectName, envName, chartName).then(res => {
        if (res.serviceImages && res.serviceImages.length > 0) {
          this.$set(
            this.releaseInfo.chartDatas[chartIndex],
            'imageData',
            res.serviceImages[0].imageData
          )
        } else {
          this.$set(this.releaseInfo.chartDatas[chartIndex], 'imageData', [])
        }
      })
    },
    showAdvancedConfig (chartName, chartIndex) {
      this.$set(
        this.advancedConfigVisible,
        chartName,
        !this.advancedConfigVisible[chartName]
      )
      if (this.advancedConfigVisible[chartName]) {
        this.getChartServiceImgs(chartName, chartIndex)
      }
    },
    applyInputTagToAll (input, imageData) {
      imageData.forEach(img => {
        img.imageTag = input
      })
    }
  },
  created () {
    this.getHelmRepo()
    this.getStorageList()
    this.getRegistryList()
  },
  activated () {
    this.updateSelectedChart()
  }
}
</script>

<style lang="less" scoped>
@import url('~@assets/css/common/scroll-bar.less');

.version-push {
  box-sizing: border-box;
  height: calc(~'100% - 200px');
  padding-bottom: 20px;
  overflow: auto;
  .blockScrollBar();

  .last-version {
    display: inline-block;
    color: #606266;
    font-size: 12px;
  }

  .config-btn {
    display: inline-block;
    margin-left: 10px;
    color: @themeColor;
    font-size: 12px;
    cursor: pointer;
  }

  .advanced-config {
    margin-bottom: 22px;
    margin-left: 160px;
    padding: 10px 20px;
    background: #fff;
    border-radius: 6px;

    .title {
      display: inline-block;
      margin-bottom: 5px;
      color: #303133;
      font-size: 14px;
    }

    .img-row {
      margin-bottom: 10px;

      .service-name {
        color: #606266;
        font-size: 13px;
        line-height: 30px;
      }
    }
  }

  /deep/.el-input,
  .el-textarea,
  .el-select {
    width: calc(~'100% - 200px');
  }

  /deep/.el-select > .el-input {
    width: 100%;
  }

  .desc {
    display: inline-block;
    margin-left: 10px;
    color: #606266;
    font-size: 12px;
  }
}
</style>
