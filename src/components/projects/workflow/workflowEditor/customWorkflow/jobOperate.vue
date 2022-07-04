<template>
  <div class="stage-operate">
    <el-form :model="jobInfo" v-if="jobTypeList.length > 0" :rules="rules" ref="ruleForm">
      <el-form-item label="选择 Job 类型" prop="type">
        <el-radio-group v-model="jobInfo.type" size="small">
          <el-tooltip
            v-for="item in jobTypeList"
            :key="item.name"
            placement="top-start"
            effect="dark"
            width="200"
            trigger="hover"
            :content="item.tip"
          >
            <el-radio :label="item.name" size="small" class="mg-r8 mg-b8" border  :disabled="!item.name">{{item.label}}</el-radio>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { jobTypeList } from './config'
export default {
  name: 'JobOperate',
  data () {
    return {
      jobTypeList,
      rules: {
        type: [{ required: true, message: '请选择 Job 类型', trigger: 'blur' }]
      }
    }
  },
  props: {
    value: {
      type: Object,
      default () {
        return { type: '' }
      }
    }
  },
  computed: {
    jobInfo: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },
  watch: {
    type: {
      handler (val) {
        this.jobInfo.type = val
        this.$emit('input', this.jobInfo)
      },
      deep: true
    }
  }
}
</script>
