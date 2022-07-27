<template>
  <div
    v-loading="loading"
    element-loading-text="加载中..."
    element-loading-spinner="iconfont iconfont-loading iconcompany-info"
    class="enterprise-info-container"
  >
    <div class="info-detail-container">
      <el-form
        :model="enterpriseInfo"
        :rules="rules"
        ref="infoForm"
        status-icon
        label-width="100px"
        label-position="top"
        class="demo-ruleForm"
      >
        <el-form-item label="企业名称" prop="name">
          <el-input size="small" v-model="enterpriseInfo.name" placeholder="企业名称(选填)"></el-input>
        </el-form-item>
        <el-form-item label="企业网址" prop="website">
          <el-input size="small" v-model="enterpriseInfo.website" placeholder="企业网址(选填)"></el-input>
        </el-form-item>
        <el-form-item label="企业 Logo" prop="logo">
          <span class="desc">登录页面使用的图标和侧边栏展开后右上角使用的图标，格式：JPEG/PNG，推荐大小：200px * 60px</span>
          <el-upload class="avatar-uploader" action="#" :show-file-list="false" :before-upload="beforeBigLogoUpload">
            <img v-if="enterpriseInfo.big_logo" :src="enterpriseInfo.big_logo" class="avatar" />
            <img v-else src="@assets/icons/logo/default-logo.png" class="avatar" />
          </el-upload>
          <span class="desc">侧边栏收缩后右上角使用的图标，格式：JPEG/PNG，推荐大小：60px * 60px</span>
          <el-upload class="avatar-uploader" action="#" :show-file-list="false" :before-upload="beforeSmallLogoUpload">
            <img v-if="enterpriseInfo.small_logo" :src="enterpriseInfo.small_logo" class="avatar small" />
            <i v-else class="el-icon-plus avatar-uploader-icon small"></i>
          </el-upload>
        </el-form-item>
      </el-form>
      <el-button @click="saveChange('infoForm')" size="small" type="primary" plain>保存</el-button>
    </div>
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import { getEnterpriseInfoAPI, updateEnterpriseInfoAPI } from '@api'
import moment from 'moment'
export default {
  data () {
    return {
      showEdit: false,
      loading: false,
      enterpriseInfo: {
        name: '',
        website: '',
        orgToken: '',
        big_logo: '',
        small_logo: ''
      },
      rules: {
        name: {
          required: false,
          message: '请输入企业名称',
          trigger: ['blur', 'change']
        },
        website: [
          {
            required: false,
            message: '请输入企业网址',
            trigger: 'blur'
          },
          {
            type: 'url',
            message: '请输入正确的网址',
            trigger: ['blur', 'change']
          }
        ]
      }
    }
  },
  methods: {
    getEnterpriseInfo () {
      this.loading = true
      getEnterpriseInfoAPI().then(res => {
        this.loading = false
        this.enterpriseInfo = res
      })
    },
    saveChange (formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          const payload = this.enterpriseInfo
          updateEnterpriseInfoAPI(payload).then(res => {
            this.$message({
              message: '信息修改成功',
              type: 'success'
            })
            this.getEnterpriseInfo()
          })
        } else {
          return false
        }
      })
    },
    beforeBigLogoUpload (file) {
      const formate =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/svg+xml'
      const isLt1M = file.size / 1024 / 1024 < 1
      if (!formate) {
        this.$message.error('上传 logo 只能是 JPG、PNG、SVG 格式!')
      } else if (!isLt1M) {
        this.$message.error('上传 logo 大小不能超过 1MB!')
      } else {
        const toBase64 = file =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = error => reject(error)
          })

        if (file) {
          toBase64(file).then(value => {
            this.enterpriseInfo.big_logo = value
          })
        }
      }
      return formate && isLt1M
    },
    beforeSmallLogoUpload (file) {
      const formate =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/svg+xml'
      const isLt1M = file.size / 1024 / 1024 < 1
      if (!formate) {
        this.$message.error('上传 logo 只能是 JPG、PNG、SVG 格式!')
      } else if (!isLt1M) {
        this.$message.error('上传 logo 大小不能超过 1MB!')
      } else {
        const toBase64 = file =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = error => reject(error)
          })

        if (file) {
          toBase64(file).then(value => {
            this.enterpriseInfo.small_logo = value
          })
        }
      }
      return formate && isLt1M
    }
  },
  computed: {
    expiredTime () {
      if (this.enterpriseInfo.expireTimestamp > 0) {
        return moment
          .unix(this.enterpriseInfo.expireTimestamp)
          .format('YYYY-MM-DD')
      } else {
        return 'N/A'
      }
    },
    isExpired () {
      if (this.enterpriseInfo.expireTimestamp > 0) {
        if (this.enterpriseInfo.expireTimestamp < moment().unix()) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, { title: '企业信息', breadcrumb: [] })
    bus.$emit(`set-sub-sidebar-title`, {
      title: '',
      routerList: []
    })
    this.getEnterpriseInfo()
  }
}
</script>

<style lang="less">
.enterprise-info-container {
  position: relative;
  flex: 1;
  padding: 15px 30px;
  overflow: auto;
  font-size: 14px;

  .info-detail-container {
    .alert {
      margin-bottom: 10px;
    }

    .desc {
      color: #606266;
    }
  }

  .avatar-uploader .el-upload {
    position: relative;
    overflow: hidden;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
  }

  .avatar-uploader .el-upload:hover {
    border-color: #409eff;
  }

  .avatar-uploader-icon {
    width: 200px;
    height: 60px;
    color: #8c939d;
    font-size: 28px;
    line-height: 60px;
    text-align: center;

    &.small {
      width: 60px;
      height: 60px;
    }
  }

  .avatar {
    display: block;
    width: 200px;
    height: 60px;
    object-fit: contain;

    &.small {
      width: 60px;
      height: 60px;
    }
  }

  .pointer {
    cursor: pointer;
  }
}
</style>
