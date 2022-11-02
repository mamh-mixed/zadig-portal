<template>
  <div class="host-step-container">
    <div class="step-detail">
      <div class="guide-title">
        <h4>项目初始化向导</h4>
      </div>
      <OnboardingSteps :active="activeStep" class="steps-container" align-center simple finish-status="success">
        <OnboardingStep title="配置环境托管" description />
        <OnboardingStep title="配置服务构建" description />
        <OnboardingStep title="运行工作流" description />
      </OnboardingSteps>
    </div>
    <div class="title-container">
      <span class="first">{{stepMap[activeStep].title}}</span>
      <span class="second">{{stepMap[activeStep].description}}</span>
    </div>
  </div>
</template>
<script>
import OnboardingSteps from '@/common/steps/src/steps.vue'
import OnboardingStep from '@/common/steps/src/step.vue'
export default {
  data () {
    return {
      stepMap: [
        {
          title: '第一步',
          description: '托管已有 K8s 集群资源，选择服务在 Zadig 中进行管理'
        },
        {
          title: '第二步',
          description: '添加构建并配置相关脚本，后续可在工作流中自动更新服务'
        },
        {
          title: '第三步',
          description: '运行工作流触发服务的自动化交付'
        }
      ]
    }
  },
  props: {
    activeStep: {
      required: true,
      type: Number
    }
  },
  components: {
    OnboardingSteps,
    OnboardingStep
  }
}
</script>
<style lang="less">
.host-step-container {
  padding-top: 10px;

  .title-container {
    margin-bottom: 10px;
    margin-left: 20px;
    padding-top: 40px;

    .first {
      display: inline-block;
      width: 130px;
      padding: 8px;
      color: #fff;
      font-weight: 300;
      font-size: 16px;
      text-align: center;
      background: @themeColor;
    }

    .second {
      display: inline-block;
      color: #4c4c4c;
      font-size: 13px;
    }
  }

  .step-detail {
    width: 100%;

    .guide-title {
      display: flex;

      h4 {
        width: 130px;
        margin: 0 0 10px 20px;
        padding: 8px;
        color: #fff;
        font-weight: 300;
        font-size: 16px;
        text-align: center;
        background: @themeColor;
      }
    }
  }
}
</style>
