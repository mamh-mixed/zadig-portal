<template>
  <div class="workflow-template-container">
    <div class="wrap">
      <el-tabs v-model="activeName" type="card" @tab-click="handleClick">
        <el-tab-pane label="自定义工作流" name="custom"></el-tab-pane>
        <el-tab-pane label="发布工作流" name="release"></el-tab-pane>
        <div v-if="modelList.length>0">
          <div v-for="item in modelList" :key="item.name">
            <Item :modelInfo="item" @success="getModelList(activeName)" />
          </div>
        </div>
        <div v-else class="empty">
          <img src="@assets/icons/illustration/workflow.svg" alt />
          <p>暂无可展示的工作流模版</p>
        </div>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import Item from './item.vue'
import { getWorkflowTemplateListAPI } from '@api'

export default {
  data () {
    return {
      activeName: 'custom',
      modelList: [
        {
          name: 'qwerty',
          display_name: '34',
          projectName: 'ceshi',
          updateTime: 1667462795,
          createTime: 1665567662,
          updateBy: 'admin',
          schedulerEnabled: false,
          enabledStages: ['build'],
          isFavorite: false,
          workflow_type: '',
          averageExecutionTime: 87.94736842105263,
          successRate: 0.02631578947368421,
          base_name: '',
          base_refs: []
        },
        {
          name: 'test-testting',
          display_name: 'test-testting',
          projectName: 'ceshi',
          updateTime: 1667461899,
          createTime: 1665719483,
          updateBy: 'admin',
          schedulerEnabled: false,
          enabledStages: ['test'],
          isFavorite: false,
          workflow_type: '',
          recentTask: {
            taskID: 7,
            pipelineName: 'test-testting',
            status: 'failed',
            task_creator: 'admin',
            create_time: 1665732800
          },
          recentSuccessfulTask: {
            taskID: 6,
            pipelineName: 'test-testting',
            status: 'passed',
            task_creator: 'admin',
            create_time: 1665729881
          },
          recentFailedTask: {
            taskID: 7,
            pipelineName: 'test-testting',
            status: 'failed',
            task_creator: 'admin',
            create_time: 1665732800
          },
          averageExecutionTime: 62.42857142857143,
          successRate: 0.14285714285714285,
          base_name: '',
          base_refs: []
        }
      ]
    }
  },
  components: { Item },
  created () {
    this.getModelList(this.activeName)
  },
  methods: {
    handleClick () {
      this.getModelList(this.activeName)
    },

    getModelList (val) {
      const type = val === 'custom' ? '' : 'release'
      getWorkflowTemplateListAPI(type).then(res => {
        this.modelList = res
      })
    }
  }
}
</script>

<style lang="less" scoped>
.workflow-template-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-top: 16px;
  padding: 0 10px;
  overflow: hidden;

  // background-color: @globalBackgroundColor;
  .wrap {
    width: 100%;
    height: 100%;

    .empty {
      display: flex;
      flex-direction: column;
      align-content: center;
      align-items: center;
      justify-content: center;

      img {
        width: 400px;
        height: 400px;
      }

      p {
        color: #606266;
        font-size: 15px;
      }
    }
  }
}
</style>
