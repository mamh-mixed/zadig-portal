<template>
  <div class="integration-project-container">
    <el-dialog
      :title="operateType==='add'?'添加项目管理系统':'编辑项目管理系统'"
      :close-on-click-modal="false"
      custom-class="edit-form-dialog"
      :visible.sync="dialogJiraAddFormVisible"
    >
      <el-alert class="mg-t8 mg-b8" v-if="checkRes === 'fail'&&errorMessage" :title="errorMessage" type="error" :closable="false" show-icon></el-alert>
      <el-form :model="params" @submit.native.prevent label-position="left" :rules="jiraRules" label-width="120px" ref="form">
        <el-form-item label="系统类型" prop="type">
          <el-select v-model="params.type" :disabled="operateType==='edit'">
            <el-option label="飞书项目" value="lark" disabled>
              <el-tooltip effect="dark" placement="top">
                <div slot="content">
                  <span>{{ $t('global.enterprisefeaturesReferforDetails') }}</span>
                  <el-link
                    style="font-size: 13px; vertical-align: baseline;"
                    type="primary"
                    href="https://docs.koderover.com/settings/lark/"
                    :underline="false"
                    target="_blank"
                  >{{$t(`global.document`)}}</el-link>
                </div>
                <span>
                  <img src="@assets/icons/others/lark.png" alt="lark" style="width: 20px; height: 20px; vertical-align: text-bottom;" />
                  <span>飞书项目</span>
                  <i class="el-icon-warning"></i>
                </span>
              </el-tooltip>
            </el-option>
            <el-option label="Jira" value="jira" :disabled="isJiraDisabled">
              <i class="config-icon iconfont iconjira"></i>
              <span>Jira</span>
            </el-option>
          </el-select>
        </el-form-item>
        <div v-if="params.type==='jira'">
          <el-form-item label="访问地址" prop="jira_host">
            <el-input v-model.trim="params.jira_host" placeholder="Jira 访问地址" autofocus auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="用户名" prop="jira_user">
            <el-input v-model="params.jira_user" placeholder="有 issue 读写权限的用户名" autofocus auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="密码/Token" prop="jira_token">
            <el-input
              v-model="params.jira_token"
              placeholder="用户密码/Access Token"
              autofocus
              v-if="dialogJiraAddFormVisible"
              show-password
              @blur="validate"
              :suffix-icon="showCheckIcon"
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
        <el-table-column label="访问地址" prop="jira_host"></el-table-column>
        <el-table-column label="最后更新">
          <template slot-scope="scope">{{ $utils.convertTimestamp(scope.row.updated_at)}}</template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" plain @click="handleJiraEdit('edit',scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleJiraDelete(scope.row)" plain>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>
import {
  getProjectManage,
  updateProjectManage,
  deleteProjectManage,
  createProjectManage,
  checkProjectManage
} from '@api'
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
        type: 'jira',
        jira_host: '',
        jira_user: '',
        jira__token: ''
      },
      jiraRules: {
        jira_user: {
          required: true,
          message: '请输入用户名',
          trigger: ['blur', 'change']
        },
        jira_host: [
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
        jira_token: {
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
      dialogJiraAddFormVisible: false,
      checkRes: '',
      errorMessage: ''
    }
  },
  computed: {
    isLarkDisabled () {
      return this.list.filter(item => item.type === 'lark').length > 0
    },
    isJiraDisabled () {
      return this.list.filter(item => item.type === 'jira').length > 0
    },
    showCheckIcon () {
      if (this.checkRes === 'pass') {
        return 'el-icon-success'
      } else if (this.checkRes === 'fail') {
        return 'el-icon-error'
      } else {
        return ''
      }
    }
  },
  methods: {
    validate () {
      const { type, jira_host, jira_user, jira_token } = this.params
      const params = { type, jira_host, jira_user, jira_token }
      checkProjectManage(params)
        .then(res => {
          if (res && res.message === 'success') {
            this.checkRes = 'pass'
          }
        })
        .catch(error => {
          this.checkRes = 'fail'
          this.errorMessage = error.response.data.message
        })
    },
    clearValidate (ref) {
      this.$refs[ref].clearValidate()
    },
    getJiraConfig () {
      const key = this.$utils.rsaEncrypt()
      getProjectManage(key).then(res => {
        console.log(res)
        this.list = res
        // if (res) {
        //   res.access_token = this.$utils.aesDecrypt(res.access_token)
        //   this.$set(this.list, [0], res)
        // } else {
        //   this.$set(this, 'list', [])
        // }
      })
    },

    handleJiraEdit (type, row) {
      this.operateType = type
      this.dialogJiraAddFormVisible = true
      this.params = this.$utils.cloneObj(row)
    },
    handleJiraDelete (item) {
      this.$confirm(`确定要删除这个配置吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteProjectManage(item.id).then(res => {
          this.getJiraConfig()
          this.$message({
            message: '配置删除成功',
            type: 'success'
          })
        })
      })
    },
    updateJiraConfig () {
      this.$refs.form.validate(valid => {
        if (valid) {
          let params = {}
          if (this.params.type === 'lark') {
            params = {}
          } else {
            params = {
              type: 'jira',
              jira_host: this.params.jira_host,
              jira_user: this.params.jira_user,
              jira_token: this.params.jira_token
            }
          }
          if (this.operateType === 'add') {
            createProjectManage(params).then(res => {
              this.getJiraConfig()
              this.handleJiraCancel()
              this.$message({
                message: '配置添加成功',
                type: 'success'
              })
            })
          } else {
            updateProjectManage(params, this.params.id).then(res => {
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
      if (this.$refs.form) {
        this.$refs.form.resetFields()
        this.dialogJiraAddFormVisible = false
      }
      if (this.$refs.form) {
        this.$refs.form.resetFields()
        this.dialogJiraAddFormVisible = false
      }
    }
  },
  activated () {
    this.getJiraConfig()
  }
}
</script>

<style lang="less" scoped>
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

  /deep/.edit-form-dialog {
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
      padding: 30px 20px;
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

    .el-input__suffix-inner {
      display: inline-flex;
    }
  }
}

/deep/ .el-icon-success {
  margin-left: 10px;
  color: @success;
  font-size: 20px;
}

/deep/ .el-icon-error {
  display: block;
  margin-left: 10px;
  color: red;
  font-size: 20px;
}
</style>
