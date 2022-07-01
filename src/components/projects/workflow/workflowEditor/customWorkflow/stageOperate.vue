<template>
  <div class="stage-operate">
    <el-form :model="form" :rules="rules" ref="ruleForm" :label-width="formLabelWidth">
      <el-form-item label="Stage 名称" prop="name">
        <el-input v-model="form.name" size="small"></el-input>
      </el-form-item>
      <el-form-item label="并发执行">
        <el-switch v-model="form.parallel"></el-switch>
      </el-form-item>
      <div>前置步骤</div>
      <el-form-item label="人工审核">
        <el-switch v-model="form.approval.enabled"></el-switch>
      </el-form-item>
      <div v-if="form.approval.enabled">
        <el-form-item label="超时时间">
          <el-input v-model="form.approval.timeout" size="small" type="number"></el-input>
        </el-form-item>
        <el-form-item label="审核人">
          <el-select size="small" v-model="form.approval.approve_users" multiple value-key="user_id">
            <el-option v-for="user in userList" :key="user.user_id" :value="user" :label="user.user_name">{{user.user_name}}</el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="需要审核人数">
          <el-input v-model="form.approval.needed_approvers" type="number"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.approval.description" placeholder="审核通过后才可继续执行"></el-input>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script>
import { getUsersAPI } from '@api'
import { cloneDeep } from 'lodash'

export default {
  name: 'StageOperate',
  data () {
    const validateName = (rule, value, callback) => {
      if (!/^[A-Za-z0-9\u4e00-\u9fa5]{1,16}$/.test(value)) {
        callback(new Error('支持中文和大小写英文字母，字节长度小于 16 位'))
      } else {
        callback()
      }
    }
    return {
      formLabelWidth: '120px',
      rules: {
        name: [
          { required: true, message: 'Stage 名称', trigger: 'blur' },
          {
            validator: validateName,
            trigger: ['blur', 'change']
          }
        ]
      },
      userList: [],
      form: {
        name: '',
        parallel: false,
        approval: {
          enabled: false,
          approve_users: [],
          timeout: null,
          needed_approvers: null,
          description: ''
        },
        jobs: []
      }
    }
  },
  props: {
    stageInfo: {
      type: Object,
      default: () => ({})
    }
  },
  created () {
    this.getUserList()
  },
  methods: {
    getUserList () {
      const payload = {
        page: 1,
        per_page: 50,
        name: ''
      }
      getUsersAPI(payload).then(res => {
        this.userList = res.users.map(item => {
          const obj = {
            user_id: item.uid,
            user_name: item.name
          }
          return obj
        })
        console.log(this.userList)
      })
    },
    validate () {
      return this.$refs.ruleForm.validate()
    },
    reset () {
      this.$refs.ruleForm.resetFields()
    },
    getData () {
      return this.form
    }
  },
  watch: {
    stageInfo: {
      handler (val) {
        this.form = cloneDeep(val)
      }
    }
  }
}
</script>
