<template>
  <el-dropdown @command="handleCommand($event,value)">
    <span class="el-dropdown-link">
      <i class="el-icon-edit-outline" v-if="!value || value === 'runtime'"></i>
      <i class="el-icon-lock" v-if="value === 'fixed'"></i>
      <i class="el-icon-crop" v-if="value === 'other'"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item command="runtime" v-if="isRuntime">
        <span class="icon el-icon-edit-outline"></span>
        运行时输入
      </el-dropdown-item>
      <el-dropdown-item command="fixed" v-if="isFixed">
        <span class="icon el-icon-lock"></span>
        固定值
      </el-dropdown-item>
      <el-dropdown-item command="other" v-if="isOther">
        <span class="icon el-icon-crop"></span>
        {{isService?'其他任务输出':'全局变量'}}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>
<script>
export default {
  components: {},
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    isFixed: {
      type: Boolean,
      default: false
    },
    isRuntime: {
      type: Boolean,
      default: false
    },
    isOther: {
      type: Boolean,
      default: false
    },
    isService: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleCommand (val, item) {
      item = val
      this.$emit('change', item)
    }
  }
}
</script>
