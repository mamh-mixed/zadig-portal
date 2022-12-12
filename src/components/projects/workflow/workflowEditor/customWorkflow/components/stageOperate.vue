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
          <el-radio-group v-model="form.approval.type" @change="handleTypeChange">
            <el-radio label="native">zadig</el-radio>
            <el-radio label="lark" v-if="hasPlutus">飞书</el-radio>
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
            key="1"
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
          <el-button
            type="primary"
            plain
            @click="addApprovalUser"
            size="mini"
            :disabled="!form.approval.approval_id || appList.length === 0"
          >添加</el-button>
          <el-tooltip effect="dark" :content="approvalUsers" placement="top">
            <div>
              <span>{{ $utils.tailCut(approvalUsers,30) }}</span>
            </div>
          </el-tooltip>
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
      title="选择审批人"
      custom-class="approval-dialog"
      :append-to-body="true"
    >
      <div class="transfer mg-b24">
        <div class="left">
          <el-input placeholder="搜索" v-model="keyword" filterable size="small" style="  width: 90%;" @input="searchUser"></el-input>
          <div>
            <el-breadcrumb separator-class="el-icon-arrow-right" class="mg-t8 breadcrumb" v-if="breadMenu.length > 1">
              <el-breadcrumb-item
                v-for="(item,index) in breadMenu"
                :key="item.id"
                @click.native="handleBreadMenuClick(item,index)"
                style="cursor: pointer;"
              >{{item.name}}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="dep" v-for="(item,index) in departmentInfo.sub_department_list" :key="index" @click="handleClick(item)">
            <span>{{item.name}}</span>
            <span class="el-icon-arrow-right"></span>
          </div>
          <div class="user" v-for="(item,index) in departmentInfo.user_list" :key="index">
            <img :src="item.avatar" alt="avatar" class="user-avatar" />
            <el-checkbox v-model="item.checked" @change="setUser($event,item,index)">{{ item.name }}</el-checkbox>
          </div>
        </div>
        <div class="right">
          <div class="mg-b16">
            已选：
            {{form.approval.approve_users && form.approval.approve_users.length || 0}}人
          </div>
          <div v-for="(item,index) in form.approval.approve_users" :key="index">
            <div class="user">
              <div>
                <img :src="item.avatar" alt="avatar" class="user-avatar" />
                <span>{{ item.name }}</span>
              </div>
              <span class="el-icon-close" @click="delApprovalUser(item,index)"></span>
            </div>
          </div>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="cancelApproval" size="small">取 消</el-button>
        <el-button type="primary" size="small" @click="saveApprovalUser">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getUsersAPI, getApprovalListAPI, getDepartmentAPI } from '@api'
import { cloneDeep } from 'lodash'
import { mapState } from 'vuex'

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
      departmentInfo: {},
      departmentId: 'root',
      userList: [],
      breadMenu: [{ name: '联系人', id: 'root' }],
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
      originInfo: {},
      keyword: '',
      originUserList: [],
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
  computed: {
    approvalUsers () {
      let users = []
      if (this.form.approval.approve_users && this.form.approval.approve_users.length > 0) {
        users = this.form.approval.approve_users.map(item => item.name)
      }
      return users.toString()
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
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
    setUser (val, item, index) {
      if (val) {
        this.form.approval.approve_users.push(item)
      } else {
        this.form.approval.approve_users = this.form.approval.approve_users.filter(
          user => user.id !== item.id
        )
      }
    },
    searchUser (val) {
      this.departmentInfo.user_list = this.originUserList.filter(
        item => item.name.indexOf(val) > -1
      )
    },
    getAppList () {
      getApprovalListAPI().then(res => {
        this.appList = res
      })
    },
    getDepartmentInfo () {
      this.loading = true
      this.keyword = ''
      getDepartmentAPI(this.form.approval.approval_id, this.departmentId).then(
        res => {
          res.user_list.forEach(item => {
            if (this.form.approval.approve_users.length > 0) {
              const ids = this.form.approval.approve_users.map(item => item.id)
              if (ids.indexOf(item.id) > -1) {
                item.checked = true
              } else {
                item.checked = false
              }
            } else {
              item.checked = false
            }
          })
          this.originUserList = res.user_list
          this.departmentInfo = res
          this.loading = false
        }
      )
    },
    addApprovalUser () {
      this.isShowLarkTransferDialog = true
      this.getDepartmentInfo()
    },
    delApprovalUser (item, index) {
      this.form.approval.approve_users.splice(index, 1)
      this.getDepartmentInfo()
    },
    handleClick (item) {
      this.departmentId = item.id
      this.breadMenu.push(item)
      this.getDepartmentInfo()
    },
    handleBreadMenuClick (item, index) {
      this.departmentId = item.id
      if (index > 0) {
        this.breadMenu = this.breadMenu.slice(0, index + 1)
      } else {
        this.breadMenu = [{ name: '联系人', id: 'root' }]
      }
      this.getDepartmentInfo()
    },
    handleTypeChange (val) {
      this.form.approval.approve_users = []
    },
    saveApprovalUser () {
      this.isShowLarkTransferDialog = false
    },
    cancelApproval () {
      this.isShowLarkTransferDialog = false
      this.form = this.originInfo
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
        if (val) {
          if (this.type === 'edit') {
            this.form = cloneDeep(val)
            this.originInfo = cloneDeep(val)
          }
        }
      },
      immediate: true,
      deep: true
    },
    type (newVal, oldVal) {
      if (newVal === 'add') {
        this.reset()
      }
    }
  }
}
</script>
<style lang="less">
.approval-dialog {
  .avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  .transfer {
    display: flex;
    justify-content: space-between;
    padding: 0 16px;
    border: 1px solid #ddd;
    border-radius: 4px;

    .user {
      margin: 12px 0;
      cursor: pointer;

      &:hover {
        font-weight: 600;
      }

      &-avatar {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        vertical-align: -3px;
        border-radius: 50%;
      }
    }

    .left {
      width: 50%;
      padding: 16px 0;
      border-right: 1px solid #ddd;

      .breadcrumb {
        width: 90%;
        margin: 16px 0;
        padding: 4px 0;
        font-weight: 700;
        border-bottom: 1px solid #ddd;
        cursor: pointer;
      }

      .dep {
        display: flex;
        justify-content: space-between;
        width: 90%;
        margin: 12px 0;
        cursor: pointer;

        &:hover {
          font-weight: 600;
        }
      }
    }

    .right {
      width: 48%;
      padding: 16px 0;

      .user {
        display: flex;
        justify-content: space-between;
      }
    }
  }
}
</style>
