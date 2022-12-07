<template>
  <div class="stage-operate">
    <el-form
      :model="form"
      :rules="rules"
      ref="ruleForm"
      :label-width="formLabelWidth"
      size="small"
      @keydown.enter.native="$emit('submitEvent')"
      @submit.native.prevent
    >
      <el-form-item label="阶段名称" prop="name">
        <el-input v-model="form.name" size="small"></el-input>
      </el-form-item>
      <el-form-item label="并发执行" prop="parallel">
        <el-switch v-model="form.parallel" size="small"></el-switch>
      </el-form-item>
      <el-form-item label="前置步骤"></el-form-item>
      <el-form-item label="人工审核" prop="approval.enabled" v-if="form.approval">
        <el-switch v-model="form.approval.enabled" size="small"></el-switch>
      </el-form-item>
      <div v-if="form.approval.enabled">
        <el-form-item label="超时时间" prop="approval.timeout">
          <el-input v-model.number="form.approval.timeout" size="small" type="number" :min="0">
            <span slot="suffix">分钟</span>
          </el-input>
        </el-form-item>
        <el-form-item label="审批方式" prop="approval.type">
          <el-radio-group v-model="form.approval.type">
            <el-radio label="native">zadig</el-radio>
            <el-radio label="lark">飞书</el-radio>
            <el-radio disabled>钉钉</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批应用" v-if="form.approval.type==='lark'">
          <el-select
            size="small"
            v-model="form.approval.approval_id"
            filterable
            remote
            reserve-keyword
            placeholder="审批应用"
            style="width: 100%;"
          >
            <el-option v-for="app in appList" :key="app.id" :value="app.id" :label="app.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="审核人" v-if="form.approval.type==='native'">
          <el-select
            size="small"
            v-model="form.approval.approve_users"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="请输入关键词"
            :remote-method="getUserList"
            :loading="loading"
            value-key="user_id"
            style="width: 100%;"
          >
            <el-option v-for="user in userList" :key="user.user_id" :value="user" :label="user.user_name">
              <span v-if="user.identity_type">
                <i class="iconfont" :class="'icon'+user.identity_type"></i>
                <span>{{user.user_name ? `${user.user_name}(${user.account})` : user.account}}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="需要审核人数" v-if="form.approval.type==='native'">
          <el-input v-model.number="form.approval.needed_approvers" type="number" :min="0" size="small"></el-input>
        </el-form-item>
        <el-form-item label="审核人" v-if="form.approval.type==='lark'">
          <el-button type="primary" plain @click="addApprovalUser" size="small">添加</el-button>
          <span v-for="item in users" :key="item.user_id">{{item.user_name}}</span>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.approval.description" placeholder="审核通过后才可继续执行" size="small"></el-input>
        </el-form-item>
      </div>
    </el-form>
    <el-dialog
      :visible.sync="isShowLarkTransferDialog"
      width="40%"
      :close-on-click-modal="false"
      :show-close="false"
      custom-class="approval-dialog"
      append-to-body
    >
      <el-breadcrumb separator-class="el-icon-arrow-right">
        <el-breadcrumb-item v-for="(item,index) in breadMenu" :key="item.id" @click.native="handleBreadMenuClick(item,index)">{{item.label}}</el-breadcrumb-item>
      </el-breadcrumb>
      <el-transfer
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-spinner="iconfont iconfont-loading iconvery-build"
        style=" display: inline-block; text-align: left;"
        v-model="form.approval.approve_users"
        filterable
        :left-default-checked="[]"
        :right-default-checked="[]"
        :titles="['选择审批人', '已选审批人']"
        :button-texts="['删除','添加']"
        :format="{
        noChecked: '${total}',
        hasChecked: '${checked}/${total}'
      }"
        :data="departmentList"
      >
        {{form.approval.approve_users}}
        <div slot-scope="{ option }" @click="handleClick(option)">
          <span v-if="option.avatar">
            <img :src="option.avatar" alt="avatar" style=" width: 16px; height: 16px; border-radius: 50%;" />
            <span>{{ option.name }}</span>
          </span>
          <span v-else style="position: relative; left: -24px; z-index: 2222; background: #fff;">1{{ option.name }}</span>
        </div>
      </el-transfer>
      <div slot="footer">
        <el-button @click="isShowLarkTransferDialog = false" size="small">取 消</el-button>
        <el-button type="primary" size="small" @click="saveApprovalUser">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getUsersAPI, getApprovalListAPI, getDepartmentAPI } from '@api'
