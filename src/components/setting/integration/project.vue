<template>
  <div class="integration-project-container">
    <el-dialog
      :title="operateType==='add'?'添加项目管理系统':'编辑项目管理系统'"
      :close-on-click-modal="false"
      custom-class="edit-form-dialog"
      :visible.sync="dialogJiraAddFormVisible"
    >
      <el-form
        :model="params"
        @submit.native.prevent
        label-position="left"
        :rules="jiraRules"
        label-width="120px"
        class="mg-t32"
        ref="jiraEditForm"
      >
        <el-form-item label="类型" prop="type">
          <el-select v-model="params.type">
            <el-option label="飞书项目" value="lark" :disabled="isLarkDisabled"></el-option>
            <el-option label="Jira" value="list" :disabled="isJiraDisabled"></el-option>
          </el-select>
        </el-form-item>
        <div v-if="params.type==='list'">
          <el-form-item label="访问地址" prop="host">
            <el-input v-model.trim="params.host" placeholder="企业 Jira 地址" autofocus auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="用户名" prop="user">
            <el-input v-model="params.user" placeholder="有读写 Issue 权限的用户" autofocus auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="access_token">
            <el-input
              v-model="params.access_token"
              placeholder="用户密码"
              autofocus
              v-if="dialogJiraAddFormVisible"
              show-password
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </div>
        <div v-else>
          <el-form-item label="访问地址" prop="host">
            <el-input v-model.trim="params.host" placeholder="飞书项目访问地址" autofocus auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Plugin ID" prop="pluginID">
            <el-input v-model="params.pluginID" placeholder="飞书 Plugin ID" autofocus auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Plugin Secret" prop="pluginSecret">
            <el-input
              v-model="params.pluginSecret"
              placeholder="飞书 Plugin Secret"
              autofocus
              v-if="dialogJiraAddFormVisible"
              show-password
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
          <el-form-item label="User Key" prop="userKey">
            <el-input
              v-model="params.userKey"
              placeholder="飞书 user_key"
              autofocus
              v-if="dialogJiraAddFormVisible"
              show-password
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" native-type="submit" size="small" @click="updateJiraConfig()" class="start-create">确定</el-button>
        <el-button plain native-type="submit" size="small" @click="handleJiraCancel()">取消</el-button>
      </div>
    </el-dialog>
    <!--end of edit list dialog-->

    <div class="tab-container">
      <template>
        <el-alert type="info" :closable="false">
          <template>
            支持集成 Jira 和 飞书项目管理系统，详情可参考
            <el-link
              style="font-size: 14px; vertical-align: baseline;"
              type="primary"
              :href="`https://docs.koderover.com/zadig/settings/list/`"
              :underline="false"
              target="_blank"
            >帮助文档</el-link>。
          </template>
        </el-alert>
      </template>
      <div class="sync-container">
        <el-button v-if="!isJiraDisabled||!isLarkDisabled" size="small" type="primary" plain @click="handleJiraEdit('add',params)">添加</el-button>
      </div>
      <el-table :data="list" style="width: 100%;">
        <el-table-column label="访问地址">
          <template slot-scope="scope">{{scope.row.host}}</template>
        </el-table-column>
        <el-table-column label="最后更新">
          <template slot-scope="scope">{{scope.row.user}}</template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" plain @click="handleJiraEdit('edit',scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleJiraDelete" plain>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>
import { getJiraAPI, updateJiraAPI, deleteJiraAPI, createJiraAPI } from '@api'
const validateJiraURL = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入服务 URL，包含协议'))
  } else {
    if (value.endsWith('/')) {
      callback(new Error('URL 末尾不能包含 /'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      tabPosition: 'top',
      activeTab: '',
      operateType: 'add',
      list: [],
      params: {
        type: 'lark',
        host: '',
        user: '',
        access_token: ''
      },
      jiraRules: {
        user: {
          required: true,
          message: '请输入用户名',
          trigger: ['blur', 'change']
        },
        host: [
          {
            required: true,
            message: '请输入 Host',
            trigger: 'blur'
          },
          {
            required: true,
            validator: validateJiraURL,
            trigger: ['blur', 'change']
          }
        ],
        access_token: {
          required: true,
          message: '请输入密码',
          trigger: ['blur', 'change']
        },
        pluginID: {
          required: true,
          message: '请输入 Plugin ID',
          trigger: ['blur', 'change']
        },
        pluginSecret: {
          required: true,
          message: '请输入 Plugin Secret',
          trigger: ['blur', 'change']
        },
        userKey: {
          required: true,
          message: '请输入 User Key',
          trigger: ['blur', 'change']
        }
      },
      dialogJiraAddFormVisible: false
    }
  },
  computed: {
    isLarkDisabled () {
      return this.list.filter(item => item.type === 'lark').length > 0
    },
    isJiraDisabled () {
      return this.list.filter(item => item.type === 'jira').length > 0
    }
  },
  methods: {
    clearValidate (ref) {
      this.$refs[ref].clearValidate()
    },
    getJiraConfig () {
      const key = this.$utils.rsaEncrypt()
      getJiraAPI(key).then(res => {
        console.log(res)
        if (res) {
          res.access_token = this.$utils.aesDecrypt(res.access_token)
          this.$set(this.list, [0], res)
        } else {
          this.$set(this, 'list', [])
        }
      })
    },

    handleJiraEdit (type, row) {
      this.operateType = type
      this.dialogJiraAddFormVisible = true
      this.params = this.$utils.cloneObj(row)
    },
    handleJiraDelete () {
      this.$confirm(`确定要删除这个 Jira 配置吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteJiraAPI().then(res => {
          this.getJiraConfig()
          this.$message({
            message: '配置删除成功',
            type: 'success'
          })
        })
      })
    },
    updateJiraConfig () {
      this.$refs.jiraEditForm.validate(valid => {
        if (valid) {
          let params = {}
          if (this.params.type === 'lark') {
            params = {}
          } else {
            params = {
              host: this.params.host,
              user: this.params.user,
              access_token: this.params.access_token
            }
          }
          if (this.operateType === 'add') {
            createJiraAPI(params).then(res => {
              this.getJiraConfig()
              this.handleJiraCancel()
              this.$message({
                message: '配置添加成功',
                type: 'success'
              })
            })
          } else {
            updateJiraAPI(params).then(res => {
              this.getJiraConfig()
              this.handleJiraCancel()
              this.$message({
                message: '配置修改成功',
                type: 'success'
              })
            })
          }
        } else {
          return false
        }
      })
    },
    handleJiraCancel () {
      if (this.$refs.jiraAddForm) {
        this.$refs.jiraAddForm.resetFields()
        this.dialogJiraAddFormVisible = false
      }
      if (this.$refs.jiraEditForm) {
        this.$refs.jiraEditForm.resetFields()
        this.dialogJiraAddFormVisible = false
      }
    }
  },
  activated () {
    this.getJiraConfig()
  }
}
</script>

<style lang="less">
.integration-project-container {
  position: relative;
  flex: 1;
  overflow: auto;
  font-size: 13px;

  .tab-container {
    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;
    }
  }

  .text-success {
    color: rgb(82, 196, 26);
  }

  .text-failed {
    color: #ff1949;
  }

  .edit-form-dialog {
    width: 550px;

    .el-dialog__header {
      padding: 15px;
      text-align: center;
      border-bottom: 1px solid #e4e4e4;

      .el-dialog__close {
        font-size: 10px;
      }
    }

    .el-dialog__body {
      padding: 0 20px;
      color: #606266;
      font-size: 14px;

      .el-form-item {
        margin-bottom: 15px;
      }
    }

    .el-select {
      width: 100%;
    }

    .el-input {
      display: inline-block;
    }
  }
}
</style>
