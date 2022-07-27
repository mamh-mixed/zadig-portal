<template >
  <div class="setup-license">
    <div class="header">
      <img src="@assets/icons/logo/default-logo.png" alt />
    </div>
    <el-row class="main-container">
      <el-col :span="8">
        <div class="step-container">
          <div class="title">许可证输入</div>
        </div>
        <div class="banner-container">
          <img class="image" src="@assets/icons/illustration/license.svg" width="200px" />
        </div>
      </el-col>
      <el-col :span="16" class="main-content-container">
        <el-form label-position="top" ref="license" :rules="rules" label-width="80px" :model="license">
          <el-form-item label prop="token">
            <el-input type="textarea" :autosize="{ minRows: 12, maxRows: 14}" placeholder="请输入许可证" v-model="license.token"></el-input>
          </el-form-item>
        </el-form>
        <div class="operation">
          <el-button size="small" type="primary" @click="submitForm('license')" plain>保存</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { createLicenseAPI } from '@api'
export default {
  data () {
    return {
      license: {
        token: ''
      },
      rules: {
        token: [{ required: true, message: '请输入许可证', trigger: 'blur' }]
      }
    }
  },
  methods: {
    submitForm (formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.createLicense()
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    createLicense () {
      const payload = this.license
      createLicenseAPI(payload).then(res => {
        this.$message({
          message: '许可证已成功添加',
          type: 'success'
        })
        this.$router.replace('/signin')
      })
    }
  }
}
</script>
<style lang="less">
.setup-license {
  display: flex;
  flex-direction: column;
  height: 100%;

  .header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: flex-start;
    height: 60px;
    border-bottom: 1px solid #f7f8fa;
    box-shadow: 0 1px 4px 0 #dcdfe6;

    img {
      display: flex;
      height: 40px;
    }
  }

  .main-container {
    display: flex;
    flex: 1;
    width: 100%;
    padding: 100px;

    .el-col {
      height: 100%;
    }

    .banner-container {
      display: flex;
      align-content: center;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      height: 300px;
    }

    .operation {
      margin-top: 15px;
      padding-top: 10px;
      padding-bottom: 5px;
      text-align: right;
    }
  }
}
</style>
