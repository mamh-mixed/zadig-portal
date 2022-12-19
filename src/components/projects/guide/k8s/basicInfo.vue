<template>
  <div class="projects-guide-info-container">
    <div class="guide-container">
      <Step :activeStep="0"/>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">第一步</span>
          <span class="second">对项目的流程做初步定义后，后续可在项目中进行调整。当您创建好服务后，我们会为您做如下的智能交付准备。Zadig
            会自动生成以下资源：</span>
        </div>
        <div class="block-list">
          <div class="info-block">
            <div class="info-block-item">
              <div class="info-block-item-card">
                <div class="integration-card__image">
                  <el-button type="success"
                             icon="el-icon-check"
                             circle></el-button>
                </div>
                <div class="integration-card__info">
                  <div class="card-title">2 套测试环境</div>
                  <div class="card-desc">dev, qa
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="info-block">
            <div class="info-block-item">
              <div class="info-block-item-card">
                <div class="integration-card__image">
                  <el-button type="success"
                             icon="el-icon-check"
                             circle></el-button>
                </div>
                <div class="integration-card__info">
                  <div class="card-title">3 条工作流</div>
                  <div class="card-desc">
                    {{projectName}}-workflow-dev ,
                    {{projectName}}-workflow-qa ,
                    {{projectName}}-ops-workflow
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="controls__wrap">
      <div class="controls__right">
        <router-link :to="`/v1/projects/create/${projectName}/k8s/service?rightbar=help`">
          <el-button size="small" type="primary">下一步</el-button>
        </router-link>
        <el-button size="small" type="primary"
                @click="exitOnboarding">
          <i v-if="exitLoading"
             class="el-icon-loading"></i>
          <span>跳过向导</span>
        </el-button>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Step from '../common/step.vue'
export default {
  data () {
    return {
      showGuideText: true,
      exitLoading: false
    }
  },
  methods: {
    exitOnboarding () {
      this.exitLoading = true
      this.saveOnboardingStatus(this.projectName, 0).then((res) => {
        this.$router.push(`/v1/projects/detail/${this.projectName}/detail`)
      }).catch(() => {
        this.exitLoading = false
      })
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' }, { title: this.projectName, isProjectName: true, url: '' }] })
  },
  components: {
    Step
  },
  onboardingStatus: 1
}
</script>

<style lang="less" scoped>
@import "~@assets/css/component/onboarding-basicInfo.less";
</style>
