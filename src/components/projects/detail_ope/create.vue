<template>
  <el-dialog :fullscreen="true" custom-class="create-project" :before-close="handleClose" :visible.sync="dialogVisible">
    <header class="project-contexts-modal__header">{{isEdit?'修改项目信息':'新建项目'}}</header>
    <section class="project-contexts-modal__content">
      <el-form
        :model="projectForm"
        :rules="rules"
        label-position="right"
        ref="projectForm"
        label-width="120px"
        class="demo-projectForm"
        inline-message
      >
        <el-form-item :label="$t(`workflow.projectName`)" prop="project_name">
          <el-input @keyup.native="()=>projectForm.project_name=projectForm.project_name.trim()" v-model="projectForm.project_name"></el-input>
        </el-form-item>
        <el-form-item label="项目主键" prop="product_name" class="label-icon">
          <span slot="label">
            项目标识
            <el-tooltip effect="dark" content="项目标识是该项目资源的全局唯一标识符，用于该项目下所有资源的引用与更新，默认自动生成，同时支持手动指定，创建后不可更改" placement="top">
              <i class="el-icon-question" style="margin-left: 5px;"></i>
            </el-tooltip>
          </span>
          <el-input :disabled="!showProjectName" v-model="projectForm.product_name"></el-input>
          <span v-if="!isEdit" @click="editProjectName = editProjectName ? false : true" class="edit-btn">
            <i :class="[editProjectName ? 'el-icon-finished' : 'el-icon-edit-outline']"></i>
          </span>
        </el-form-item>
        <el-form-item prop="desc" label="描述信息">
          <el-input type="textarea" :rows="1" placeholder="请输入描述信息" v-model="projectForm.desc"></el-input>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="项目类型">
          <div class="project-type">
            <div
              class="project-type-item"
              v-for="typeItem in projectTypeList"
              :key="typeItem.type"
              @click="switchType(typeItem.type)"
              :class="{selected: projectType === typeItem.type}"
            >
              <i class="type-icon" :class="[projectType === typeItem.type ? 'el-icon-success selected' : typeItem.icon]"></i>
              <div class="project-type-item__desc">
                <div class="title">{{ typeItem.title }}</div>
                <div class="desc">{{ typeItem.firstDesc }}</div>
                <div class="desc">{{ typeItem.secondDesc }}</div>
              </div>
            </div>
          </div>
          <div class="type-link">
            <i class="icon el-icon-warning-outline"></i>
            <el-link
              type="primary"
              href="https://docs.koderover.com/zadig/pages/compatibility/"
              target="_blank"
              :underline="false"
            >支持的基础设施列表</el-link>
          </div>
        </el-form-item>
        <div v-if="!isEdit" class="advanced-title">
          <el-button type="text" @click="showAdvanced = !showAdvanced">
            高级配置
            <i :class="{'el-icon-arrow-right': !showAdvanced, 'el-icon-arrow-down': showAdvanced }"></i>
          </el-button>
        </div>
        <div v-show="showAdvanced || isEdit">
          <el-form-item label="访问权限" prop="public">
            <el-select v-model="projectForm.public" popper-class="access-permission">
              <el-option label="私有" :value="false">
                <div class="title">私有</div>
                <div class="desc">该项目对系统普通用户默认不可见，项目管理员可通过添加成员对特定用户添加相应权限。</div>
              </el-option>
              <el-option label="公开" :value="true">
                <div class="title">公开</div>
                <div class="desc">用户默认享有公开权限，可查看项目中的工作流、环境、服务、构建、测试等资源。</div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="项目管理员" v-if="!isEdit" prop="admins">
            <el-select v-model="projectForm.admins" filterable multiple remote :remote-method="remoteMethod" :loading="loading" placeholder="请输入用户名搜索用户">
              <el-option
                v-for="user in users"
                :key="user.uid"
                :label="user.name ? `${user.account}(${user.name})` : user.account"
                :value="user.uid"
              >
                <span v-if="user.identity_type">
                  <i class="iconfont" :class="'icon'+user.identity_type"></i>
                  <span>{{user.name ? `${user.account}(${user.name})` : user.account}}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="!isEdit" label="指定集群" prop="cluster_ids">
            <el-select filterable multiple clearable v-model="projectForm.cluster_ids" placeholder="选择项目使用的集群资源">
              <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
            </el-select>
          </el-form-item>
        </div>
      </el-form>
    </section>
    <footer class="project-contexts-modal__footer">
      <el-button type="primary" @click="submitForm('projectForm')">{{isEdit?'确认修改':'立即新建'}}</el-button>
    </footer>
  </el-dialog>
