import * as Mutation from '../mutations'
export default {
  state: {
    k8sServiceInfo: {}
  },
  mutations: {
    [Mutation.QUERY_K8S_SERVICE] (state, payload) {
      state.k8sServiceInfo = payload
    }
  },
  actions: {
    queryk8sService ({ commit }, payload) {
      commit(Mutation.QUERY_K8S_SERVICE, payload)
    }
  }

}
