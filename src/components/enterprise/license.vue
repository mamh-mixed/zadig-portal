<template>
  <div
    v-loading="loading"
    element-loading-text="加载中..."
    element-loading-spinner="iconfont iconfont-loading iconxukezheng"
    class="enterprise-license-container"
  >
    <div class="license-detail-container">
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span class="title">
            <i class="icon iconfont iconxukezheng"></i> 许可证信息
          </span>
        </div>
        <el-row>
          <el-col :span="4">
            <div class="text item">
              授权用户量：
              <el-tooltip effect="dark" content="系统授权最大用户数" placement="top">
                <i class="el-icon-question pointer"></i>
              </el-tooltip>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="text value">
              {{license.available_num}}
              <span>（{{license.user_num}} 人已用）</span>
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="4">
            <div class="text item">授权维护截止日期：</div>
          </el-col>
          <el-col :span="12">
            <div class="text value">
              <span style="display: inlne-block;">{{expiredTime}}</span>
              <template v-if="expiredTime">
                <span v-if="isExpired" class="alert error-alert">许可证已过期，联系 Zadig 获取新的许可证</span>
                <span v-else-if="expireSoon" class="alert warning-alert">许可证将在 {{leftTime}}后过期，联系 Zadig 获取新的许可证</span>
              </template>
            </div>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="4">
            <div class="text item">许可证：</div>
          </el-col>
          <el-col :span="12">
            <div class="text">
              <el-input type="textarea" :autosize="{ minRows: 4, maxRows: 8}" placeholder="请输入许可证" v-model="license.token"></el-input>
              <div class="operation">
                <el-button size="small" type="primary" @click="updateLicense" plain>更新</el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import { getLicenseAPI, updateLicenseAPI } from '@api'
import moment from 'moment'
import 'moment/locale/zh-cn'
export default {
  data () {
    return {
      loading: false,
      license: {
        expire_timestamp: 0,
        token: '',
        available_num: 0,
        user_num: 0
      }
    }
  },
  methods: {
    getLicense () {
      getLicenseAPI().then(res => {
        this.license = res
      })
    },
    updateLicense () {
      const payload = this.license
      updateLicenseAPI(payload).then(res => {
        this.$message({
          message: '许可证已成功更新',
          type: 'success'
        })
      })
    }
  },
  computed: {
    expiredTime () {
      if (this.license.expire_timestamp > 0) {
        return moment.unix(this.license.expire_timestamp).format('YYYY-MM-DD')
      } else {
        return 'N/A'
      }
    },
    isExpired () {
      if (this.license.expire_timestamp > 0) {
        if (this.license.expire_timestamp < moment().unix()) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    },
    expireSoon () {
      if (this.license.expire_timestamp > 0) {
        if (
          this.license.expire_timestamp - moment().unix() <
          60 * 60 * 24 * 14
        ) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    },
    leftTime () {
      if (this.license.expire_timestamp > 0) {
        return moment.unix(this.license.expire_timestamp).fromNow(true)
      } else {
        return 'N/A'
      }
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, { title: '许可证', breadcrumb: [] })
    bus.$emit(`set-sub-sidebar-title`, {
      title: '',
      routerList: []
    })
    this.getLicense()
  }
}
</script>

<style lang="less">
.enterprise-license-container {
  position: relative;
  flex: 1;
  padding: 15px 30px;
  overflow: auto;
  font-size: 14px;

  .license-detail-container {
    .icon {
      color: #06f;
      font-size: 20px;
    }

    .item {
      margin-bottom: 18px;
      color: #586069;
    }

    .title {
      font-size: 16px;
    }

    .text {
      font-size: 14px;
    }

    .value {
      font-weight: bold;
      font-size: 14px;
    }

    .warning-alert {
      color: #f5a623;
    }

    .error-alert {
      color: #ff1949;
    }

    .alert {
      display: inline-block;
      font-weight: 400;
      font-size: 14px;
    }

    .operation {
      margin-top: 10px;
    }
  }

  .pointer {
    cursor: pointer;
  }
}
</style>
