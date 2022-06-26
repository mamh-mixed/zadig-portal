<template>
  <div class="product-custom-detail">
    <Multipane layout="horizontal">
      <div class="stages">
        <i class="el-icon-video-play"></i>
        <div class="line"></div>
        <div class="stages-stage" v-for="(item,index) in payload.stages" :key="item.label">
          <div class="item" @click="setCurStage(index,item)">
            <Stage v-model="payload.stages[index]" :isShowJobAddBtn="false" :curJobIndex.sync="curJobIndex" />
          </div>
          <!-- <div class="line"></div> -->
        </div>
        <div class="line"></div>
        <i class="el-icon-video-pause"></i>
      </div>
      <MultipaneResizer class="multipane-resizer" v-if="isShowConsoleFooter&&activeName === 'ui'"></MultipaneResizer>
      <footer :style="{ minHeight: '350px'}" v-if="isShowConsoleFooter">
        <BuildConsole v-if="curJob.type === jobType.build" />
        <DeployConsole v-if="curJob.type=== jobType.deploy" />
      </footer>
    </Multipane>
  </div>
</template>
<script>
import { getCustomWorkfloweDetailAPI } from '@api'
import jsyaml from 'js-yaml'
import Stage from './workflowEditor/customWorkflow/stage.vue'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import BuildConsole from './productCustomDetail/buildConsole.vue'
import DeployConsole from './productCustomDetail/deployConsole.vue'
import { jobType } from './workflowEditor/customWorkflow/config'
export default {
  data () {
    return {
      jobType,
      isShowConsoleFooter: false,
      curJobIndex: 0,
      curJob: {},
      payload: {}
    }
  },
  components: {
    Stage,
    Multipane,
    MultipaneResizer,
    BuildConsole,
    DeployConsole
  },
  created () {
    this.getWorkflowDetail(this.$route.params.workflow_name)
  },
  methods: {
    getWorkflowDetail (workflow_name) {
      getCustomWorkfloweDetailAPI(workflow_name).then(res => {
        this.payload = jsyaml.load(res)
      })
    },
    setCurStage (index, item) {
      this.isShowConsoleFooter = true
      this.curJob = item.jobs[this.curJobIndex]
    }
  }
}
</script>
<style lang="less" scoped>
.product-custom-detail {
  width: 100%;
  height: 100%;
  padding: 24px;
  background: #fff;
  .stages {
    position: relative;
    display: flex;
    font-size: 40px;

    &-stage {
      display: flex;
      padding: 8px 16px;
      border: 1px dotted @borderGray;
    }

    .del {
      display: none;
      position: absolute;
      top: -6px;
      right: 6px;
      font-size: 24px;
    }

    .edit {
      position: absolute;
      top: 20px;
      right: 15%;
      font-size: 24px;
    }
    &:hover {
      .del {
        display: block;
      }
    }
  }
  .multipane-resizer {
    z-index: 10;
    cursor: row-resize;
  }

  .multipane-resizer::before {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    width: 100px;
    height: 8px;
    margin-left: -5.5px;
    background-color: #fff;
    border: 1px solid #dbdbdb;
    border-radius: 5px;
    content: '';
  }
  .line {
    width: 100px;
    height: 2px;
    margin-top: 24px;
    background: #000;
  }
}
</style>
