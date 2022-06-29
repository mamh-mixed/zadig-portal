<template>
  <div class="stage-operate">
    <el-form :model="form" :rules="rules" ref="ruleForm" :label-width="formLabelWidth">
      <el-form-item label="Stage 名称" prop="name">
        <el-input v-model="form.name" size="small"></el-input>
      </el-form-item>
      <el-form-item label="并发执行">
        <el-switch v-model="form.parallel"></el-switch>
      </el-form-item>
      <!-- <div>前置步骤</div>
      <el-form-item label="人工审核">
        <el-switch v-model="form.approval.enabled"></el-switch>
      </el-form-item>
      <el-form-item label="超时时间">
        <el-switch v-model="form.approval.timeout"></el-switch>
      </el-form-item>
      <el-form-item label="审核人">
        <el-switch v-model="form.approval.enabled"></el-switch>
      </el-form-item>
      <el-form-item label="需要审核人数">
        <el-input v-model="form.approval.neededApprovers"></el-input>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.approval.description" placeholder="审核通过后才可继续执行"></el-input>
      </el-form-item>-->
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'StageOperate',
  data () {
    return {
      formLabelWidth: '100px',
      rules: {
        name: [
          { required: true, message: 'Stage 名称', trigger: 'blur' },
          { min: 1, max: 16, message: '长度在 1 到 16 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  props: {
    value: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    form: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },

  methods: {}
}
</script>
