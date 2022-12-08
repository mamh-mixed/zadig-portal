<template>
  <div class="version-info">
    <el-form ref="infoRef" :rules="rules" :model="releaseInfo" label-width="90px" label-position="left">
      <el-form-item label="版本名称" prop="version">
        <el-input v-model="releaseInfo.version" placeholder="输入版本名称" size="small"></el-input>
      </el-form-item>
      <el-form-item label="版本标签" prop="labels">
        <el-input v-model="releaseInfo.labels" placeholder="输入版本标签，使用 ',' 分割" size="small"></el-input>
      </el-form-item>
      <el-form-item label="版本描述">
        <el-input type="textarea" v-model="releaseInfo.desc" placeholder="输入版本描述" :rows="4" size="small"></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  props: {
    releaseInfo: Object
  },
  data () {
    this.rules = {
      version: {
        required: true,
        message: '请填写版本名称',
        trigger: ['change', 'blur']
      }
    }
    return {}
  },
  methods: {
    validate () {
      return this.$refs.infoRef.validate()
    }
  }
}
</script>

<style lang="less" scoped>
.version-info {
  /deep/.el-input,
  .el-textarea,
  .el-select {
    width: calc(~'100% - 80px');
  }

  /deep/.el-select > .el-input {
    width: 100%;
  }
}
</style>
