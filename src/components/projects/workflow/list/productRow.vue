<template>
  <div class="product-workflow-row" @click="$router.push(workflowLink)">
    <div class="info-container">
      <span class="info-header">
        <div class="status" :class="recentTaskStatus">
          <span class="el-icon-success"></span>
        </div>
        <el-tag v-if="workflowInfo.workflow_type === 'common_workflow'" size="mini" effect="plain">自定义</el-tag>
        <div class="stages-container">
          <CusTags :values="stages" noBorder noLimit />
        </div>
      </span>
    </div>
    <div class="detail-container">
      <section @click.stop="setFavorite(projectName,name,type)" class="favorite el-icon-star-on" :class="{'liked':isFavorite}"></section>
      <section class="workflow-header" @click.stop>
        <div class="workflow-name">
          <router-link :to="workflowLink">
            <el-tooltip effect="dark" :content="displayName" placement="top">
              <span class="name-span">{{ displayName }}</span>
            </el-tooltip>
          </router-link>
          <!-- <el-tag v-if="type === 'common'" size="mini" effect="plain">通用</el-tag> -->
        </div>
        <div class="gray-desc">{{ description?description:'-' }}</div>
      </section>

      <section class="recent-success">
        <div class="gray-desc">
          最近成功
          <span style="display: inline-block; width: 80px;">
            <span v-if="recentSuccessID">{{$utils.convertTimestamp(workflowInfo.recentSuccessfulTask.create_time,'mm-dd-mm')}}</span>
          </span>
        </div>
        <div v-if="recentSuccessID" class="detail-desc">
          <i class="icon el-icon-user"></i>
          <span>{{workflowInfo.recentSuccessfulTask.task_creator}}</span>
          <router-link :to="recentFailLink" class="success">{{ recentSuccessID }}</router-link>
        </div>
        <div v-else class="detail-desc">
          <span>-</span>
        </div>
      </section>
      <section class="recent-failed">
        <div class="gray-desc">
          最近失败
          <span style="display: inline-block; width: 80px;">
            <span v-if="recentFailID">{{$utils.convertTimestamp(workflowInfo.recentFailedTask.create_time,'mm-dd-mm')}}</span>
          </span>
        </div>
        <div v-if="recentFailID" class="detail-desc">
          <i class="icon el-icon-user"></i>
          <span>{{workflowInfo.recentFailedTask.task_creator}}</span>
          <router-link :to="recentFailLink" class="failed">{{ recentFailID }}</router-link>
        </div>
        <div v-else class="detail-desc">
          <span>-</span>
        </div>
      </section>
      <section class="time-rate">
        <div class="gray-desc">平均执行时间</div>
        <div class="value">{{ avgRuntime || '-' }}</div>
      </section>
      <section class="time-rate">
        <div class="gray-desc">成功率</div>
        <div class="value">{{ avgSuccessRate || '-' }}</div>
      </section>
      <section class="operations" @click.stop>
        <slot name="operations"></slot>
      </section>
    </div>
  </div>
</template>

