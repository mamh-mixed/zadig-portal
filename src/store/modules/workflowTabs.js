import * as Mutation from '../mutations'
const state = {
  projectTabMap: {}
}

const getters = {
  curTab: (state) => (projectName) => {
    return state.projectTabMap[projectName] || ''
  }
}

const mutations = {
  [Mutation.SET_CURRENT_TAB] (state, { projectName, tabName }) {
    state.projectTabMap[projectName] = tabName || ''
  }
}

export default {
  state,
  getters,
  mutations
}
