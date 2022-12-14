<template>
  <div class="preference-container">
    <el-form ref="form" :model="config" :rules="rules" label-width="120px" label-position="left" class="primary-form">
      <!-- <el-form-item label="界面颜色主题">
        <el-select v-model="config.theme" placeholder>
          <el-option v-for="item in themeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item> -->
      <el-form-item label="日志颜色">
        <div class="xterm-out">
          <Xterm ref="xterm" />
        </div>
        <div class="xterm-ope">
          <el-form-item label="背景颜色" prop="xtermTheme.background" :show-message="false">
            <el-color-picker v-model="config.xtermTheme.background"></el-color-picker>
            <el-input v-model="config.xtermTheme.background"></el-input>
          </el-form-item>
          <el-form-item label="字体颜色" prop="xtermTheme.foreground" :show-message="false">
            <el-color-picker v-model="config.xtermTheme.foreground"></el-color-picker>
            <el-input v-model="config.xtermTheme.foreground"></el-input>
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
import { debounce, cloneDeep } from 'lodash'

const validColor = (rule, value, callback) => {
  if (!value) {
    callback(new Error('不能为空'))
  } else if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    callback(new Error('颜色格式有误'))
  } else {
    callback()
  }
}

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
        xtermTheme: {
          background: '#000000',
          foreground: '#ffffff'
        }
      },
      rules: {
        'xtermTheme.background': [
          { required: true, validator: validColor, trigger: ['blur', 'change'] }
        ],
        'xtermTheme.foreground': [
          { required: true, validator: validColor, trigger: ['blur', 'change'] }
        ]
      }
    }
  },
  methods: {
    saveTheme () {
      this.$refs.form.validate().then(() => {
        this.$store.dispatch('savePreferenceSetting', this.config).then(() => {
          this.$message.success(`修改成功！`)
        })
      })
    }
  },
  watch: {
    'config.xtermTheme': {
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
  },
  mounted () {
    this.$store.dispatch('getPreferenceSetting').then(res => {
      this.config = cloneDeep(res)
    })
  }
}
</script>

<style lang="less" scoped>
.preference-container {
  position: relative;
  flex: 1;
  padding: 30px 30px;
  overflow: auto;

  .xterm-out {
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
