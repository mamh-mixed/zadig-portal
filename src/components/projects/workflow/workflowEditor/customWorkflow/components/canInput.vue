<template>
  <div class="can-input">
    <span v-if="!isCanInput">{{inputValue}}</span>
    <el-input
      v-else
      v-model="inputValue"
      type="text"
      size="mini"
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
  align-items: center;
  width: 100%;
  line-height: 50px;

  .icon {
    display: inline-block;
    margin-left: 8px;
  }
}
</style>
