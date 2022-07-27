<template >
  <div class="setup-license">
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
          <el-button size="small" type="primary" @click="submitForm('license')"  plain>保存</el-button>
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
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: center;

  .main-container {
    display: flex;
    width: 800px;
    padding: 40px;
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    box-shadow: 0 0 6px 1px #dcdfe6;

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
