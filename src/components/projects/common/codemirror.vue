<template>
  <div class="codemirror-container" @keydown.meta.83.prevent="handleSave">
    <div class="yaml-desc" v-if="placeholder" v-show="!value">
      <pre>{{ placeholder }}</pre>
    </div>
    <codemirror class="codemirror" ref="cmEditor" :value="value" :options="options" @input="handleInput" />
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml'
import 'codemirror/mode/dockerfile/dockerfile'
import 'codemirror/theme/neo.css'
import { debounce } from 'lodash'
const options = {
  tabSize: 2,
  mode: 'text/yaml',
  theme: 'neo',
  lineNumbers: true,
  line: true
}
export default {
  data () {
    return {}
  },
  props: {
    value: {
      default: '',
      type: String
    },
    cmOption: {
      type: Object,
      default: () => {
        return {}
      }
    },
    placeholder: {
      type: String,
      default: ''
    }
  },
  computed: {
    options () {
      return Object.assign({}, options, this.cmOption)
    }
  },
  methods: {
    handleInput: debounce(function (code) {
      this.$emit('input', code)
    }, 200),
    handleSave (event) {
      this.$emit('saveValue', { event, value: this.value })
    },
    refresh () {
      this.$refs.cmEditor.codemirror.refresh()
    }
  },
  components: {
    codemirror
  },
  mounted () {
    this.$refs.cmEditor.codemirror.focus()
  }
}
</script>

<style lang="less" scoped>
.codemirror-container {
  position: relative;
  height: 100%;

  .yaml-desc {
    position: absolute;
    z-index: 1;
    padding: 4px 38px;
    color: #ccc;
    font-size: 14px;
    line-height: 20px;

    pre {
      margin: 0;
    }
  }

  .codemirror {
    height: calc(~'100% + 5px');
    margin: -5px;

    /deep/.CodeMirror {
      height: 100%;
      font-size: 14px;
    }

    /deep/.cm-s-neo .CodeMirror-linenumber {
      color: rgb(0, 108, 134);
    }

    /deep/.CodeMirror-sizer {
      padding: 0 10px;
    }
  }
}
</style>
