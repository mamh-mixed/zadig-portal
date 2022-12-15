<template>
  <div class="variable-list">
    <div class="primary-title" style="margin-bottom: 0;">
      <span>{{ title }}</span>
      <i
        v-if="showTriggerBtn"
        style="margin-left: 10px; cursor: pointer;"
        :class="[showYaml ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"
        @click="showYaml = !showYaml"
      ></i>
    </div>
    <div class="content" v-show="showYaml">
      <Resize class="desc mirror" @sizeChange="$refs.codemirror.refresh()">
        <CodeMirror ref="codemirror" v-model="curYaml" showBorder />
      </Resize>
    </div>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import CodeMirror from '@/components/projects/common/codemirror.vue'
export default {
  props: {
    variables: Array,
    value: {
      default: '',
      type: String
    },
    title: {
      default: '',
      type: String
    },
    showTriggerBtn: {
      default: false,
      type: Boolean
    }
  },
  data () {
    return {
      showYaml: true
    }
  },
  computed: {
    curYaml: {
      get () {
        return this.yaml
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },
  components: {
    Resize,
    CodeMirror
  }
}
</script>

<style lang="less" scoped>
.variable-list {
  .content {
    width: 90%;
    max-width: 1000px;
    margin-top: 14px;
  }
}
</style>
