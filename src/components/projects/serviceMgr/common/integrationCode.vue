<template>
  <div class="add-code-container">
    <el-alert title="检测到代码源尚未集成请先集成代码源后再进行相关操作" :closable="false" type="warning"></el-alert>
    <el-alert v-if="codeAdd.type === 'gitlab'" type="info" :closable="false">
      <slot>
        <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
        <span class="tips code-line">
          {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
          <span
            v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </span>
        <span class="tips">- 应用权限请勾选：api、read_user、read_repository</span>
        <span class="tips">
          - 更多配置可参考
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/gitlab/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-else-if="codeAdd.type === 'github'" type="info" :closable="false">
      <slot>
        <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
        <span class="tips code-line">
          {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
          <span
            v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </span>
        <span class="tips">
          - 更多配置可参考
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/github/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-else-if="codeAdd.type === 'gerrit'" type="info" :closable="false">
      <slot>
        <span class="tips">
          - 具体配置可参考
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            href="https://docs.koderover.com/zadig/settings/codehost/gerrit/"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-else-if="codeAdd.type === 'gitee'" type="info" :closable="false">
      <slot>
        <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
        <span class="tips code-line">
          {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
          <span
            v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </span>
        <span class="tips">- 应用权限请勾选：projects、groups、pull_requests、hook</span>
        <span class="tips">
          - 更多配置可参考
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/gitee/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-if="codeAdd.type === 'gitee-enterprise'" type="info" :closable="false">
      <slot>
        <span class="tips">{{`- 应用授权的回调地址请填写:`}}</span>
        <span class="tips code-line">
          {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
          <span
            v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
            v-clipboard:success="copyCommandSuccess"
            v-clipboard:error="copyCommandError"
            class="el-icon-document-copy copy"
          ></span>
        </span>
        <span class="tips">- 应用权限请勾选：projects、groups、pull_requests、hook、enterprises</span>
        <span class="tips">
          - 更多配置可参考
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/gitee-enterprise/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-alert v-else-if="codeAdd.type === 'other'" type="info" :closable="false">
      <slot>
        <span class="tips">- 支持标准 Git 协议的代码源</span>
        <span class="tips">- 集成后，构建/测试模板可从该代码源拉取代码</span>
        <span class="tips">
          - 更多配置可参考
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/codehost/others/`"
            :underline="false"
            target="_blank"
          >{{$t(`global.helpDoc`)}}</el-link>
        </span>
      </slot>
    </el-alert>
    <el-form :model="codeAdd" :rules="codeRules" status-icon label-position="top" ref="codeForm">
      <el-form-item label="代码源" prop="type">
        <el-select style="width: 100%;" v-model="codeAdd.type">
          <el-option label="GitLab" value="gitlab"></el-option>
          <el-option label="GitHub" value="github"></el-option>
          <el-option label="Gerrit" value="gerrit"></el-option>
          <el-option label="Gitee（社区版）" value="gitee"></el-option>
          <el-option v-if="hasPlutus" label="Gitee（企业版）" value="gitee-enterprise"></el-option>
          <el-option label="其他" value="other"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="代码源标识" prop="alias">
        <el-input v-model="codeAdd.alias" placeholder="代码源标识"></el-input>
      </el-form-item>
      <template v-if="codeAdd.type==='gitlab' || codeAdd.type ==='github'">
        <el-form-item v-if="codeAdd.type==='gitlab'" :label="codeAdd.type==='gitlab'?'GitLab 服务 URL':'服务 URL'" prop="address">
          <el-input v-model.trim="codeAdd.address" :placeholder="codeAdd.type==='gitlab'?'GitLab 服务 URL':'服务 URL'" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :label="codeAdd.type==='gitlab'?'Application ID':'Client ID'" prop="application_id">
          <el-input
            v-model="codeAdd.application_id"
            :placeholder="codeAdd.type==='gitlab'?'Application ID':'Client ID'"
            auto-complete="off"
          ></el-input>
        </el-form-item>
        <el-form-item :label="codeAdd.type==='gitlab'?'Secret':'Client Secret'" prop="client_secret">
          <el-input
            v-model="codeAdd.client_secret"
            show-password
            type="password"
            :placeholder="codeAdd.type==='gitlab'?'Secret':'Client Secret'"
            auto-complete="off"
          ></el-input>
        </el-form-item>
      </template>
      <template v-else-if="codeAdd.type==='gerrit'">
        <el-form-item label="Gerrit 服务 URL" prop="address">
          <el-input v-model.trim="codeAdd.address" placeholder="Gerrit 服务 URL" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="codeAdd.username" placeholder="Username" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="codeAdd.password" placeholder="Password" auto-complete="off"></el-input>
        </el-form-item>
      </template>
      <template v-else-if="codeAdd.type==='gitee'">
        <el-form-item label="Client ID" prop="application_id">
          <el-input v-model="codeAdd.application_id" placeholder="Client ID" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="Client Secret" prop="client_secret">
          <el-input v-model="codeAdd.client_secret" placeholder="Client Secret" show-password type="password" auto-complete="off"></el-input>
        </el-form-item>
      </template>
      <template v-else-if="codeAdd.type==='gitee-enterprise'">
        <el-form-item label="Gitee 服务 URL" prop="address">
          <el-input v-model.trim="codeAdd.address" placeholder="Gitee 服务 URL" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :rules="{required: true,message: '请填写 Client ID',trigger: ['blur']}" label="Client ID" prop="application_id">
          <el-input v-model="codeAdd.application_id" placeholder="Access Key" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :rules="{required: true,message: '请填写 Client Secret',trigger: ['blur']}" label="Client Secret" prop="client_secret">
          <el-input v-model="codeAdd.client_secret" placeholder="Client Secret" show-password type="password" auto-complete="off"></el-input>
        </el-form-item>
      </template>
      <template v-else-if="codeAdd.type==='other'">
        <el-form-item label="鉴权方式" prop="auth_type">
          <el-select v-model="codeAdd.auth_type" filterable allow-create>
            <el-option label="SSH" value="SSH"></el-option>
            <el-option label="Access Token" value="PrivateAccessToken"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="codeAdd.auth_type"
          label="代码源 URL"
          prop="address"
          :rules="{ validator: (codeAdd.auth_type === 'SSH' ? validateSSH : validateGitURL), trigger: ['change', 'blur'] }"
        >
          <el-input v-model="codeAdd.address" :placeholder="codeAdd.auth_type === 'SSH' ? 'git@example.com' : 'http(s)://example.com'"></el-input>
        </el-form-item>
        <el-form-item v-if="codeAdd.auth_type === 'SSH'" label="SSH Key" prop="ssh_key">
          <el-input v-model="codeAdd.ssh_key" placeholder="SSH Key" type="textarea" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item v-if="codeAdd.auth_type === 'PrivateAccessToken'" label="Access Token" prop="private_access_token">
          <el-input v-model="codeAdd.private_access_token" placeholder="Access Token" show-password type="password" auto-complete="off"></el-input>
        </el-form-item>
      </template>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button
        type="primary"
        native-type="submit"
        size="small"
        class="start-create"
        @click="createCodeConfig"
      >{{(codeAdd.type==='gerrit'||codeAdd.type==='other')?'确定':'前往授权'}}</el-button>
      <el-button plain native-type="submit" size="small" @click="cancel">{{$t(`global.cancel`)}}</el-button>
    </div>
  </div>
</template>
<script>
import { createCodeSourceAPI } from '@api'
import { mapState } from 'vuex'
export default {
  data () {
    return {
      codeAdd: {
        name: '',
        type: 'gitlab',
        address: '',
        access_token: '',
        application_id: '',
        client_secret: '',
        alias: '',
        auth_type: ''
      }
    }
  },
  computed: {
    codeRules () {
      return {
        type: {
          required: true,
          message: '请选择代码源类型',
          trigger: ['blur']
        },
        address: [
          {
            required: true,
            trigger: ['blur', 'change'],
            message: '请输入 URL，包含协议'
          }
        ],
        access_token: {
          required: true,
          message: '请填写 Access Token',
          trigger: ['blur']
        },
        application_id: {
          required: true,
          message: '请填写 Id',
          trigger: ['blur']
        },
        client_secret: {
          required: true,
          message: '请填写 Secret',
          trigger: ['blur']
        },
        username: {
          required: true,
          message: '请填写 Username',
          trigger: ['blur']
        },
        password: {
          required: true,
          message: '请填写 Password',
          trigger: ['blur']
        },
        alias: {
          required: true,
          message: '请填写代码源标识',
          trigger: ['blur']
        },
        auth_type: {
          required: true,
          message: '请选择鉴权方式',
          trigger: ['blur', 'change']
        }
      }
    },
    validateSSH () {
      const validateSSH = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入服务 URL'))
        } else {
          const reg = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z0-9]{2,14}(:[1-9]\d{0,4})?/
          if (!reg.test(value)) {
            callback(new Error('请输入正确的格式'))
          } else {
            callback()
          }
        }
      }
      return validateSSH
    },
    validateGitURL () {
      const validateGitURL = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入服务 URL'))
        } else {
          const reg = /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/
          if (!reg.test(value)) {
            callback(new Error('请输入正确的 URL，包含协议'))
          } else {
            callback()
          }
        }
      }
      return validateGitURL
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  methods: {
    clearValidate (ref) {
      this.$refs[ref].clearValidate()
    },
    cancel () {
      this.$emit('cancel', true)
    },
    createCodeConfig () {
      this.$refs.codeForm.validate((valid) => {
        if (valid) {
          const payload = this.codeAdd
          const redirectUrl = window.location.href
          const provider = this.codeAdd.type
          if (provider === 'github') {
            payload.address = 'https://github.com'
          } else if (provider === 'gitee') {
            payload.address = 'https://gitee.com'
          } else if (provider === 'other') {
            // Add newline to the end of the ssh key
            const sshKeyLastCharacter = payload.ssh_key.charAt(payload.ssh_key.length - 1)
            if (sshKeyLastCharacter !== '\n') {
              payload.ssh_key = payload.ssh_key + '\n'
            }
          }
          createCodeSourceAPI(payload).then((res) => {
            const codehostId = res.id
            this.$message({
              message: '代码源添加成功',
              type: 'success'
            })
            if (payload.type === 'gitlab' || payload.type === 'gitee' || payload.type === 'gitee-enterprise' || payload.type === 'github') {
              this.goToCodeHostAuth(codehostId, redirectUrl)
            }
            this.handleCodeCancel()
          })
        } else {
          return false
        }
      })
    },
    goToCodeHostAuth (codehostId, redirectUrl) {
      window.location.href = `/api/v1/codehosts/${codehostId}/auth?redirect_url=${redirectUrl}`
    },
    copyCommandSuccess (event) {
      this.$message({
        message: '地址已成功复制到剪贴板',
        type: 'success'
      })
    },
    copyCommandError (event) {
      this.$message({
        message: '地址复制失败',
        type: 'error'
      })
    }
  },
  watch: {
    'codeAdd.type' (val) {
      this.$refs.codeForm.clearValidate()
    }
  }
}
</script>
<style lang="less">
.add-code-container {
  padding: 10px 15px;
  font-size: 13px;

  .el-select {
    width: 100%;
  }

  .tips {
    display: block;

    &.code-line {
      display: inline-block;
      padding-left: 10px;
      color: #ecf0f1;
      font-size: 14px;
      word-wrap: break-word;
      word-break: break-all;
      background-color: #334851;
      border-radius: 2px;

      .copy {
        font-size: 16px;
        cursor: pointer;

        &:hover {
          color: @themeColor;
        }
      }
    }
  }
}
</style>
