<template>
  <div class="job-deploy-detail">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">镜像分发</span>
        <span>{{jobInfo.name}}</span>
      </el-col>
      <el-col :span="2">
        <div class="item-desc">
          <a :class="buildOverallColor" href="#buildv4-log">{{jobInfo.status?buildOverallStatusZh:"未运行"}}</a>
        </div>
      </el-col>
      <el-col :span="2">
        <span class="item-desc">{{jobInfo.interval}}</span>
      </el-col>
      <el-col :span="1" class="close">
        <span @click="$emit('showFooter',false)">
          <i class="el-icon-close"></i>
        </span>
      </el-col>
    </header>
    <main>
      <div class="error-wrapper">
        <el-alert v-if="jobInfo.error" title="错误信息" :description="jobInfo.error" type="error" close-text="知道了"></el-alert>
      </div>
      <el-row class="item" :gutter="0" v-for="(build,index) in jobInfo.spec.distribute_target" :key="index">
        <el-col :span="4">
          <div class="item-title">服务名称</div>
        </el-col>
        <el-col :span="8">
          <span class="item-desc">{{build.service_name}}({{build.service_module}})</span>
        </el-col>
        <el-col :span="4">
          <div class="item-title">镜像信息</div>
        </el-col>
        <el-col :span="6">
          <el-tooltip effect="dark" :content="build.target_name" placement="top">
            <span class="file-name item-desc">{{ build.target_name.split('/')[2]}}</span>
          </el-tooltip>
        </el-col>
        <el-col :span="2">
          <span :class="buildOverallColor" v-if="build.status==='failed'|| build.status==='success'">{{ buildOverallStatusZh}}</span>
          <el-tooltip effect="dark" :content="build.error" placement="top" v-if="build.status==='failed'">
            <i class="el-icon-warning" :class="buildOverallColor"></i>
          </el-tooltip>
        </el-col>
      </el-row>
    </main>
  </div>
</template>

<script>
export default {
  data () {
    return {}
  },
  props: {
    jobInfo: {
      type: Object,
      default: () => ({})
    },

    projectName: {
      type: String,
      default: ''
    },
    taskId: {
      type: [String, Number],
      default: 1
    },
    workflowName: {
      type: String,
      default: ''
    }
  },

  computed: {
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.jobInfo, {})
    },
    buildOverallStatusZh () {
      return this.$translate.translateTaskStatus(this.buildOverallStatus)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  },
  methods: {
    adaptTaskDetail (detail) {
      detail.intervalSec =
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      detail.interval = this.$utils.timeFormat(detail.intervalSec)
    }
  },
  watch: {
    jobInfo: {
      handler (val, oldVal) {
        if (val) {
          this.adaptTaskDetail(val)
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.job-deploy-detail {
  position: relative;
  height: 100%;
  font-size: 14px;
  background: #fff;
  box-shadow: 1px 1px 14px rgba(0, 0, 0, 0.1);

  header {
    height: 42px;
    padding: 0 24px;
    line-height: 42px;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;

    .type {
      margin-right: 8px;
      font-weight: 500;
    }

    .close {
      float: right;
      font-size: 16px;
      cursor: pointer;
    }

    .status {
      color: #888;
    }
  }

  main {
    padding: 0 24px;

    .item {
      margin-top: 8px;

      &-title {
        color: #4a4a4a;
      }

      &-desc {
        color: #8d9199;
      }
    }

    .env-link {
      color: @themeColor;
    }
  }
}
</style>
