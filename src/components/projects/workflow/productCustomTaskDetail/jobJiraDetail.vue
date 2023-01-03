<template>
  <div class="job-jira-detail">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">JIRA 问题状态变更:</span>
        <el-tooltip effect="dark" placement="top" :content="jobInfo.name">
          <span>{{$utils.tailCut(jobInfo.name, 20)}}</span>
        </el-tooltip>
      </el-col>
      <el-col :span="2">
        <a
          :class="buildOverallColor"
          href="#buildv4-log"
        >{{jobInfo.status?$t(`workflowTaskStatus.${jobInfo.status}`):$t(`workflowTaskStatus.notRunning`)}}</a>
      </el-col>
      <el-col :span="2">
        <span>{{$utils.timeFormat(jobInfo.end_time - jobInfo.start_time)}}</span>
      </el-col>
      <el-col :span="1" class="close">
        <span @click="$emit('showFooter',false)">
          <i class="el-icon-close"></i>
        </span>
      </el-col>
    </header>
    <main>
      <section>
        <div class="error-wrapper mg-t8 mg-b8">
          <el-alert
            v-if="jobInfo.error"
            :title="$t(`global.errorMsg`)"
            :description="jobInfo.error"
            type="error"
            :close-text="$t(`global.ok`)"
          ></el-alert>
          <el-row class="item">
            <el-col :span="4">
              <div class="item-title">项目</div>
            </el-col>
            <el-col :span="8">
              <div class="item-desc">{{jobInfo.spec.project_id}}</div>
            </el-col>
            <el-col :span="4">
              <div class="item-title">问题类型</div>
            </el-col>
            <el-col :span="8">
              <div class="item-desc">{{jobInfo.spec.issue_type}}</div>
            </el-col>
          </el-row>
          <el-row class="item">
            <el-col :span="4">
              <div class="item-title">目标状态</div>
            </el-col>
            <el-col :span="8">
              <div class="item-desc">{{jobInfo.spec.target_status}}</div>
            </el-col>
          </el-row>
          <el-table :data="jobInfo.spec.issues" class="mg-t8">
            <el-table-column label="关键字" prop="key">
              <template slot-scope="scope">
                <span class="link" @click="jumpLink(scope.row.link)">
                  <span>{{scope.row.key}}</span>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="概要" prop="name"></el-table-column>
            <el-table-column label="状态" prop="status"></el-table-column>
          </el-table>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  data () {
    return {
      isShowDetail: false,
      curItem: {}
    }
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
      return this.$t(`workflowTaskStatus.${this.buildOverallStatus}`)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  },
  methods: {
    showDetail (item) {
      this.isShowDetail = true
      this.curItem = item
    },
    jumpLink (link) {
      console.log(111)
      window.open(link, '_blank')
    }
  }
}
</script>
<style lang="less" scoped>
@themeColor: #0066ff;

.job-jira-detail {
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
        color: #8d9199;
      }

      &-desc {
        color: #4a4a4a;
      }
    }

    .link {
      color: @themeColor;
      cursor: pointer;
    }
  }
}
</style>
