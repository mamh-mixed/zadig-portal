import Vue from 'vue'
import Vuex from 'vuex'

// Login
import login from './modules/login'

// global config
import globalConfig from './modules/globalConfig'

// Project
import projectList from './modules/projectList'

// Global Permission
import globalPermission from './modules/globalPermission'

// Project Permission
import projectPermission from './modules/projectPermission'

// Sidebar
import sidebarStatus from './modules/sidebarStatus'

// Service
import serviceManage from './modules/serviceManage'
import k8sService from './modules/k8sService'

// External Link
import externalLink from './modules/externalLink'

// Custom Workflow
import customWorkflow from './modules/customWorkflow'

// Plutus
import checkPlutus from './modules/checkPlutus'

// Preference
import theme from './modules/theme'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    login,
    globalConfig,
    projectList,
    globalPermission,
    projectPermission,
    sidebarStatus,
    serviceManage,
    k8sService,
    externalLink,
    customWorkflow,
    checkPlutus,
    theme
  },
  strict: debug
})
