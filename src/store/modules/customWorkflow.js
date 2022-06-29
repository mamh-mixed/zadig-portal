import * as Mutation from '../mutations'
const state = {
  isShowFooter: false,
  workflowInfo: {}
}

const mutations = {
  [Mutation.SET_IS_SHOW_FOOTER] (state, payload) {
    state.isShowFooter = payload
  },
  [Mutation.SET_WORKFLOW_INFO] (state, payload) {
    state.workflowInfo = payload
  }
}
const actions = {
  setIsShowFooter ({ commit }, payload) {
    commit(Mutation.SET_IS_SHOW_FOOTER, payload)
  },
  setWorkflowInfo ({ commit }, payload) {
    commit(Mutation.SET_WORKFLOW_INFO, payload)
  }
}

export default {
  state,
  mutations,
  actions
}
