import * as types from '../mutations'

const state = {
  plugins: []
}

const mutations = {
  [types.SET_SYSTEM_PLUGINS] (state, payload) {
    state.plugins = payload
  }
}

const actions = {
  async getPluginList ({ commit }, payload) {
    commit(Mutation.SET_SYSTEM_PLUGINS)
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
