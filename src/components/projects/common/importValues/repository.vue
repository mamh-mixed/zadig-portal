<template>
  <div class="value-repo-container">
    <el-form
      :model="source"
      :rules="sourceRules"
      ref="repoForm"
      :show-message="false"
      status-icon
      label-position="right"
      :label-width="hiddenLabel ? '0px' : '140px'"
      class="value-repo-form"
      :class="{'hidden-label': hiddenLabel}"
    >
      <el-form-item prop="codehostID" label="代码源">
        <el-select
          v-model="source.codehostID"
          size="small"
          style="width: 100%;"
          placeholder="请选择代码源"
          @change="queryRepoOwnerById(source.codehostID)"
          filterable
          clearable
        >
          <el-option
            v-for="(host, index) in allCodeHosts"
            :key="index"
            :label="`${host.address} ${
                  host.type === 'github' ? '(' + host.namespace + ')' : ''
                }`"
            :value="host.id"
          >
            {{
            `${host.address}
            ${host.type === 'github' ? '(' + host.namespace + ')' : ''}`
            }}
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="owner" label="组织名/用户名">
        <el-select
          v-model="source.owner"
          size="small"
          style="width: 100%;"
          @change="getRepoNameById(source.codehostID, source.owner)"
          placeholder="请选择组织名/用户名"
          filterable
          clearable
        >
          <el-option v-for="(repo, index) in codeInfo['repoOwners']" :key="index" :label="repo.path" :value="repo.path"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="repo" label="代码库">
        <el-select
          @change="
                  getBranchInfoById(
                    source.codehostID,
                    source.owner,
                    source.repo
                  )
                "
          v-model.trim="source.repo"
          remote
          :remote-method="searchProject"
          style="width: 100%;"
          allow-create
          clearable
          size="small"
          placeholder="请选择代码库"
          filterable
        >
          <el-option v-for="(repo, index) in codeInfo['repos']" :key="index" :label="repo.name" :value="repo.name"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="branch" label="分支">
        <el-select v-model.trim="source.branch" placeholder="请选择分支" style="width: 100%;" size="small" filterable allow-create clearable>
          <el-option v-for="(branch, branch_index) in codeInfo['branches']" :key="branch_index" :label="branch.name" :value="branch.name"></el-option>
        </el-select>
      </el-form-item>
      <template v-if="fileType === 'valuesYaml'">
        <el-form-item>
          <template slot="label">
            <el-tooltip v-if="!substantial" effect="dark" content="按照覆盖顺序依次选择 values 文件，后选的文件会覆盖先选的文件。" placement="top">
              <span>文件路径</span>
            </el-tooltip>
            <span v-else>文件路径</span>
          </template>
          <div v-show="source.valuesPaths.length" class="overflow-auto">
            <div v-for="(path, index) in source.valuesPaths" :key="index">
              <span style="line-height: 18px;">{{path}}</span>
              <el-button v-if="!substantial" type="text" icon="el-icon-close" @click="deletePath(index)" style="padding: 1px 0 1px 0.5rem;"></el-button>
            </div>
          </div>
          <el-button :disabled="canSelectFile" type="primary" round plain size="mini" @click="showFileSelectDialog = true">选择 values 文件</el-button>
          <span v-show="showErrorTip" class="error-tip">请选择 values 文件</span>
        </el-form-item>
        <el-form-item v-if="showAutoSync" prop="autoSync" label="自动同步">
          <span slot="label">
            <span>自动同步</span>
            <el-tooltip effect="dark" content="开启后，Zadig 会定时从代码库拉取 Values 文件并将其自动更新到环境中，目前只支持 GitHub/GitLab" placement="top">
              <i class="pointer el-icon-question"></i>
            </el-tooltip>
          </span>
          <el-switch v-model="source.autoSync"></el-switch>
        </el-form-item>
      </template>
      <template v-else-if="fileType === 'k8sYaml'">
        <el-form-item prop="path" label="选择文件(夹)" :rules="{required: true, message: '请选择文件', trigger: 'change'}">
          {{ source.path }}
          <el-button @click="showFileSelectDialog = true" type="primary" icon="el-icon-plus" plain size="mini" circle></el-button>
        </el-form-item>
      </template>
      <el-dialog :title="typeObject[fileType].dialogTitle" :visible.sync="showFileSelectDialog" append-to-body>
        <TreeFile
          v-if="showFileSelectDialog"
          :gitRepoConfig="source"
          :getGitSource="getGitSource"
          @checkedPath="checkedPath"
          :checkOne="!substantial"
          :fileType="typeObject[fileType].fileType"
        ></TreeFile>
      </el-dialog>
    </el-form>
  </div>
</template>
<script>
import RepoMixin from '../mixin/importRepo'
import TreeFile from './treeFile.vue'
import { getBranchInfoByIdAPI } from '@api'
export default {
  props: {
    repoSource: Object,
    hiddenLabel: {
      default: false,
      type: Boolean
    },
    substantial: {
      default: false, // used to valuesYaml
      type: Boolean
    },
    fileType: {
      default: 'valuesYaml', // valuesYaml, k8sYaml
      type: String
    },
    showAutoSync: {
      default: false,
      type: Boolean
    }
  },
  mixins: [RepoMixin],
  data () {
    return {
      showFileSelectDialog: false,
      showErrorTip: false,
      typeObject: {
        valuesYaml: {
          dialogTitle: '请选择服务的 values 文件',
          fileType: '.yaml'
        },
        k8sYaml: {
          dialogTitle: '请选择要同步的文件或文件目录',
          fileType: ''
        }
      }
    }
  },
  computed: {
    canSelectFile () {
      const source = this.source
      return !(
        source.codehostID &&
        source.owner &&
        source.repo &&
        source.branch
      )
    }
  },
  watch: {
    repoSource: {
      handler (nVal, oldV) {
        this.source = nVal
      },
      immediate: true
    }
  },
  methods: {
    checkedPath (data) {
      this.showFileSelectDialog = false
      if (!data.length) {
        return
      }
      if (this.fileType === 'valuesYaml') {
        this.source.valuesPaths = data.map(d => d.full_path)
        if (this.source.valuesPaths.length) {
          this.showErrorTip = false
        }
      } else if (this.fileType === 'k8sYaml') {
        this.source.path = data[0].full_path
        this.source.isDir = data[0].is_dir
      }
    },
    deletePath (index) {
      this.source.valuesPaths.splice(index, 1)
    },
    validate () {
      const valid = []
      this.showErrorTip = false
      if (
        this.fileType === 'valuesYaml' &&
        this.source.valuesPaths.length === 0
      ) {
        this.showErrorTip = true
        valid.push(Promise.reject())
      } else if (this.fileType === 'k8sYaml' && this.source.path === '') {
        valid.push(Promise.reject())
      }
      valid.push(this.$refs.repoForm.validate())
      return Promise.all(valid)
    },
    // select set namespace
    getBranchInfoById (id, owner, repo, row) {
      this.source.branch = ''
      const repoItem = this.codeInfo.repos.find(item => {
        return item.name === repo
      })
      this.source.namespace = repoItem.namespace || ''
      if (repo && owner) {
        getBranchInfoByIdAPI(id, this.source.namespace, repo).then(res => {
          this.$set(this.codeInfo, 'branches', res)
        })
      }
    }
  },
  components: {
    TreeFile
  }
}
</script>
<style lang="less" scoped>
@import url('~@assets/css/common/scroll-bar.less');

.value-repo-container {
  .repo-attr {
    span {
      display: inline-block;
      width: 128px;
      margin-bottom: 20px;
      padding-right: 12px;
      line-height: 40px;
      text-align: right;
    }
  }

  /deep/.el-form {
    &.value-repo-form {
      .el-form-item {
        margin-bottom: 12px;
      }
    }

    &.hidden-label {
      .el-form-item__label {
        display: none;
      }
    }

    &.el-form--label-right {
      .el-form-item__label {
        text-align: right;
      }
    }
  }

  .overflow-auto {
    max-height: 90px;
    margin: 9px 0;
    overflow: auto;
    line-height: 20px;

    .blockScrollBar();
  }

  .error-tip {
    margin-top: 10px;
    color: #f56c6c;
    font-size: 12px;
    line-height: 1;
  }
}

.submit-button {
  text-align: center;
}
</style>
