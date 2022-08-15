<template>
  <div class="webhook">
    <el-button type="primary" size="mini" icon="el-icon-plus" plain @click="addWebhook">添加</el-button>
    <el-row :gutter="20" class="webhook-row" v-for="(item,index) in webhooks" :key="index">
      <el-col :span="2">
        <div class="content">
          <el-switch v-model="item.enabled" active-color="#13ce66" @change="changeWebhookStatus(item)"></el-switch>
        </div>
      </el-col>
      <el-col :span="1">
        <div class="content">
          <span class="iconfont icongit"></span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="content">
          <div class="cate">
            <span class="title">名称：</span>
            <span class="desc">{{item.name}}</span>
          </div>
          <div class="cate">
            <span class="title">代码库：</span>
            <span class="desc">{{item.main_repo.repo_name + '/' + item.main_repo.branch}}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="9">
        <div class="content">
          <div class="cate">
            <span class="title">目标分支：</span>
            <span class="desc">{{item.main_repo.branch}}</span>
          </div>
          <div class="cate">
            <span class="title">触发事件：</span>
            <span class="desc">
              <div v-if="item.main_repo.events.length">
                <span v-for="(event,index) in item.main_repo.events" :key="index">
                  <span
                    v-if="item.main_repo.source === 'gerrit'"
                  >{{ triggerMethods.gerrit.find(tri => tri.value === event)?triggerMethods.gerrit.find(tri => tri.value === event).label: 'N/A' }}</span>
                  <span
                    v-else
                  >{{ triggerMethods.git.find(tri => tri.value === event)?triggerMethods.git.find(tri => tri.value === event).label: 'N/A' }}</span>
                  <span v-if="index !== item.main_repo.events.length - 1">,</span>
                </span>
              </div>
              <span v-else>{{ 'N/A' }}</span>
            </span>
          </div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="content">
          <div class="cate">
            <span class="title">描述：</span>
          </div>
          <div class="cate">
            <span class="desc">{{item.description}}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="2">
        <div class="content">
          <div class="operation">
            <span class="el-icon-edit" @click="editWebhook(item)"></span>
            <span class="el-icon-delete" @click="removeWebhook(index,item.name)"></span>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-dialog
      :visible.sync="dialogVisible"
      :title="editMode?'编辑触发器':'添加触发器'"
      width="700px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="webhookForm" :model="currentWebhook" label-width="90px" :rules="rules">
        <el-form-item label="名称" prop="name">
          <el-input size="small" autofocus ref="webhookNamedRef" :disabled="editMode" v-model="currentWebhook.name" placeholder="请输入名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input size="small" type="textarea" v-model="currentWebhook.description" placeholder="请输入描述"></el-input>
        </el-form-item>
        <el-form-item label="代码库" prop="repo">
          <el-select
            style="width: 100%;"
            v-model="currentWebhook.repo"
            size="small"
            @change="changeRepo"
            filterable
            allow-create
            clearable
            value-key="key"
            placeholder="请选择"
          >
            <el-option v-for="(repo,index) in webhookRepos" :key="index" :label="repo.repo_owner+'/'+repo.repo_name" :value="repo"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="目标分支" prop="main_repo.branch">
          <el-select
            style="width: 100%;"
            v-model="currentWebhook.main_repo.branch"
            size="small"
            filterable
            allow-create
            clearable
            placeholder="请选择分支"
          >
            <el-option
              v-for="(branch,index) in webhookBranches[currentWebhook.repo.repo_name]"
              :key="index"
              :label="branch.name"
              :value="branch.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentWebhook.main_repo.source==='gerrit'" label="触发事件" prop="main_repo.events">
          <el-checkbox-group v-model="currentWebhook.main_repo.events">
            <el-checkbox style="display: block;" label="change-merged">Change merged</el-checkbox>
            <el-checkbox style="display: block;" label="patchset-created">
              <span>Patchset created</span>
              <template v-if="currentWebhook.main_repo.events.includes('patchset-created')">
                <span style="color: #606266;">评分标签</span>
                <el-input size="mini" style="width: 250px;" v-model="currentWebhook.main_repo.label" placeholder="Code-Review"></el-input>
              </template>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-else-if="currentWebhook.main_repo.source!=='gerrit'" label="触发事件" prop="main_repo.events">
          <el-checkbox-group v-model="currentWebhook.main_repo.events">
            <el-checkbox v-for="tri in triggerMethods.git" :key="tri.value" :label="tri.value">{{ tri.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="触发策略" prop="auto_cancel">
          <el-checkbox v-model="currentWebhook.auto_cancel">
            <span>自动取消</span>
            <el-tooltip effect="dark" content="如果您希望只构建最新的提交，则使用这个选项会自动取消队列中的任务" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </el-checkbox>
          <el-checkbox v-if="currentWebhook.main_repo.source==='gerrit'" v-model="currentWebhook.check_patch_set_change">
            <span>代码无变化时不触发工作流</span>
            <el-tooltip effect="dark" content="例外情况说明：当目标代码仓配置为 Gerrit 的情况下，受限于其 API 的能力，当单行代码有变化时也不被触发" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </el-checkbox>
        </el-form-item>
        <template v-if="currentWebhook.main_repo.source!=='gerrit'">
          <el-form-item label="文件目录" prop="main_repo.match_folders">
            <el-input
              :autosize="{ minRows: 4, maxRows: 10}"
              type="textarea"
              v-model="currentWebhook.main_repo.match_folders"
              placeholder="输入目录时，多个目录请用回车换行分隔"
            ></el-input>
          </el-form-item>
          <ul style="padding-left: 120px; color: #909399; font-size: 12px; line-height: 20px;">
            <li>输入目录时，多个目录请用回车换行分隔</li>
            <li>"/" 表示代码库中的所有文件</li>
            <li>用 "!" 符号开头可以排除相应的文件</li>
          </ul>
        </template>
      </el-form>
      <div>
        <span>工作流执行变量</span>
        <WebhookRunConfig :workflowName="workflowName" :projectName="projectName" :cloneWorkflow="currentWebhook.workflow_arg" />
      </div>
      <div slot="footer">
        <el-button @click="dialogVisible = false" size="small">取 消</el-button>
        <el-button type="primary" @click="saveWebhook" size="small">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import WebhookRunConfig from './webhookRunConfig.vue'
import {
  getBranchInfoByIdAPI,
  addCustomWebhookAPI,
  getCustomWebhooksAPI,
  removeCustomWebhookAPI,
  updateCustomWebhookAPI,
  getCustomWebhookPresetAPI
} from '@api'
const validateName = (rule, value, callback) => {
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9_\-\.]*[a-zA-Z0-9])?$/.test(value)) {
    callback(
      new Error(
        "触发器名称仅支持数字字符、'-'、'_'、'.' 且开始结束只能是数字字符"
      )
    )
  } else {
    callback()
  }
}
const validateRepo = (rule, value, callback) => {
  if (Object.keys(value).length === 0) {
    callback(new Error('请选择代码库'))
  } else {
    callback()
  }
}
const webhookInfo = {
  check_patch_set_change: false, // gerrit 类型 codehost 需要配置，代码无变更是否跳过
  name: '',
  auto_cancel: false,
  enabled: true,
  description: '',
  repos: [],
  main_repo: {
    source: '',
    repo_owner: '',
    repo_namespace: '',
    repo_name: '',
    branch: '',
    tag: '',
    label: '', // gerrit 类型 codehost，event 包含 patchset-created 需要配置
    committer: '',
    match_folders: '/\n!.md',
    codehost_id: null,
    is_regular: false, // 是否正则匹配
    events: [
      // # gerrit 类型 codehost: patchset-created,change-merged,剩余类型 codehost: push, pull_request,tag
    ]
  },
  repo: {},
  workflow_arg: {}
}
export default {
  data () {
    return {
      dialogVisible: false,
      editMode: true,
      webhooks: [],
      currentWebhook: cloneDeep(webhookInfo),
      webhookBranches: {},
      webhookRepos: [],
      triggerMethods: {
        git: [
          {
            value: 'push',
            label: 'Push commits'
          },
          {
            value: 'pull_request',
            label: 'Pull requests'
          },
          {
            value: 'tag',
            label: 'Push tags'
          }
        ],
        gerrit: [
          {
            value: 'change-merged',
            label: 'Change merged'
          },
          {
            value: 'patchset-created',
            label: 'Patchset created'
          }
        ]
      },
      rules: {
        name: [{ trigger: 'change', required: true, validator: validateName }],
        repo: [{ trigger: 'change', required: true, validator: validateRepo }],
        'main_repo.branch': [
          {
            required: true,
            message: '请选择目标分支',
            trigger: ['blur', 'change']
          }
        ],
        'main_repo.events': [
          {
            required: true,
            message: '请选择触发事件',
            trigger: ['blur', 'change']
          }
        ],
        'main_repo.match_folders': [
          {
            required: true,
            message: '请输入文件目录',
            trigger: ['blur', 'change']
          }
        ]
      }
    }
  },
  props: {
    config: {
      type: Object,
      default: () => ({})
    },
    validObj: {
      required: false,
      type: Object,
      default: null
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    checkGitRepo () {
      return (
        this.currentWebhook &&
        ['gitlab', 'github'].includes(this.currentWebhook.source)
      )
    },
    workflowName () {
      return this.config.name
    }
  },
  methods: {
    validate () {
      return this.$refs.buildEnvRef.validate()
    },
    changeWebhookStatus (webhook) {
      const workflowName = this.workflowName
      updateCustomWebhookAPI(workflowName, webhook).then(() => {
        this.$message.success(
          `${webhook.name} 已${webhook.enabled ? '启用' : '禁用'}`
        )
        this.getWebhooks()
      })
    },
    getWebhooks () {
      getCustomWebhooksAPI(this.workflowName).then(res => {
        this.webhooks = res
      })
    },
    async addWebhook () {
      const workflowName = this.workflowName
      this.currentWebhook = cloneDeep(webhookInfo)
      const preset = await getCustomWebhookPresetAPI(workflowName)
      if (preset) {
        this.$set(this.currentWebhook, 'workflow_arg', cloneDeep(preset.workflow_arg))
        this.webhookRepos = preset.repos.map(item => {
          item.key = `${item.repo_owner}/${item.repo_name}`
          delete item.branch
          return item
        })
        this.editMode = false
        this.dialogVisible = true
      }
    },
    async editWebhook (item) {
      const workflowName = this.workflowName
      this.editMode = true
      const currentWebhook = cloneDeep(item)
      const triggerName = currentWebhook.name
      const preset = await getCustomWebhookPresetAPI(workflowName, triggerName)
      if (preset) {
        this.webhookRepos = preset.repos.map(item => {
          item.key = `${item.repo_owner}/${item.repo_name}`
          delete item.branch
          return item
        })
        this.$set(this.currentWebhook, 'workflow_arg', cloneDeep(preset.workflow_arg))
      }
      if (
        currentWebhook.main_repo.codehost_id &&
        currentWebhook.main_repo.repo_namespace &&
        currentWebhook.main_repo.repo_name
      ) {
        this.getBranchInfoById(
          currentWebhook.main_repo.codehost_id,
          currentWebhook.main_repo.repo_namespace,
          currentWebhook.main_repo.repo_name
        )
      }
      currentWebhook.repo = {
        key: `${currentWebhook.main_repo.repo_owner}/${currentWebhook.main_repo.repo_name}`,
        label: `${currentWebhook.main_repo.repo_owner}/${currentWebhook.main_repo.repo_name}`,
        repo_namespace: currentWebhook.main_repo.repo_namespace,
        repo_name: currentWebhook.main_repo.repo_name,
        repo_owner: currentWebhook.main_repo.repo_owner,
        codehost_id: currentWebhook.main_repo.codehost_id
      }
      currentWebhook.main_repo.match_folders = currentWebhook.main_repo
        .match_folders
        ? currentWebhook.main_repo.match_folders.join('\n')
        : '/\n!.md'
      this.currentWebhook = currentWebhook
      this.dialogVisible = true
    },
    removeWebhook (index, triggerName) {
      const workflowName = this.workflowName
      removeCustomWebhookAPI(workflowName, triggerName).then(res => {
        this.$message.success('删除成功')
        this.getWebhooks()
      })
    },
    saveWebhook () {
      this.$refs.webhookForm.validate(async valid => {
        if (valid) {
          const payload = cloneDeep(this.currentWebhook)
          payload.main_repo.match_folders = payload.main_repo.match_folders.split(
            '\n'
          )
          payload.main_repo = Object.assign(payload.main_repo, payload.repo)
          delete payload.repo
          const workflowName = this.workflowName
          if (this.editMode) {
            const result = await updateCustomWebhookAPI(workflowName, payload)
            if (result) {
              this.$message.success('修改成功')
              this.$refs.webhookForm.resetFields()
              this.dialogVisible = false
              this.getWebhooks()
            }
          } else {
            const result = await addCustomWebhookAPI(workflowName, payload)
            if (result) {
              this.$message.success('添加成功')
              this.$refs.webhookForm.resetFields()
              this.dialogVisible = false
              this.getWebhooks()
            }
          }
        } else {
          return false
        }
      })
    },
    getBranchInfoById (id, namespace, repoName) {
      if (!namespace) return
      getBranchInfoByIdAPI(id, namespace, repoName).then(res => {
        this.$set(this.webhookBranches, repoName, res)
      })
    },
    changeRepo (currentRepo) {
      this.getBranchInfoById(
        currentRepo.codehost_id,
        currentRepo.repo_namespace,
        currentRepo.repo_name
      )
    }
  },
  watch: {
    config: {
      handler (newValue, oldValue) {
        if (newValue) {
          this.$forceUpdate()
        }
      },
      deep: true
    }
  },
  created () {
    this.getWebhooks()
    this.validObj &&
      this.validObj.addValidate({
        name: 'webhook',
        valid: this.validate
      })
  },
  components: {
    WebhookRunConfig
  }
}
</script>

<style lang="less" scoped>
@secondaryColor: #b1b1b2;
@primaryColor: #000;

.webhook {
  .webhook-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 6px 0;
    border-bottom: 1px solid #ccc;

    &:last-child {
      border-bottom: none;
    }

    .content {
      display: flex;
      flex-direction: column;

      .cate {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        margin-bottom: 6px;

        &:last-child {
          margin-bottom: 0;
        }

        .title {
          color: @secondaryColor;
          font-weight: 400;
          font-size: 12px;
        }

        .desc {
          color: @primaryColor;
          font-weight: normal;
          font-size: 12px;
        }
      }

      .operation {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .el-icon-edit {
          color: @themeColor;
          cursor: pointer;
        }

        .el-icon-delete {
          color: #ff1949;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
