<template>
  <div class="installation-container">
    <div class="container-fluid">
      <el-row type="flex">
        <el-col :xs="24" :sm="24" :md="13" :lg="13" class="form-section">
          <div class="signup-inner-form">
            <h1 class="title">{{$t(`installation.signup`)}}</h1>
            <el-form :model="signUpForm" ref="signUpForm" :rules="rules" label-position="left" label-width="130px">
              <el-form-item :label="$t(`installation.username`)" prop="username">
                <el-input v-model="signUpForm.username" :placeholder="$t(`installation.inputUsername`)"></el-input>
              </el-form-item>
              <el-form-item :label="$t(`installation.password`)" prop="password">
                <el-input type="email" v-model.trim="signUpForm.password" :placeholder="$t(`installation.inputPassword`)"></el-input>
              </el-form-item>
              <el-form-item :label="$t(`installation.email`)" prop="email">
                <el-input v-model="signUpForm.email" :placeholder="$t(`installation.inputEmail`)"></el-input>
              </el-form-item>
              <el-form-item :label="$t(`installation.company`)" prop="company">
                <el-input v-model="signUpForm.company" :placeholder="$t(`installation.inputCompany`)"></el-input>
              </el-form-item>
              <el-form-item :label="$t(`installation.phone`)" prop="phone">
                <el-input type="email" v-model.trim.number="signUpForm.phone" :placeholder="$t(`installation.inputPhone`)"></el-input>
              </el-form-item>
              <el-form-item :label="$t(`installation.reason`)" prop="reason">
                <el-input type="textarea" :rows="2" v-model="signUpForm.reason" :placeholder="$t(`installation.inputReasonPlaceholder`)"></el-input>
              </el-form-item>
              <el-form-item :label="$t(`installation.address`)" prop="address">
                <el-input v-model="signUpForm.address" :placeholder="$t(`installation.inputAddressPlaceholder`)"></el-input>
              </el-form-item>
            </el-form>
            <el-button type="submit" :loading="loading" @click="signUp" class="btn-md btn-theme btn-block login-btn">{{$t(`signUp.signUp`)}}</el-button>
          </div>
        </el-col>
        <el-col class="bg-img none-992" :xs="0" :sm="0" :md="11" :lg="11">
          <div class="information">
            <h3>{{showSlogan.title}}</h3>
            <p>{{showSlogan.content}}</p>
          </div>
        </el-col>
      </el-row>
    </div>
    <footer>
      <div class="copyright">
        {{$t(`login.companyInfo`)}}{{` ©${moment().format('YYYY')}`}}
        <el-tooltip>
          <div slot="content">
            <span v-if="processEnv.VERSION">Version: {{processEnv.VERSION}}</span>
            <br />
            <span v-if="processEnv.BUILD_TIME">Build Time: {{moment.unix(processEnv.BUILD_TIME).format('YYYYMMDDHHmm')}}</span>
            <br />
            <span v-if="processEnv.TAG">Tag: {{processEnv.TAG}}</span>
          </div>
          <span v-if="processEnv && processEnv.BUILD_TIME" class="el-icon-info"></span>
        </el-tooltip>
        <LangSwitcher class="language-switcher" />
      </div>
    </footer>
  </div>
</template>
<script>
import moment from 'moment'
import { userInitializationAPI } from '@api'

export default {
  data () {
    return {
      signUpForm: {
        username: '',
        password: '',
        email: '',
        company: '',
        reason: '',
        phone: null,
        address: ''
      },
      loading: false,
      moment
    }
  },
  methods: {
    signUp () {
      this.$refs.signUpForm.validate(async valid => {
        if (valid) {
          this.loading = true
          const payload = this.signUpForm
          const res = await userInitializationAPI(payload)
          if (res) {
            this.loading = false
            this.$router.push('/signin')
          }
        } else {
          this.loading = false
        }
      })
    }
  },
  computed: {
    processEnv () {
      return process.env
    },
    slogan () {
      return {
        common: {
          title: this.$t(`login.sloganTitle`),
          content: this.$t(`login.sloganDesc`)
        }
      }
    },
    rules () {
      const validatePhone = (rule, value, callback) => {
        if (value !== null && value !== '') {
          if (
            !/^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/.test(
              value
            )
          ) {
            callback(new Error(this.$t(`profile.pleaseCheckPhone`)))
          } else {
            callback()
          }
        }
      }
      return {
        username: [
          {
            type: 'string',
            required: true,
            message: this.$t(`installation.inputUsername`),
            trigger: 'blur'
          }
        ],
        password: [
          {
            type: 'string',
            required: true,
            validator: this.$utils.validatePassword(),
            trigger: 'blur'
          }
        ],
        email: [
          {
            type: 'string',
            required: true,
            message: this.$t(`installation.inputEmail`),
            trigger: 'blur'
          },
          {
            type: 'email',
            message: this.$t(`installation.inputEmailCheck`),
            trigger: ['blur']
          }
        ],
        company: [
          {
            type: 'string',
            required: true,
            message: this.$t(`installation.inputCompany`),
            trigger: 'blur'
          }
        ],
        phone: [
          {
            type: 'tel',
            required: false,
            message: this.$t(`installation.checkPhone`),
            trigger: ['blur'],
            validator: validatePhone
          }
        ]
      }
    },
    showSlogan () {
      return this.slogan.common
    }
  }
}
</script>
<style lang="less" scoped>
.installation-container {
  .container-fluid {
    width: 100%;
    margin: 0 auto;
  }

  .information {
    display: flex;
    flex-direction: column;
    margin: 0 20px 0 70px;
    color: #fff;

    h3 {
      margin-bottom: 20px;
      color: #fff;
      font-size: 25px;
    }

    p {
      margin-bottom: 20px;
      color: #fff;
      line-height: 28px;
    }
  }

  .form-section {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 30px;
    text-align: center;

    .signup-inner-form {
      width: 100%;
      max-width: 460px;
      color: #717171;
      text-align: center;

      .title {
        color: #303133;
        font-weight: 600;
        font-size: 24px;
        text-align: left;
      }

      .subtitle {
        margin: 10px 0 25px;
        color: #8590a6;
        font-weight: 400;
        font-size: 15px;
        text-align: left;
      }

      .content {
        color: #606266;
        font-weight: 500;
        font-size: 17px;
        text-align: left;
      }

      .btn-theme {
        color: #fff;
        background: @themeColor;
        border: none;
      }

      .input {
        background: #fff !important;
      }

      .btn-theme:hover {
        background: #0066ffc2;
      }

      .btn-md {
        width: 100%;
        padding: 12px 30px 11px 30px;
        font-weight: 400;
        font-size: 14px;
        letter-spacing: 1px;
        border-radius: 4px;
        cursor: pointer;
      }
    }
  }

  .bg-img {
    position: relative;
    top: 0;
    bottom: 0;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 30px 30px;
    text-align: left;
    background:
      rgba(0, 0, 0, 0.04) url('~@assets/background/login.jpg') top
      left repeat;
    background-size: cover;
    border-radius: 100% 0 0 100%;
    opacity: 1;
  }

  footer {
    display: flex;
    justify-content: center;

    .copyright {
      position: absolute;
      bottom: 0;
      margin-bottom: 30px;
      color: #8f9bb2;
      font-size: 14px;

      /deep/ .language-switcher {
        color: #8f9bb2;
        cursor: pointer;

        .iconfont {
          font-size: 16px;
        }
      }
    }
  }
}

@media (max-width: 992px) {
  .installation-container .none-992 {
    display: none;
  }

  .installation-container .form-section {
    padding: 30px 15px;
  }
}
</style>