import { cloneDeep } from 'lodash'

export default {
  name: 'StageOperate',
  data () {
    return {
      formLabelWidth: '135px',
      rules: {
        name: [
          {
            required: true,
            trigger: 'blur',
            validator: this.validateName,
            workflowInfo: this.workflowInfo
          }
        ]
      },
      appList: [],
      departmentList: [],
      departmentId: 'root',
      users: [],
      breadMenu: [{ label: 'root', id: 'root' }],
      isShowLarkTransferDialog: false,
      form: {
        name: '',
        parallel: true,
        approval: {
          enabled: false,
          approve_users: [],
          timeout: null,
          needed_approvers: null,
          description: '',
          type: 'native',
          approval_id: ''
        },
        jobs: []
      },
      loading: false
    }
  },
  props: {
    stageInfo: {
      type: Object,
      default: () => ({})
    },
    type: {
      type: String,
      default: 'add'
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    }
  },
  created () {
    this.getUserList()
    this.getAppList()
  },
  methods: {
    getUserList (val) {
      const payload = {
        page: 1,
        per_page: 20,
        name: val
      }
      this.loading = true
      getUsersAPI(payload).then(res => {
        this.userList = res.users.map(item => {
          const obj = {
            user_id: item.uid,
            user_name: item.name,
            account: item.account,
            identity_type: item.identity_type
          }
          return obj
        })
        this.loading = false
      })
    },
    getAppList () {
      getApprovalListAPI().then(res => {
        this.appList = res
      })
    },
    getDepartmentInfo () {
      this.loading = true
      getDepartmentAPI(this.form.approval.approval_id, this.departmentId).then(
        res => {
          this.departmentList = res.sub_department_list.concat(res.user_list)
          this.departmentList.forEach(item => {
            item.label = item.name
            item.key = item.id + ',' + item.name // 不能绑定对象 这里拼接成id+name
          })
          this.loading = false
        }
      )
    },
    addApprovalUser () {
      this.isShowLarkTransferDialog = true
      this.getDepartmentInfo()
    },
    handleClick (item) {
      if (!item.avatar) {
        this.departmentId = item.id
        this.breadMenu.push(item)
        this.getDepartmentInfo()
      }
    },
    handleBreadMenuClick (item, index) {
      this.departmentId = item.id
      if (index > 0) {
        this.breadMenu = this.breadMenu.slice(0, index)
      } else {
        this.breadMenu = [{ label: 'root', id: 'root' }]
      }
      this.getDepartmentInfo()
    },
    saveApprovalUser () {
      if (this.form.approval.type === 'lark') {
        this.form.approval.approve_users.forEach(item => {
          const obj = {}
          obj.user_id = item.split(',')[0]
          obj.user_name = item.split(',')[1]
          this.users.push(obj)
        })
      }
      this.isShowLarkTransferDialog = false
    },
    validateName (rule, value, callback) {
      const stageNames = rule.workflowInfo.stages.map(stage => stage.name)
      if (!value) {
        callback(new Error('请填写阶段名称'))
      } else if (this.type === 'add' && stageNames.includes(value)) {
        callback(new Error('阶段名称不能重复'))
      } else {
        callback()
      }
    },
    validate () {
      return this.$refs.ruleForm.validate()
    },
    reset () {
      this.form = {
        name: '',
        parallel: true,
        approval: {
          enabled: false,
          approve_users: [],
          timeout: null,
          needed_approvers: null,
          description: '',
          type: 'native'
        },
        jobs: []
      }
    },
    getData () {
      return this.form
    }
  },
  watch: {
    stageInfo: {
      handler (val) {
        if (this.type === 'edit') {
          this.form = cloneDeep(val)
        }
        if (val) {
          if (val.approval.type === 'lark') {
            this.form.approval.approval_id =
              val.approval.lark_approval.approval_id
            val.approval.lark_approval.approve_users.forEach(item => {
              item.user_name = item.name
              item.user_id = item.id
            })
            this.users = val.approval.lark_approval.approve_users
          }
        }
      },
      immediate: true
    },
    type (newVal, oldVal) {
      if (newVal === 'add') {
        this.reset()
      }
    }
  }
}
</script>
<style lang="less" scoped>
.stage-operate {
  .approval-dialog {
    .avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }
  }
}
</style>
