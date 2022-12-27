<template>
  <div class="integration-home">
    <div class="tab-container">
      <el-tabs @tab-click="changeTab" type="card" style="height: 200px;" v-model="currentTab">
        <el-tab-pane name="account" :label="$t(`sysSetting.integration.accountsTab`)">
          <keep-alive>
            <Account v-if="currentTab === 'account'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="project" :label="$t(`sysSetting.integration.projectTab`)">
          <keep-alive>
            <Project v-if="currentTab === 'project'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="code" :label="$t(`sysSetting.integration.gitProvidersTab`)">
          <keep-alive>
            <Code v-if="currentTab === 'code'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="jenkins" :label="$t(`sysSetting.integration.jenkinsTab`)">
          <keep-alive>
            <Jenkins v-if="currentTab === 'jenkins'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="sonar" :label="$t(`sysSetting.integration.sonarTab`)">
          <keep-alive>
            <Sonar v-if="currentTab === 'sonar'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="external" :label="$t(`sysSetting.integration.otherSystemTab`)">
          <keep-alive>
            <External v-if="currentTab === 'external'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="approval" :label="$t(`sysSetting.integration.approvalSystemTab`)" disabled>
          <span slot="label">
            <el-tooltip effect="dark" placement="top">
              <div slot="content">
                <span>{{ $t('global.enterprisefeaturesReferforDetails') }}</span>
                <el-link
                  style="font-size: 13px; vertical-align: baseline;"
                  type="primary"
                  href="https://docs.koderover.com/zadig/settings/approval/"
                  :underline="false"
                  target="_blank"
                >{{$t(`global.document`)}}</el-link>
              </div>
              <span>{{$t(`sysSetting.integration.approvalSystemTab`)}}</span>
            </el-tooltip>
          </span>
        </el-tab-pane>
        <el-tab-pane name="configs" :label="$t(`sysSetting.integration.configsTab`)" disabled>
          <span slot="label">
            <el-tooltip effect="dark" placement="top">
              <div slot="content">
                <span>{{ $t('global.enterprisefeaturesReferforDetails') }}</span>
                <el-link
                  style="font-size: 13px; vertical-align: baseline;"
                  type="primary"
                  href="https://docs.koderover.com/zadig/settings/configsystem/apollo/"
                  :underline="false"
                  target="_blank"
                >{{$t(`global.document`)}}</el-link>
              </div>
              <span>{{$t(`sysSetting.integration.configsTab`)}}</span>
            </el-tooltip>
          </span>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Account from './account.vue'
import Project from './project.vue'
import Code from './code.vue'
import Jenkins from './jenkins.vue'
import Sonar from './sonar.vue'
import External from './external.vue'

export default {
  name: 'integration',
  components: {
    Account,
    Project,
    Code,
    Jenkins,
    Sonar,
    External
  },
  data () {
    return {
      currentTab: 'account'
    }
  },
  methods: {
    showCurrentTab () {
      const currentTab = this.$route.query.currentTab
      if (currentTab) {
        this.currentTab = currentTab
      }
    },
    changeTab (detail) {
      this.$router.replace({
        path: '/v1/system/integration',
        query: { currentTab: detail.name }
      })
    }
  },
  mounted () {
    bus.$emit('set-topbar-title', {
      title: this.$t(`sidebarMenu.integration`),
      breadcrumb: []
    })
    this.showCurrentTab()
  }
}
</script>

<style lang="less" >
.integration-home {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 15px 30px;
  overflow: auto;

  .sync-container {
    padding-top: 15px;
    padding-bottom: 15px;

    .switch-span {
      display: inline-block;
      height: 20px;
      margin-right: 5px;
      margin-left: 10px;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      vertical-align: middle;
      transition: color 0.5s;
    }
  }
}
</style>