<script>
import { setFavoriteAPI, deleteFavoriteAPI } from '@api'
export default {
  data () {
    return {}
  },
  props: {
    workflowInfo: {
      type: Object,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },

    type: {
      type: String,
      required: true
    },

    isFavorite: {
      type: Boolean,
      required: true
    },

    name: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    stages: {
      type: Array,
      required: true
    },

    recentTaskStatus: {
      type: String,
      required: true
    },

    recentSuccessID: {
      type: String,
      required: true
    },

    recentSuccessLink: {
      type: String,
      required: true
    },
    recentFailID: {
      type: String,
      required: true
    },
    recentFailLink: {
      type: String,
      required: true
    },
    updateTime: {
      type: String,
      required: true
    },
    avgRuntime: {
      type: String,
      required: true
    },
    avgSuccessRate: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    }
  },
  computed: {
    workflowBelongToProject () {
      return this.$route.params.project_name
    },
    workflowLink () {
      return this.type === 'common_workflow'
        ? `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.name}?display_name=${this.displayName}`
        : `/v1/projects/detail/${this.projectName}/pipelines/multi/${this.name}?display_name=${this.displayName}`
    }
  },
  methods: {
    setFavorite (projectName, workflowName, type) {
      if (type === 'common_workflow') {
        this.$message.info('通用工作流暂不支持收藏！')
        return
      }
      const payload = {
        product_name: projectName,
        name: workflowName,
        type: type
      }
      if (this.isFavorite) {
        deleteFavoriteAPI(projectName, workflowName, type).then(res => {
          if (type === 'workflow') {
            // Refresh the workflow list
            this.$emit('refreshWorkflow', this.workflowBelongToProject)
          }
          this.$message({
            type: 'success',
            message: '取消收藏成功'
          })
        })
      } else {
        setFavoriteAPI(payload).then(res => {
          if (type === 'workflow') {
            // Refresh the workflow list
            this.$emit('refreshWorkflow', this.workflowBelongToProject)
          }
          this.$message({
            type: 'success',
            message: '添加收藏成功'
          })
        })
      }
    }
  }
}
</script>

<style lang="less">
.product-workflow-row {
  display: flex;
  flex-direction: column;

  .info-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .info-header {
      display: inline-flex;
      align-items: center;
      padding: 8px;
      background-color: #fff;
      border-radius: 4px 4px 0 0;

      .status {
        display: flex;
        margin-right: 10px;
        color: #77797d;

        &.running,
        &.elected {
          color: @themeColor;
          animation: blink 1.5s infinite;
        }

        &.passed,
        &.success {
          color: #67c23a;
        }

        &.failed,
        &.failure,
        &.timeout {
          color: #ff1949;
        }

        &.cancelled,
        &.terminated {
          color: #77797d;
        }
      }

      .stages-container {
        display: flex;
      }
    }
  }

  .detail-container {
    display: flex;
    flex-flow: row nowrap;
    flex-grow: 1;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    width: 100%;
    height: 70px;
    margin-bottom: 18px;
    overflow: auto;
    font-size: 14px;
    line-height: 22px;
    background: #fff;
    border-left: 0 solid #77797d;
    cursor: pointer;

    .detail-desc {
      margin-top: 4px;
      color: #4a4a4a;
      font-size: 12px;
      cursor: auto;
    }

    .gray-desc {
      color: @fontLightGray;
      font-size: 12px;
      line-height: 22px;
    }

    .favorite {
      display: inline-block;
      flex: 0 0 10px;
      margin: 0 10px;
      color: #ebebf0;
      font-size: 20px;
      text-align: center;
      cursor: pointer;

      &.liked,
      &:hover {
        color: @themeColor;
      }
    }

    .workflow-header {
      flex: 0 0 200px;
      max-width: 200px;
      cursor: auto;

      .workflow-name {
        display: flex;
        align-items: center;

        a {
          display: flex;
          color: @themeColor;
          font-weight: 500;

          .name-span {
            display: inline-block;
            max-width: 180px;
            margin-right: 8px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
      }
    }

    .desc {
      flex: 1 0 20%;
      color: @fontLightGray;
      font-size: 13px;
    }

    .time-rate {
      flex: 0 0 80px;
      margin-right: 20px;
      white-space: nowrap;

      .value {
        margin-top: 4px;
        color: #4a4a4a;
        line-height: 22px;
        cursor: auto;
      }
    }

    .recent-success {
      flex: 0 0 80px;
      white-space: nowrap;

      .detail-desc {
        .success {
          color: #06f;
        }
      }
    }

    .recent-failed {
      flex: 0 0 80px;
      white-space: nowrap;

      .detail-desc {
        .failed {
          color: #06f;
        }
      }
    }

    .operations {
      display: flex;
      flex: 0 0 200px;
      align-items: center;
      justify-content: space-around;
      font-size: 23px;
      cursor: auto;
    }
  }
}
</style>
