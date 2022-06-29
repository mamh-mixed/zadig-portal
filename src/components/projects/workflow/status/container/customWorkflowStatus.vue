<template>
  <div class="service-workflow-status-container">
    <div v-for="task in commonWorkflowTasks.running"
         :key="task.task_id"
         class="progress-header">
      <div class="progress-header-view">
        <div class="status-view">
          <div class="status running">
            正在运行
          </div>
        </div>
        <div class="info-view">
          <span class="spec">
            <span>
              <label>通用工作流 {{`#${task.task_id}`}}</label>
              <br>
              <router-link
                           :to="`/v1/projects/detail/${task.product_name}/pipelines/common/${task.pipeline_name}/${task.task_id}?status=${task.status}`">
                <span class="workflow-name"><i
                     class="el-icon-link"></i>{{$utils.tailCut(task.pipeline_name,25)}}</span>
              </router-link>
            </span>
          </span>
          <span class="stages-tag">
            <el-tag v-if="checkStage(task, 'buildv3')"
                    size=small
                    class="stage"
                    type="primary">构建</el-tag>
          </span>
          <section class="basic-info">
            <p class="author"><i class="el-icon-user"></i> {{task.task_creator}}</p>
            <p class="time"><i class="el-icon-time"></i>
              {{$utils.convertTimestamp(task.create_time)}} </p>
          </section>
        </div>
        <div class="operation-view">
          <span style="visibility: hidden;"
                class="icon el-icon-data-board view-detail"></span>
          <el-tooltip class="item"
                      effect="dark"
                      content="删除任务"
                      placement="top">
            <span @click="taskOperation('running','cancel',task.product_name,task.task_id,task.pipeline_name)"
                  class="icon el-icon-delete delete"></span>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div v-for="task in commonWorkflowTasks.pending"
         :key="task.task_id"
         class="progress-header">
      <div class="progress-header-view">
        <div class="status-view">
          <div class="status waiting">
            队列中
          </div>
        </div>
        <div class="info-view">
          <span class="spec">
            <span>
              <label>工作流 {{`#${task.task_id}`}}</label>
              <br>
              <router-link
                           :to="`/v1/projects/detail/${task.product_name}/pipelines/common/${task.pipeline_name}/${task.task_id}?status=${task.status}`">
                <span class="workflow-name"><i
                     class="el-icon-link"></i>{{$utils.tailCut(task.pipeline_name,25)}}</span>
              </router-link>
            </span>
          </span>
          <span class="stages-tag">
            <el-tag v-if="showStage(task.stages,'buildv2')"
                    size=small
                    class="stage"
                    type="primary">构建</el-tag>
            <el-tag v-if="showStage(task.stages,'trigger')"
                    size=small
                    class="stage"
                    type="primary">扩展</el-tag>
          </span>
          <section class="basic-info">
            <p class="author"><i class="el-icon-user"></i> {{task.task_creator}}</p>
            <p class="time"><i class="el-icon-time"></i>
              {{$utils.convertTimestamp(task.create_time)}} </p>
          </section>
        </div>
        <div class="operation-view">
          <span style="visibility: hidden;"
                class="icon el-icon-data-board view-detail"></span>
          <el-tooltip class="item"
                      effect="dark"
                      content="删除任务"
                      placement="top">
            <span @click="taskOperation('queue','cancel',task.product_name,task.task_id,task.pipeline_name)"
                  class="icon el-icon-delete delete"></span>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { cancelCommonWorkflowTaskAPI } from '@api'
export default {
  data () {
    return {

    }
  },
  methods: {
    checkStage (workflow, stageName) {
      let flag = false
      workflow.sub_tasks.forEach(task => {
        if (stageName === task.type && task.enabled) {
          flag = true
        }
      })
      return flag
    },
    /*
    task operation
    * @param  {string}           taskType（running，queue）
    * @param  {string}           operation （cancel，restart，delete）
    * @param  {string}           project name
    * @param  {number}           id: task id
    * @param  {string}           workflowName
    * @return {}
    */
    taskOperation (taskType, operation, projectName, id, workflowName) {
      if (taskType === 'running') {
        switch (operation) {
          case 'cancel':
            cancelCommonWorkflowTaskAPI(projectName, workflowName, id).then(res => {
              this.$notify({
                title: '成功',
                message: '运行任务取消成功',
                type: 'success',
                offset: 50
              })
            })
            break
          default:
            break
        }
      } else if (taskType === 'queue') {
        switch (operation) {
          case 'cancel':
            cancelCommonWorkflowTaskAPI(projectName, workflowName, id).then(res => {
              this.$notify({
                title: '成功',
                message: '队列任务取消成功',
                type: 'success',
                offset: 50
              })
            })
            break
          case 'restart':
            break
          case 'delete':
            break
          default:
            break
        }
      }
    },
    showStage (stages, stage_name) {
      let flag = false
      stages.forEach(stage => {
        if (stage_name === stage.type) {
          flag = true
        }
      })
      return flag
    }
  },
  props: {
    commonWorkflowTasks: {
      type: Object,
      required: true
    }

  }
}
</script>
<style lang="less">
.service-workflow-status-container {
  position: relative;
  margin-right: 0;
  margin-left: 0;

  .progress-header {
    margin-bottom: 8px;
    box-shadow: 1px 0 10px -5px rgba(0, 0, 0, 0.3);

    .progress-header-view {
      display: flex;
      min-height: 60px;
      margin-top: 0;
      margin-bottom: 0;
      padding: 10px 13px 10px 13px;
      font-size: 14px;
      list-style: none;
      background: #fff;
      border-bottom: 1px solid #eaeaea;

      .status-view {
        flex-basis: 160px;
        flex-grow: 0;
        flex-shrink: 0;

        .status {
          position: relative;
          bottom: -10px;
          width: 114px;
          height: 31px;
          margin-right: 8px;
          margin-left: 15px;
          padding-right: 15px;
          padding-left: 15px;
          color: #fff;
          font-weight: bold;
          font-size: 13px;
          line-height: 30px;
          text-align: center;
          border-radius: 50px;
          transition: width 100ms ease;

          &.failed {
            background-color: #ff1949;
          }

          &.running {
            background-color: @themeColor;
          }

          &.waiting {
            background-color: #606266;
          }
        }
      }

      .operation-view {
        display: flex;
        align-content: center;
        align-items: center;
        justify-content: flex-end;

        span {
          margin-right: 25px;
          font-size: 20px;
        }

        .icon {
          cursor: pointer;

          &.delete {
            color: #ff1949;
          }

          &.view-detail {
            color: @themeColor;
          }
        }
      }

      .info-view {
        display: flex;
        flex: 1 1 auto;
        width: calc(100% - 600px);
        padding-right: 18px;
        padding-left: 20px;

        .spec {
          display: flex;
          align-items: center;
          width: 100%;

          span {
            max-width: 45%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;

            label {
              color: #a3a3a3;
              font-weight: bold;
              font-size: 14px;
              line-height: 18px;
            }

            .workflow-name {
              color: @themeColor;
              font-size: 16px;
              line-height: 16px;
            }
          }
        }

        .stages-tag {
          display: flex;
          align-items: center;
          width: 100%;

          .stage {
            margin-right: 10px;
          }
        }

        .basic-info {
          position: relative;
          flex: 0 0 19%;
          align-items: center;

          .time,
          .author {
            margin: 6px 0;
            color: #666;
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>
