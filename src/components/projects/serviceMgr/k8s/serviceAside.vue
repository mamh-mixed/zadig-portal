<template>
  <div class="aside__wrap">
    <el-drawer title="代码源集成" :visible.sync="integrationCodeDrawer" direction="rtl">
      <IntegrationCode @cancel="integrationCodeDrawer = false" />
    </el-drawer>
    <el-drawer title="镜像仓库集成" :visible.sync="registryCreateVisible">
      <IntegrationRegistry @cancel="registryCreateVisible = false" @createSuccess="getRegistryWhenBuild" />
    </el-drawer>
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': selected === 'var'}" @click="changeRoute('var')">
            <span class="step-name">{{$t('services.k8s.variablesSection')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'policy'}" @click="changeRoute('policy')">
            <span class="step-name">{{$t('services.common.policySection')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'help'}" @click="changeRoute('help')">
            <span class="step-name">{{$t('services.common.helpSection')}}</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="selected === 'build'" class="service-aside--variables">
          <div style="padding-left: 15px;">
            <el-button @click="$router.back()" icon="el-icon-back" type="text">{{$t('global.back')}}</el-button>
          </div>
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.serviceBuild')}}</div>
          </header>
          <div class="service-aside-box__content">
            <CommonBuild
              ref="buildRef"
              :name="$route.query.service_name"
              :buildName="$route.query.build_name"
              :isEdit="!!$route.query.build_name"
              :followUpFn="followUpFn"
              :saveDisabled="projectName !== projectNameOfService"
              :buildNameIndex="buildNameIndex"
              canSelectBuildName
              mini
              fromServicePage
            />
          </div>
        </div>
        <div v-if="selected === 'var'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.k8s.variablesSection')}}</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconfuwu"></i>
                </span> {{$t('services.common.detectedServiceModules')}}
                <el-tooltip effect="dark" placement="top">
                  <div slot="content">{{$t('services.common.detectedServiceModulesTooltip')}}</div>
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <div v-if="allRegistry.length === 0" class="registry-alert">
                <el-alert type="warning">
                  <div>
                    私有镜像仓库未集成，
                    <el-button type="text" class="theme-color" style="padding: 0;" @click="registryCreateVisible = true">立即集成</el-button>
                  </div>
                </el-alert>
              </div>
              <el-table :data="serviceModules" stripe style="width: 100%;">
                <el-table-column prop="name" :label="$t('services.common.serviceModule')"></el-table-column>
                <el-table-column prop="image_name" :label="$t('services.common.serviceImageName')"></el-table-column>
                <el-table-column prop="image">
                  <template slot="header">
                    <span>{{$t('services.common.serviceImageLabel')}}</span>
                    <el-tooltip effect="dark" placement="top">
                      <div slot="content">
                        工作流任务执行过程中，由构建任务生成 $IMAGE 镜像，部署任务使用生成的 $IMAGE 镜像更新服务。
                        <br />其中 $IMAGE 为系统内置的镜像名称，工作流执行时自动生成。
                        <br />点击「策略」配置镜像名称规则。
                      </div>
                      <span>
                        <i class="el-icon-question"></i>
                      </span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('services.common.buildInfoAndOperation')">
                  <template slot-scope="scope">
                    <div v-for="(buildName, index) in scope.row.build_names" :key="index">
                      <router-link :to="`${buildBaseUrl}?rightbar=build&service_name=${scope.row.name}&build_name=${buildName}`">
                        <span class="build-name">{{ buildName }}</span>
                      </router-link>
                    </div>
                    <el-button size="small" v-hasPermi="{projectName: projectName, action: 'create_build',isBtn:true}" :disabled="projectName !== projectNameOfService" @click="addBuild(scope.row)" type="text">{{$t('services.common.addServiceBuild')}}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconchakanbianliang"></i>
                </span> {{$t('services.k8s.buildInVariables')}}
                <el-tooltip effect="dark" :content="$t('services.k8s.buildInVariablesTooltip')" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <el-table :data="sysEnvs" stripe style="width: 100%;">
                <el-table-column prop="key" :label="$t(`global.var`)"></el-table-column>
                <el-table-column prop="value" :label="$t('services.k8s.currentValue')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.value">{{scope.row.value}}</span>
                    <span v-else>{{$t('global.emptyText')}}</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconchakanbianliang"></i>
                </span> {{$t('services.k8s.globalVariables')}}
                <el-tooltip effect="dark" :content="$t('services.k8s.globalVariablesTooltip')" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
                 <VariablePreviewEditor :serviceName="service.service_name" :services="services" :projectName="projectName" :variables="customEnvs" />
              </h4>
              <div class="kv-container">
                <el-table :data="customEnvs" style="width: 100%;">
                  <el-table-column label="Key">
                    <template slot-scope="scope">
                      <span>{{ scope.row.key }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Value">
                    <template slot-scope="scope">
                      <VariableEditor :disabled="!editEnvIndex[scope.$index]" :varKey="scope.row.key" :value.sync="scope.row.value" />
                    </template>
                  </el-table-column>
                  <el-table-column v-hasPermi="{projectName: projectName, action: 'edit_service'}" :label="$t(`global.operation`)" width="150">
                    <template slot-scope="scope">
                      <span class="operate">
                        <el-button
                          v-if="!editEnvIndex[scope.$index]"
                          type="text"
                          @click="editRenderKey(scope.$index,scope.row.state)"
                          class="edit"
                        >{{$t(`global.edit`)}}</el-button>
                        <el-button
                          v-if="editEnvIndex[scope.$index]"
                          type="text"
                          @click="saveRenderKey(scope.$index,scope.row.state)"
                          class="edit"
                        >{{$t(`global.save`)}}</el-button>
                        <el-button
                          v-if="scope.row.state === 'unused'"
                          type="text"
                          @click="deleteRenderKey(scope.$index,scope.row.state)"
                          class="delete"
                        >{{$t(`global.remove`)}}</el-button>
                        <el-tooltip
                          v-if="scope.row.state === 'present'||scope.row.state === 'new'"
                          effect="dark"
                          content="服务中已经用到的 Key 无法被删除"
                          placement="top"
                        >
                          <span class="el-icon-question"></span>
                        </el-tooltip>
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
                <div v-if="addKeyInputVisable" class="add-key-container">
                  <el-table :data="addKeyData" :show-header="false" style="width: 100%;">
                    <el-table-column>
                      <template slot-scope="{ row }">
                        <el-form :model="row" :rules="keyCheckRule" ref="addKeyForm" label-position="left" hide-required-asterisk>
                          <el-form-item label="Key" prop="key" inline-message>
                            <el-input
                              size="small"
                              type="text"
                              v-model="row.key"
                              placeholder="Key"
                            ></el-input>
                          </el-form-item>
                        </el-form>
                      </template>
                    </el-table-column>
                    <el-table-column>
                      <template slot-scope="{ row }">
                        <el-form :model="row" :rules="keyCheckRule" ref="addValueForm" label-position="left" hide-required-asterisk>
                          <el-form-item label="Value" prop="value" inline-message>
                            <VariableEditor style="line-height: 22px;" :varKey="row.key" :value.sync="row.value" />
                          </el-form-item>
                        </el-form>
                      </template>
                    </el-table-column>
                    <el-table-column width="150">
                      <template>
                        <span style="display: inline-block; margin-bottom: 15px;">
                          <el-button @click="addRenderKey()" type="text">{{$t('global.confirm')}}</el-button>
                          <el-button @click="addKeyInputVisable=false" type="text">{{$t(`global.cancel`)}}</el-button>
                        </span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div v-hasPermi="{projectName: projectName, action: 'edit_service'}">
                  <el-button size="medium" class="add-kv-btn" @click="addKeyInputVisable=true" type="text">
                    <i class="el-icon-circle-plus-outline"></i>{{$t('global.add')}}
                  </el-button>
                </div>
              </div>
            </section>
          </div>
        </div>
        <div v-if="selected === 'policy'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.policySection')}}</div>
          </header>
          <div class="service-aside-help__content">
            <Policy :service="serviceModules" />
          </div>
        </div>
        <div v-if="selected === 'help'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.helpSection')}}</div>
          </header>
          <div class="service-aside-help__content">
            <Help />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import {
  serviceTemplateWithConfigAPI,
  getSingleProjectAPI,
  updateEnvTemplateAPI,
  getRegistryWhenBuildAPI,
  getCodeProviderAPI
} from '@api'
import CommonBuild from '@/components/projects/build/commonBuild.vue'
import Help from './container/help.vue'
import Policy from './container/policy.vue'
import IntegrationCode from '../common/integrationCode.vue'
import IntegrationRegistry from '@/components/projects/common/integrationRegistry.vue'

import qs from 'qs'

const validateKey = (rule, value, callback) => {
  if (typeof value === 'undefined' || value === '') {
    callback(new Error('请输入 Key'))
  } else {
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      callback(new Error('Key 只支持字母大小写和数字，特殊字符只支持下划线'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      allRegistry: [],
      serviceModules: this.detectedServices,
      sysEnvs: this.systemEnvs,
      customEnvs: this.detectedEnvs,
      addKeyInputVisable: false,
      integrationCodeDrawer: false,
      editEnvIndex: {},
      projectForm: {},
      addKeyData: [
        {
          key: '',
          value: '',
          state: 'unused'
        }
      ],
      keyCheckRule: {
        key: [
          {
            type: 'string',
            required: true,
            validator: validateKey,
            trigger: 'blur'
          }
        ],
        value: [
          {
            type: 'string',
            required: false,
            message: 'value',
            trigger: 'blur'
          }
        ]
      },
      registryCreateVisible: false,
      buildNameIndex: 0
    }
  },
  methods: {
    async addBuild (item) {
      // no build: no suffix
      // build: the last number, take the maximum value + 1
      this.buildNameIndex = item.build_names.length
        ? Math.max.apply(
          null,
          item.build_names.map(buildName => {
            const names = buildName.split('-')
            const last = names[names.length - 1]
            return isNaN(last) ? 1 : Number(last) + 1
          })
        )
        : 0
      const key = this.$utils.rsaEncrypt()
      const res = await getCodeProviderAPI(key)
      if (res && res.length > 0) {
        this.$router.push(
          `${this.buildBaseUrl}?rightbar=build&service_name=${item.name}&build_add=true`
        )
      } else {
        this.integrationCodeDrawer = true
      }
    },
    followUpFn () {
      this.$emit('getServiceModules')
      this.$router.replace({
        query: Object.assign(
          {},
          qs.parse(window.location.search, { ignoreQueryPrefix: true }),
          {
            rightbar: 'var'
          }
        )
      })
    },
    getProject () {
      const projectName = this.projectName
      getSingleProjectAPI(projectName).then(res => {
        this.projectForm = res
        this.customEnvs = res.vars
        if (res.team_id === 0) {
          this.projectForm.team_id = null
        }
      })
    },
    getServiceTemplateWithConfig () {
      if (
        this.service &&
        this.service.type === 'k8s' &&
        this.service.status === 'added'
      ) {
        serviceTemplateWithConfigAPI(
          this.service.service_name,
          this.projectNameOfService
        ).then(res => {
          this.serviceModules = res.service_module
          this.sysEnvs = res.system_variable
          this.$store.dispatch('queryk8sService', res)
        })
      }
      if (this.service.status === 'named') {
        this.changeRoute('var')
      }
    },
    changeRoute (step) {
      this.$route.query.service_project_name &&
        delete this.$route.query.service_project_name
      this.$route.query.build_name && delete this.$route.query.build_name
      this.$router.replace({
        query: Object.assign({}, this.$route.query, {
          rightbar: step
        })
      })
    },

    checkExistVars () {
      return new Promise((resolve, reject) => {
        const isDuplicate = this.detectedEnvs
          .map(item => {
            return item.key
          })
          .some((item, idx) => {
            return (
              this.detectedEnvs
                .map(item => {
                  return item.key
                })
                .indexOf(item) !== idx
            )
          })
        if (isDuplicate) {
          this.$message({
            message: '变量列表中存在相同的 Key 请检查后再保存',
            type: 'warning'
          })
          reject(new Error('cancel save'))
        } else {
          resolve()
        }
      })
    },
    updateEnvTemplate (projectName, payload, verbose) {
      updateEnvTemplateAPI(projectName, payload).then(res => {
        bus.$emit('refresh-service')
        if (verbose) {
          this.$notify({
            title: '保存成功',
            message: '变量列表保存成功',
            type: 'success'
          })
        }
      })
    },
    addRenderKey () {
      if (this.addKeyData[0].key !== '') {
        this.$refs.addKeyForm.validate(valid => {
          if (valid) {
            this.customEnvs.push(this.$utils.cloneObj(this.addKeyData[0]))
            this.projectForm.vars = this.customEnvs
            this.checkExistVars()
              .then(() => {
                this.updateEnvTemplate(this.projectName, this.projectForm)
                this.addKeyData[0].key = ''
                this.addKeyData[0].value = ''
              })
              .catch(() => {
                this.addKeyData[0].key = ''
                this.addKeyData[0].value = ''
                this.$refs.addKeyForm.resetFields()
                this.$refs.addValueForm.resetFields()
                this.addKeyInputVisable = false
                console.log('error')
              })
          } else {
            return false
          }
        })
      }
    },
    editRenderKey (index, state) {
      this.$set(this.editEnvIndex, index, true)
    },
    saveRenderKey (index, state) {
      this.$set(this.editEnvIndex, index, false)
      this.projectForm.vars = this.customEnvs
      this.updateEnvTemplate(this.projectName, this.projectForm)
    },
    deleteRenderKey (index, state) {
      if (state === 'present') {
        this.$confirm('该 Key 被产品引用，确定删除', '提示', {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        })
          .then(() => {
            this.customEnvs.splice(index, 1)
            this.projectForm.vars = this.customEnvs
            this.updateEnvTemplate(this.projectName, this.projectForm)
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消删除'
            })
          })
      } else {
        this.customEnvs.splice(index, 1)
        this.projectForm.vars = this.customEnvs
        this.updateEnvTemplate(this.projectName, this.projectForm)
      }
    },
    getRegistryWhenBuild () {
      getRegistryWhenBuildAPI(this.projectName).then(res => {
        this.allRegistry = res
      })
    }
  },
  created () {
    this.getProject()
    this.getServiceTemplateWithConfig()
    if (this.$route.query.rightbar) {
      this.changeRoute(this.$route.query.rightbar)
    } else {
      this.changeRoute('var')
    }
    bus.$on(`save-var`, () => {
      this.projectForm.vars = this.detectedEnvs
      this.updateEnvTemplate(this.projectName, this.projectForm)
    })
    this.getRegistryWhenBuild()
  },
  beforeDestroy () {
    bus.$off('save-var')
  },
  props: {
    detectedEnvs: {
      required: false,
      type: Array
    },
    detectedServices: {
      required: false,
      type: Array
    },
    systemEnvs: {
      required: false,
      type: Array
    },
    service: {
      required: false,
      type: Object
    },
    services: {
      required: false,
      type: Array
    },
    buildBaseUrl: {
      required: true,
      type: String
    },
    changeEditorWidth: Function
  },
  watch: {
    detectedServices (val) {
      this.serviceModules = val
    },
    systemEnvs (val) {
      this.sysEnvs = val
    },
    detectedEnvs (val) {
      this.customEnvs = val
    },
    service (val) {
      if (val) {
        this.getServiceTemplateWithConfig()
        this.changeRoute('var')
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    projectNameOfService () {
      return this.service.product_name
    },
    serviceType () {
      return 'k8s'
    },
    selected () {
      const defaultAside = this.service.status === 'named' ? 'help' : 'var'
      const selected = this.$route.query.rightbar || defaultAside
      if (selected === 'build') {
        this.changeEditorWidth('30%')
      } else {
        this.changeEditorWidth('50%')
      }
      return selected
    }
  },
  components: {
    CommonBuild,
    Policy,
    Help,
    IntegrationCode,
    IntegrationRegistry
  }
}
</script>
<style lang="less">
.aside__wrap {
  position: relative;
  display: flex;
  flex: 1;
  height: 100%;

  .kv-container {
    .el-table {
      .unused {
        background: #e6effb;
      }

      .present {
        background: #fff;
      }

      .new {
        background: oldlace;
      }
    }

    .el-table__row {
      .cell {
        span {
          font-weight: 400;
        }

        .operate {
          font-size: 1.12rem;

          .delete {
            color: #ff1949;
          }

          .edit {
            color: @themeColor;
          }
        }
      }
    }

    .render-value {
      display: block;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .add-key-container {
      .el-form-item__label {
        display: none;
      }

      .el-form-item {
        margin-bottom: 15px;
      }
    }

    .add-kv-btn {
      margin-top: 10px;
    }
  }

  .service-aside-right--resizable {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;
    width: 5px;
    height: 100%;
    border-left: 1px solid transparent;
    transition: border-color ease-in-out 200ms;
  }

  .aside__inner {
    display: flex;
    flex: 1;
    flex-direction: row-reverse;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);

    .aside__content {
      flex: 1;
      width: 200px;
      overflow-x: hidden;
      background-color: #fff;

      .service-aside--variables {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        height: 100%;

        .service-aside-box__header {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 35px;
          padding: 10px 7px 10px 20px;

          .service-aside-box__title {
            margin-right: 20px;
            margin-bottom: 0;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
          }
        }

        .service-aside-box__content {
          flex-grow: 1;
          overflow-x: hidden;
          overflow-y: auto;

          .aside-section {
            position: relative;
            padding: 12px 16px;

            h4 {
              margin: 0;
              padding: 0;
              color: #909399;
              font-weight: 300;
            }

            .el-table td,
            .el-table th {
              padding: 6px 0;
            }

            .build-name {
              display: inline-block;
              margin-top: 5px;
              font-size: 12px;
              line-height: 16px;
            }
          }

          .create-footer {
            right: 47px;
          }
        }

        .service-aside-help__content {
          display: flex;
          flex: 1;
          flex-direction: column;
          height: 100%;
          padding: 0 20px 10px 20px;
          overflow-y: auto;
        }
      }
    }

    .aside-bar {
      .tabs__wrap_vertical {
        flex-direction: column;
        width: 47px;
        height: 100%;
        background-color: #f5f5f5;
        border: none;

        .tabs__item {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: -1px;
          padding: 20px 17px;
          color: #000;
          font-size: 13px;
          text-transform: uppercase;
          text-orientation: mixed;
          background-color: #f5f5f5;
          border: none;
          border-top: 1px solid transparent;
          cursor: pointer;
          transition: background-color 150ms ease, color 150ms ease;

          &.selected {
            z-index: 1;
            background-color: #fff;
            border: none;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          &:hover {
            z-index: 2;
            color: #000;
            background-color: #fff;
            border: none;
            border-top: 1px solid #f5f5f5;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          .step-name {
            font-weight: 500;
            font-size: 14px;
            writing-mode: vertical-rl;
          }
        }
      }

      .tabs__wrap {
        display: flex;
        justify-content: flex-start;
        height: 56px;
      }
    }
  }
}

.theme-color {
  color: @themeColor;
}
</style>
