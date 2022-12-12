<template>
  <div class="preference-container">
    <el-form ref="form" :model="config" label-width="120px" label-position="left" class="primary-form">
      <el-form-item label="界面颜色主题">
        <el-select v-model="config.theme" placeholder>
          <el-option v-for="item in themeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="日志颜色">
        <div class="xterm">
          <Xterm ref="xterm" />
        </div>
        <div class="xterm-ope">
          <el-form-item label="背景颜色" prop="log.background" required :show-message="false">
            <el-color-picker v-model="config.log.background"></el-color-picker>
            <el-input v-model="config.log.background" @input="config.log.background=$event.replace(/^([#0-9a-f]{7})(.*)$/, '$1')"></el-input>
          </el-form-item>
          <el-form-item label="字体颜色" prop="log.foreground" required :show-message="false">
            <el-color-picker v-model="config.log.foreground"></el-color-picker>
            <el-input v-model="config.log.foreground" @input="config.log.foreground=$event.replace(/^([#0-9a-f]{7})(.*)$/, '$1')"></el-input>
          </el-form-item>
        </div>
      </el-form-item>
    </el-form>
    <div class="bottom">
      <el-button type="primary" size="small" @click="saveTheme">保存更改</el-button>
    </div>
  </div>
</template>

<script>
import Xterm from './common/xterm.vue'
import { debounce } from 'lodash'
export default {
  data () {
    this.themeOptions = [
      {
        label: '默认主题',
        value: 'light'
      },
      {
        label: '深色主题',
        value: 'dark'
      }
    ]
    return {
      config: {
        theme: 'light',
        log: {
          background: '#000000',
          foreground: '#ffffff'
        }
      }
    }
  },
  methods: {
    saveTheme () {
      this.$refs.form.validate().then(() => {

      })
    }
  },
  watch: {
    'config.log': {
      handler: debounce(function (val) {
        const fLen = val.foreground.length
        const bLen = val.background.length
        if ((fLen === 4 || fLen === 7) && (bLen === 4 || bLen === 7)) {
          this.$refs.xterm.setTheme({
            foreground: val.foreground,
            background: val.background
          })
        }
      }, 200),
      deep: true
    }
  },
  components: {
    Xterm
  }
}
</script>

<style lang="less" scoped>
.preference-container {
  position: relative;
  flex: 1;
  padding: 30px 30px;
  overflow: auto;

  .xterm {
    width: 700px;
    margin: 10px 0;
  }

  .xterm-ope {
    /deep/.el-form-item__content {
      display: flex;
    }
  }

  .bottom {
    margin-top: 60px;
  }
}
</style>
