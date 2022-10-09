<template>
    <div v-loading="loading"
         element-loading-text="加载中..."
         element-loading-spinner="iconfont iconfont-loading iconyingyongshezhi"
         class="setting-app-container">
      <!--apps-create-dialog-->
      <el-dialog title='新建'
                 width="55%"
                 :close-on-click-modal="false"
                 custom-class="create-app-dialog"
                 :visible.sync="dialogAppCreateFormVisible">
        <el-form ref="createApp"
                 :rules="rules"
                 :model="createApp"
                 label-position="left"
                 label-width="100px">
          <el-form-item label="名称"
                        prop="name">
            <el-input size="small"
                      v-model="createApp.name"></el-input>
          </el-form-item>
          <el-form-item label="版本"
                        prop="version">
            <el-input size="small"
                      placeholder="例如 1.0.0"
                      v-model="createApp.version"></el-input>
          </el-form-item>
          <el-form-item label="Bin Path"
                        prop="bin_path">
            <el-input size="small"
                      placeholder="$HOME/install_pkg/bin"
                      v-model="createApp.bin_path"></el-input>
          </el-form-item>
          <el-form-item class="label-icon">
            <template #label>
              <span>启用</span>
              <el-tooltip content="控制软件包列表中是否展示，正在使用中的不受影响"
                          placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-checkbox v-model="createApp.enabled">启用该软件包</el-checkbox>
          </el-form-item>
          <el-form-item prop="download_path" class="label-icon">
            <template #label>
              <span>安装包地址</span>
              <el-tooltip content="系统自动从配置地址下载安装包并做缓存，安装包可通过 ${FILEPATH} 变量获取"
                          placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-input size="small"
                      placeholder="http://domain/install_pkg.tar.gz"
                      v-model="createApp.download_path"></el-input>
          </el-form-item>
          <el-form-item label="安装脚本"
                        prop="scripts">
            <Editor v-model="createApp.scripts"
                    lang="sh"
                    theme="monokai"
                    width="100%"
                    height="220"></Editor>
          </el-form-item>
        </el-form>
        <div slot="footer"
             class="dialog-footer">
          <el-button size="small"
                     @click="dialogAppCreateFormVisible = false">取 消</el-button>
          <el-button :plain="true"
                     type="success"
                     size="small"
                     @click="appOperation('add')">保存</el-button>
        </div>
      </el-dialog>
      <!--apps-create-dialog-->

      <!--apps-edit-dialog-->
      <el-dialog :title='`修改软件包-${swapApp.name} ${swapApp.version}`'
                 width="55%"
                 custom-class="create-app-dialog"
                 :close-on-click-modal="false"
                 :visible.sync="dialogAppEditFormVisible">
        <el-form ref="updateApp"
                 :rules="rules"
                 :model="swapApp"
                 label-position="left"
                 label-width="100px">
          <el-form-item v-if="(typeof swapApp.bin_path)!=='undefined'"
                        label="Bin Path"
                        prop="bin_path">
            <el-input size="small"
                      v-model="swapApp.bin_path"></el-input>
          </el-form-item>
          <el-form-item v-if="(typeof swapApp.enabled)!=='undefined'" class="label-icon">
            <template #label>
              <span>启用</span>
              <el-tooltip content="控制软件包列表中是否展示，正在使用中的不受影响"
                          placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-checkbox v-model="swapApp.enabled">启用该软件包</el-checkbox>
          </el-form-item>
          <el-form-item v-if="(typeof swapApp.download_path)!=='undefined'"
                        prop="download_path"
                        class="label-icon">
            <template #label>
              <span>安装包地址</span>
              <el-tooltip content="系统自动从配置地址下载安装包并做缓存，安装包可通过 ${FILEPATH} 变量获取"
                          placement="top">
                <i class="el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-input size="small"
                      v-model="swapApp.download_path"></el-input>
          </el-form-item>
          <el-form-item label="安装脚本"
                        prop="scripts">
            <Editor v-model="swapApp.scripts"
                    lang="sh"
                    theme="monokai"
                    width="100%"
                    height="220"></Editor>
          </el-form-item>
        </el-form>
        <div slot="footer"
             class="dialog-footer">
          <el-button size="small"
                     @click="dialogAppEditFormVisible = false">取 消</el-button>
          <el-button size="small"
                     :plain="true"
                     type="success"
                     @click="appOperation('update')">保存</el-button>
        </div>
      </el-dialog>
      <!--apps-edit-dialog-->
      <div class="section">
        <el-alert type="info"
                  :closable="false">
          <template>
            运行构建及测试步骤时，根据实际业务去安装必要的软件包，详情可参考
            <el-link style="font-size: 14px; vertical-align: baseline;"
                     type="primary"
                     :href="`https://docs.koderover.com/zadig/settings/app/`"
                     :underline="false"
                     target="_blank">帮助文档</el-link>
          </template>
        </el-alert>
        <div class="sync-container">
          <el-button :plain="true"
                     @click="dialogAppCreateFormVisible=true"
                     size="small"
                     type="success">新建</el-button>
          <span class="switch-span"
                :style="{color: proxyInfo.enable_application_proxy?'#0066ff':'#303133'}">启用代理</span>
          <el-switch size="small"
                     :value="proxyInfo.enable_application_proxy"
                     @change="changeProxy"></el-switch>
        </div>
        <div class="app-list">
          <el-collapse v-model="activeApps">
            <el-collapse-item v-for="(app,key) of appBucket" :key="key" :title="key" :name="key">
              <template slot="title">
                <span style="color: #4a4a4a; font-weight: 400; font-size: 16px;">{{key}}</span>
              </template>
              <el-table v-if="app.length > 0" :data="app"
                        style="width: 100%;">
                <el-table-column label="版本">
                  <template slot-scope="scope">
                    <span>{{scope.row.version}}</span>
                  </template>
                </el-table-column>
                <el-table-column label="启用">
                  <template slot-scope="scope">
                    <i v-if="scope.row.enabled" style="color: #67c23a;" class="el-icon-circle-check"></i>
                    <i v-else style="color: #f56c6c;" class="el-icon-circle-close"></i>
                  </template>
                </el-table-column>
                <el-table-column label="更新时间">
                  <template slot-scope="scope">
                    <i class="el-icon-time"></i>
                    <span style="margin-left: 5px;">{{$utils.convertTimestamp(scope.row.update_time)}}</span>
                  </template>
                </el-table-column>
                <el-table-column label="更新人">
                  <template slot-scope="scope">
                    <span>{{scope.row.update_by }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template slot-scope="scope">
                    <el-button @click="appOperation('edit',scope.row)"
                               type="primary"
                               size="mini" plain>编辑</el-button>
                    <el-button size="mini"
                               @click="deleteApp(scope.row)"
                               type="danger" plain>删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>

        </div>
      </div>
    </div>
</template>

<script>

import Editor from 'vue2-ace-bind'
import { getAllAppsAPI, createAppAPI, updateAppAPI, deleteAppAPI, getProxyConfigAPI, updateProxyConfigAPI } from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      proxyInfo: {
        id: '',
        type: '',
        address: '',
        port: undefined,
        username: '',
        password: '',
        enable_repo_proxy: false,
        enable_application_proxy: false
      },
      createApp: {
        scripts: '# tar -C $HOME -xzf ' + '$' + `{FILEPATH}` + '\n',
        env: [],
        bin_path: '',
        name: '',
        version: '',
        download_path: '',
        enabled: true
      },
      swapApp: {
        scripts: '',
        env: [],
        bin_path: '',
        name: '',
        version: '',
        download_path: '',
        enabled: true
      },
      appBucket: {},
      defaultVersion: {},
      dialogAppCreateFormVisible: false,
      dialogAppEditFormVisible: false,
      dialogAppDelVisible: false,
      loading: true,
      availableApps: [],
      activeApps: [],
      rules: {
        name: [{ required: true, message: '请填写软件包名称', trigger: 'blur' }],
        version: [{ required: true, message: '请填写软件包版本', trigger: 'blur' }],
        scripts: [{ required: true, message: '请填写安装脚本', trigger: 'blur' }],
        bin_path: [{ required: true, message: '请填写软件包 Bin Path', trigger: 'blur' }]
      }
    }
  },
  methods: {
    appOperation (operate, currentApp) {
      if (operate === 'add') {
        this.$refs.createApp.validate((valid) => {
          if (valid) {
            this.dialogAppCreateFormVisible = false
            this.addApp(this.createApp)
          } else {
            return false
          }
        })
      } else if (operate === 'edit') {
        this.dialogAppEditFormVisible = true
        this.swapApp = currentApp
      } else if (operate === 'update') {
        this.$refs.updateApp.validate((valid) => {
          if (valid) {
            const app = this.swapApp
            this.dialogAppEditFormVisible = false
            this.updateApp(app)
          } else {
            return false
          }
        })
      } else if (operate === 'delete') {
        this.deleteApp(currentApp)
      } else if (operate === 'cancel') {
        this.getApps()
      }
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    addApp (data) {
      createAppAPI(data).then(res => {
        this.$message({
          message: '新增软件包成功',
          type: 'success'
        })
        this.getApps()
        this.createApp = {
          scripts: '',
          env: [],
          bin_path: '',
          name: '',
          version: '',
          download_path: '',
          enabled: true
        }
      }).catch(() => {
        this.$message({
          message: '新增软件包失败',
          type: 'error'
        })
      }).then(() => {
        this.resetForm('createApp')
      })
    },
    updateApp (data) {
      updateAppAPI(data).then(response => {
        this.$message({
          message: '更新软件包成功',
          type: 'success'
        })
        this.getApps()
      }).catch(response => {
        this.$message({
          message: '更新软件包失败',
          type: 'error'
        })
      }).then(() => {
        this.resetForm('updateApp')
      })
    },
    deleteApp (data) {
      this.$confirm(`软件包删除可能会影响正在使用的工作流，确定删除 ${data.name} 的 ${data.version} 版本吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteAppAPI(data).then(response => {
          this.getApps()
          this.$message({
            message: '软件包已删除',
            type: 'success'
          })
        })
        this.getApps()
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    getApps () {
      this.loading = true
      const showAvailable = false
      getAllAppsAPI(showAvailable).then(
        response => {
          this.loading = false
          const apps = this.$utils.sortVersion(response, 'version', 'asc')
          const unsortAppBucket = {}
          this.appBucket = {}
          this.activeApps = []
          apps.forEach((app, index) => {
            unsortAppBucket[app.name] = []
          })
          apps.forEach((app, index) => {
            unsortAppBucket[app.name].push(app)
          })
          Object.keys(unsortAppBucket).sort().forEach(item => {
            this.appBucket[item] = unsortAppBucket[item]
          })
          for (const appName in this.appBucket) {
            if (Object.prototype.hasOwnProperty.call(this.appBucket, appName)) {
              this.appBucket[appName] = this.$utils.sortVersion(this.appBucket[appName], 'version', 'asc')
            }
          }
          for (const key in this.appBucket) {
            if (Object.prototype.hasOwnProperty.call(this.appBucket, key)) {
              this.activeApps.push(key)
            }
          }
        }
      )
    },
    changeProxy (value) {
      if (!this.proxyInfo.id || this.proxyInfo.type === 'no') {
        this.proxyInfo.enable_application_proxy = false
        this.$message.error('未配置代理，请前往「系统配置」->「代理配置」配置代理！')
        return
      }
      this.proxyInfo.enable_application_proxy = value
      updateProxyConfigAPI(this.proxyInfo.id, this.proxyInfo).then(response => {
        if (response.message === 'success') {
          const mess = value ? '启用代理成功！' : '成功关闭代理！'
          this.$message({
            message: `${mess}`,
            type: 'success'
          })
        } else {
          this.$message.error(response.message)
        }
      }).catch(err => {
        this.proxyInfo.enable_application_proxy = !value
        this.$message.error(`修改配置失败：${err}`)
      })
    },
    getProxyConfig () {
      getProxyConfigAPI().then(response => {
        if (response.length > 0) {
          this.proxyInfo = Object.assign({}, this.proxyInfo, response[0])
        }
      }).catch(error => {
        this.$message.error(`获取代理配置失败：${error}`)
      })
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: '软件包管理', breadcrumb: [] })
    this.getProxyConfig()
    this.getApps()
  },
  components: {
    Editor
  }
}
</script>

<style lang="less">
.setting-app-container {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 15px 30px;
  overflow: auto;
  font-size: 13px;

  .create-app-dialog {
    .el-dialog__body {
      padding: 20px 5%;
    }
  }

  .section {
    margin-bottom: 56px;

    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;
      overflow: hidden;

      .switch-span {
        display: inline-block;
        height: 20px;
        margin-right: 5px;
        margin-left: 10px;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        vertical-align: middle;
        transition: color 0.5s;
      }

      .el-button--success.is-plain {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }

      .el-button--success.is-plain:hover {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }
    }

    .app-list {
      padding-bottom: 30px;

      .el-collapse-item__arrow {
        margin: 0 0 0 4px;
      }

      .el-collapse-item__header {
        border-bottom: none;
      }

      .el-collapse-item__content {
        padding-bottom: 0;
      }

      .el-collapse-item__wrap {
        border-bottom: none;
      }
    }
  }
}
</style>
