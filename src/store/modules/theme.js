import * as types from '../mutations'
import { getPreferenceSettingAPI, savePreferenceSettingAPI } from '@/api'

const state = {
  theme: 'light', // light/dark
  xtermTheme: {
    foreground: '#ffffff', // 字体
    background: '#000000' // 背景色
  }
}

const mutations = {
  [types.SET_PREFERENCE_SETTING] (state, payload) {
    state.xtermTheme = payload.xtermTheme
    state.theme = payload.theme
  }
}

const actions = {
  getPreferenceSetting ({ commit }, payload) {
    return getPreferenceSettingAPI().then(res => {
      commit(types.SET_PREFERENCE_SETTING, res)
    })
  },
  savePreferenceSetting ({ commit }, payload) {
    return savePreferenceSettingAPI(payload).then(res => {
      commit(types.SET_PREFERENCE_SETTING, payload)
    })
  }
}

export default {
  state,
  mutations,
  actions
}