</template>
<script>
import {
  usersAPI,
  createProjectAPI,
  getSingleProjectAPI,
  updateSingleProjectAPI,
  getClusterListAPI
} from '@api'
const pinyin = require('pinyin')
const validateProductName = (rule, value, callback) => {
  if (typeof value === 'undefined' || value === '') {
    callback(new Error('填写项目主键'))
  } else {
    if (!/^[a-z0-9-]+$/.test(value)) {
      callback(new Error('项目主键只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      dialogVisible: true,
      users: [],
      loading: false,
      editProjectName: false,
      radio: true,
      projectForm: {
        project_name: '',
        product_name: '',
        admins: [],
        cluster_ids: [],
        desc: '',
        enabled: true,
        public: false,
        product_feature: {
          basic_facility: 'kubernetes',
          deploy_type: 'k8s',
          create_env_type: 'system'
        }
      },
      rules: {
        project_name: [
          { required: true, message: '请输入项目名称', trigger: 'blur' }
        ],
        product_name: [
          { required: true, trigger: 'change', validator: validateProductName }
        ],
        admins: [
          {
            type: 'array',
            required: true,
            message: '请选择项目管理员',
            trigger: 'change'
          }
        ],
        cluster_ids: [
          {
            type: 'array',
            required: true,
            message: '请选择集群资源',
            trigger: 'change'
          }
        ],
        enabled: [
          {
            type: 'boolean',
            required: true,
            message: '请选择项目是否启用项目',
            trigger: 'change'
          }
        ],
        public: [
          { required: true, message: '项目权限不能为空', trigger: 'blur' }
        ]
      },
      allCluster: [],
      showAdvanced: false,
      projectTypeList: [
        {
          type: 'k8s', // can't be modified
          title: 'K8s YAML 项目',
          firstDesc: '基础设施使用 Kubernetes',
          secondDesc: '使用 Kubernetes YAML 管理和部署服务',
          icon: 'iconfont iconk8s'
        },
        {
          type: 'helm',
          title: 'K8s Helm Chart 项目',
          firstDesc: '基础设施使用 Kubernetes',
          secondDesc: '使用 Helm Chart 管理和部署服务',
          icon: 'iconfont iconhelmrepo'
        },
        {
          type: 'external',
          title: 'K8s 托管项目',
          firstDesc: '托管现有 Kubernetes 集群中的资源',
          secondDesc: '支持服务镜像的更新',
          icon: 'iconfont iconvery-trustee'
        },
        {
          type: 'host',
          title: '主机项目',
          firstDesc: '基础设施使用主机',
          secondDesc: '使用自定义脚本部署升级服务',
          icon: 'iconfont iconzhuji'
        }
      ]
    }
  },
  methods: {
    switchType (type) {
      this.projectForm.product_feature = {
        basic_facility: 'kubernetes',
        create_env_type: 'system',
        deploy_type: 'k8s'
      }
      const feature = this.projectForm.product_feature
      switch (type) {
        case 'k8s':
          break
        case 'helm':
          feature.deploy_type = 'helm'
          break
        case 'external':
          feature.create_env_type = 'external'
          break
        case 'host':
          feature.basic_facility = 'cloud_host'
          break
      }
    },
    getUsers () {
      const payload = {
        page: 1,
        per_page: 200
      }
      usersAPI(payload).then(res => {
        this.users = res.users
      })
    },
    remoteMethod (query) {
      if (query !== '') {
        this.loading = true
        const payload = {
          name: query
        }
        usersAPI(payload).then(res => {
          this.loading = false
          this.users = res.users
        })
      } else {
        this.getUsers()
      }
    },
    handleClose () {
      if (this.isEdit) {
        this.$router.push(`/v1/projects/detail/${this.projectName}/detail`)
      } else {
        this.$router.push('/v1/projects')
      }
    },
    createProject (payload) {
      createProjectAPI(payload).then(res => {
        this.$message({
          type: 'success',
          message: '新建项目成功'
        })
        this.$store.dispatch('getProjectList')
        if (payload.product_feature.basic_facility === 'kubernetes') {
          if (payload.product_feature.create_env_type === 'external') {
            this.$router.push(
              `/v1/projects/create/${payload.product_name}/host/config?step=1`
            )
            return
          }
          if (payload.product_feature.deploy_type === 'k8s') {
            this.$router.push(
              `/v1/projects/create/${payload.product_name}/k8s/info?rightbar=step`
            )
          }
          if (payload.product_feature.deploy_type === 'helm') {
            this.$router.push(
              `/v1/projects/create/${payload.product_name}/helm/info?rightbar=step`
            )
          }
        } else if (payload.product_feature.basic_facility === 'cloud_host') {
          this.$router.push(
            `/v1/projects/create/${payload.product_name}/pm/info`
          )
        }
      })
    },
    updateSingleProject (projectName, payload) {
      updateSingleProjectAPI(projectName, payload).then(res => {
        this.$message({
          type: 'success',
          message: '更新项目成功'
        })
        this.$store.dispatch('getProjectList')
        this.$router.push('/v1/projects')
      })
    },
    getProject (projectName) {
      getSingleProjectAPI(projectName).then(res => {
        this.projectForm = res
        if (res.team_id === 0) {
          this.projectForm.team_id = null
        }
      })
    },
    submitForm (formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          if (this.isEdit) {
            this.updateSingleProject(
              this.projectForm.product_name,
              this.projectForm
            )
          } else {
            if (
              this.projectForm.product_feature.basic_facility === 'cloud_host'
            ) {
              this.projectForm.product_feature.deploy_type = 'k8s'
              this.projectForm.product_feature.create_env_type = 'system'
            }
            this.createProject(this.projectForm)
          }
        } else {
          return false
        }
      })
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    getCluster () {
      getClusterListAPI().then(res => {
        this.allCluster = res
        this.projectForm.cluster_ids = res.map(cluster => cluster.id)
      })
    }
  },
  watch: {
    'projectForm.project_name': {
      handler (val, old_val) {
        if (!this.isEdit) {
          this.projectForm.product_name = pinyin(val, {
            style: pinyin.STYLE_NORMAL
          }).join('')
        }
      }
    }
  },
  computed: {
    currentUserId () {
      return this.$store.state.login.userinfo.uid
    },
    isEdit () {
      return this.$route.path.includes('/projects/edit')
    },
    showProjectName () {
      return !this.isEdit && this.editProjectName
    },
    projectName () {
      if (this.isEdit) {
        return this.$route.params.project_name
      } else {
        return false
      }
    },
    projectType () {
      const feature = this.projectForm.product_feature
      if (feature.basic_facility === 'cloud_host') {
        return 'host'
      } else if (feature.create_env_type === 'external') {
        return 'external'
      } else if (feature.deploy_type === 'helm') {
        return 'helm'
      } else {
        return 'k8s'
      }
    }
  },
  mounted () {
    if (this.isEdit) {
      this.getProject(this.projectName)
    } else {
      this.getUsers()
      this.getCluster()
      this.projectForm.admins.push(this.currentUserId)
    }
  }
}
</script>

