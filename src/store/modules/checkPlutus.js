import * as types from '../mutations'
import { checkPlutusAPI } from '@api'
import router from '@/router/index.js'
import { plutusRoute } from '@/router/micro.js'

const state = {
  hasPlutus: false,
  plutusChecked: false
}

const mutations = {
  [types.SET_HAS_PLUTUS] (state, payload) {
    state.hasPlutus = payload
  },
  [types.SET_PLUTUS_CHECKED] (state, payload) {
    state.plutusChecked = payload
  }
}

const actions = {
  async checkPlutusStatus ({ commit }) {
    const res = await checkPlutusAPI().catch(err => { console.log(err) })
    if (res) {
      router.addRoutes(plutusRoute)
    }
    commit(types.SET_HAS_PLUTUS, !!res)
    commit(types.SET_PLUTUS_CHECKED, true)
  }
}

export default {
  state,
  mutations,
  actions
}
