<template>
  <div class="can-input">
    <el-input
      v-model="inputValue"
      type="text"
      size="small"
      :placeholder="placeholder"
      @focus="handleInput(true)"
      @blur="handleInput(false)"
      :style="{width: width}"
    ></el-input>
    <i class="icon el-icon-edit" @click="handleInput(true)" v-show="!isCanInput"></i>
  </div>
</template>

<script>
export default {
  name: 'CanInput',
  data () {
    return {
      isCanInput: false
    }
  },
  props: {
    placeholder: {
      type: String,
      default: '请输入'
    },
    width: {
      type: String,
      default: '200px'
    },
    value: {
      type: String,
      default: ''
    }
  },
  computed: {
    inputValue: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {
    handleInput (val) {
      this.isCanInput = val
    }
  }
}
</script>

<style lang="less" scoped>
.can-input {
  display: flex;
  width: 100%;

  .icon {
    display: inline-block;
    width: 20px;
    height: 32px;
    line-height: 32px;
  }
}
</style>