<style lang="less" scoped>
@itemWidth: 400px;

.tooltip-key {
  display: inline-block;
  width: 130px;
}

/deep/.el-dialog__header {
  padding: 0;
}

/deep/.el-dialog__body {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: calc(~'100% - 20px');
  padding: 15px 20px 10px;
}

.create-project {
  .icon {
    cursor: pointer;
  }

  .project-contexts-modal__header {
    width: 80%;
    min-width: 800px;
    margin: 0 auto 16px;
    padding-bottom: 14px;
    font-weight: 300;
    font-size: 18px;
    line-height: 22px;
    text-align: center;
    border-bottom: 1px solid rgba(210, 210, 210, 0.5);
  }

  .project-contexts-modal__content {
    flex: 1 0 auto;
    margin-left: calc(~'50% - 300px');

    /deep/.el-form {
      &.demo-projectForm {
        .el-input,
        .el-select,
        .el-textarea {
          width: @itemWidth;
          font-weight: 300;

          .el-input {
            width: 100%;
          }

          .el-textarea__inner {
            height: 40px;
            line-height: 30px;
          }
        }
      }

      .el-form-item__label {
        font-weight: 300;
      }

      .el-form-item {
        margin-bottom: 8px;
        font-weight: 300;

        .el-form-item__content {
          line-height: 38px;

          .type-link {
            line-height: 22px;

            .icon {
              margin-right: 5px;
              color: #a0a0a0;
              font-size: 16px;
              vertical-align: text-bottom;
            }

            .el-link {
              font-weight: 300;
              font-size: 12px;
            }
          }
        }
      }

      .edit-btn {
        display: inline-block;
        margin-left: 6px;
        padding: 0 8px;
        font-size: 16px;
        line-height: 28px;
        border: 1px solid rgba(118, 122, 200, 0.5);
        border-radius: 4px;
        cursor: pointer;
      }

      .project-type {
        box-sizing: border-box;
        width: @itemWidth;
        padding: 8px;
        line-height: 22px;
        background: rgba(160, 160, 255, 0.01);
        border: 1px solid rgba(210, 215, 220, 0.3);
        border-radius: 4px;

        .project-type-item {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          padding: 8px 0;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;

          &:not(:last-child) {
            margin-bottom: 2px;
          }

          .project-type-item__desc {
            .title {
              margin-bottom: 5px;
              color: #000;
              font-size: 14px;
            }

            .desc {
              color: #a0a0a0;
              font-size: 12px;
              line-height: 20px;
            }
          }

          .type-icon {
            flex: 0 0 74px;
            font-size: 24px;
            text-align: center;

            &.selected {
              color: @themeColor;
            }
          }

          &:hover {
            background: #fafafc;
          }

          &.selected {
            background: #fafafc;
            border-color: @themeColor;

            .project-type-item__desc {
              .title {
                color: @projectNameColor;
              }

              .desc {
                color: #4a4a4a;
              }
            }

            .icon {
              color: @themeColor;
              font-size: 20px;
            }
          }
        }
      }

      .advanced-title {
        .el-button {
          padding: 6px 0;
          font-weight: 300;
        }
      }
    }

    .small-title {
      color: #ccc;
      font-size: 12px;
    }

    .el-radio--mini {
      &.is-bordered {
        width: 135px;
        margin-right: 0;
      }
    }
  }

  .project-contexts-modal__footer {
    width: 80%;
    min-width: 800px;
    margin: 16px auto 0;
    padding-top: 14px;
    text-align: center;
    border-top: 1px solid rgba(210, 210, 210, 0.5);
  }
}
</style>

<style lang="less">
@itemWidth: 400px;

.access-permission {
  width: @itemWidth;

  .el-select-dropdown__item {
    height: auto;
    padding: 8px 20px;
    font-weight: 400;
    line-height: 22px;
    white-space: normal;

    &:not(:last-child) {
      border-bottom: 1px solid rgba(210, 210, 210, 0.5);
    }

    .title {
      font-size: 14px;
    }

    .desc {
      margin-top: 8px;
      color: #a0a0a0;
      font-size: 12px;
    }

    &.selected {
      color: @themeColor;

      .desc {
        color: inherit;
      }
    }
  }
}
</style>
