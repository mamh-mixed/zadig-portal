<template>
  <div class="import-from-namespace-container">
    <el-dialog
      title="从 Kubernetes 命名空间导入"
      :close-on-click-modal="false"
      append-to-body
      center
      width="720px"
      label-position="left"
      custom-class="dialog-import-from-namespace"
      :visible="dialogImportFromNamespaceVisible"
      @update:visible="$emit('update:dialogImportFromNamespaceVisible', $event)"
      :before-close="closeDialog"
    >
      <el-form
        ref="importK8sNamespaceRefRef"
        :model="importNamespace"
        :rules="rules"
        label-width="120px"
        label-position="left"
        class="primary-form"
      >
        <el-form-item label="选择集群" prop="cluster_id">
          <el-select filterable v-model="importNamespace.cluster_id" placeholder="请选择集群" @change="changeCluster" size="small">
            <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="选择命名空间" prop="namespace">
          <el-select filterable v-model="importNamespace.namespace" placeholder="请选择命名空间" @change="changeNamespace" size="small">
            <el-option v-for="(ns,index) in hostingNamespace" :key="index" :label="ns.name" :value="ns.name"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <el-table :data="importNamespace.services" style="width: 100%;">
        <el-table-column width="200px">
          <template slot="header">
            <span>服务名称</span>
            <el-button type="text" icon="el-icon-plus" style="margin-left: 5px; padding: 0;" @click="operateService('add')"></el-button>
          </template>
          <template slot-scope="{ row, $index }">
            <el-input v-model="row.name" placeholder="输入服务名称" size="small" style="width: 85%;"></el-input>
            <el-button type="text" icon="el-icon-minus" style="margin-left: 5px;" @click="operateService('delete', $index)"></el-button>
          </template>
        </el-table-column>
        <el-table-column label="选择配置">
          <template slot-scope="{ row }">
            <div v-for="(workload, index) in row.workloads_map" :key="index">
              <div style=" display: inline-block; width: 30%;">
                <span v-if="workload.type" style=" display: inline-block; width: 100%;">{{ workload.type }}</span>
                <el-select v-else v-model="workload.type" placeholder="选择资源" size="small">
                  <el-option
                    v-for="item in difference(Object.keys(workloadsMap), row.workloads_map.map(work => work.type))"
                    :key="item"
                    :label="item"
                    :value="item"
                  ></el-option>
                </el-select>
              </div>
              <el-select v-model="workload.configs" placeholder="选择配置" multiple collapse-tags filterable size="small">
                <el-option v-for="item in workload.configs" :key="item" :label="item" :value="item"></el-option>
                <el-option v-for="item in (remainingConfig[workload.type] || [])" :key="item" :label="item" :value="item"></el-option>
              </el-select>
              <el-button
                type="text"
                :icon="index < row.workloads_map.length-1 ? 'el-icon-minus' : 'el-icon-plus'"
                style="margin-left: 5px;"
                @click="operateConfig(index < row.workloads_map.length-1 ? 'delete' : 'add', row.workloads_map, index)"
              ></el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button plain native-type="submit" @click="closeDialog()" size="small" :disabled="importLoading">取消</el-button>
        <el-button
          type="primary"
          native-type="submit"
          size="small"
          class="start-create"
          :loading="importLoading"
          @click="loadServiceFromKubernetesNamespace"
        >导入</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {
  getClusterListAPI,
  productHostingNamespaceAPI,
  getConfigFromNamespaceAPI,
  createServiceFromK8sNamespaceAPI
} from '@api'

import { cloneDeep, difference } from 'lodash'

const workloadsMapInfo = {
  configmap: [],
  deployment: [],
  statefulset: [],
  ingress: [],
  secret: [],
  pvc: [],
  service: []
}

export default {
  data () {
    return {
      allCluster: [],
      hostingNamespace: [],
      rules: {
        cluster_id: {
          required: true,
          message: '请选择集群',
          trigger: ['change']
        },
        namespace: {
          required: true,
          message: '请选择命名空间',
          trigger: ['change']
        }
      },
      importNamespace: {
        cluster_id: '',
        namespace: '',
        product_name: '',
        visibility: 'private',
        type: 'k8s',
        services: [] // {name: '', workloads_map: [{ type: '', configs: []}]}
      },
      workloadsMap: cloneDeep(workloadsMapInfo),
      difference,
      importLoading: false
    }
  },
  props: {
    projectName: {
      type: String,
      required: true
    },
    dialogImportFromNamespaceVisible: {
      type: Boolean,
      default: false
    },
    importServiceFromNamespaceSuccess: Function
  },
  methods: {
    closeDialog (done) {
      this.$refs.importK8sNamespaceRefRef.resetFields()
      this.importNamespace = {
        cluster_id: '',
        namespace: '',
        product_name: this.projectName,
        visibility: 'private',
        type: 'k8s',
        services: []
      }
      this.$emit('update:dialogImportFromNamespaceVisible', false)
      this.importLoading = false
      done && done()
    },
    operateService (action, index) {
      if (action === 'add') {
        this.importNamespace.services.push({
          name: '',
          workloads_map: [{ type: '', configs: [] }]
        })
      } else if (action === 'delete') {
        this.importNamespace.services.splice(index, 1)
      }
    },
    operateConfig (action, workloadsMap, index) {
      if (action === 'add') {
        workloadsMap.push({
          type: '',
          configs: []
        })
      } else if (action === 'delete') {
        workloadsMap.splice(index, 1)
      }
    },
    getCluster () {
      getClusterListAPI(this.projectName).then(res => {
        this.allCluster = res.filter(element => {
          return element.status === 'normal'
        })
      })
    },
    changeCluster (clusterId) {
      this.importNamespace.namespace = ''
      this.importNamespace.services = []
      this.hostingNamespace = []
      productHostingNamespaceAPI(clusterId).then(res => {
        this.hostingNamespace = res
      })
    },
    changeNamespace () {
      this.importNamespace.services = []
      this.workloadsMap = cloneDeep(workloadsMapInfo)

      const namespace = this.importNamespace.namespace
      const clusterId = this.importNamespace.cluster_id
      getConfigFromNamespaceAPI(this.projectName, clusterId, namespace)
        .then(res => {
          this.workloadsMap = {
            ...cloneDeep(workloadsMapInfo),
            ...res.workloads_map
          }
        })
        .catch(() => {
          // todo: delete
          this.workloadsMap = {
            ...cloneDeep(workloadsMapInfo),
            ...{
              configmap: [
                'configmap1',
                'configmap2',
                'configmap3',
                'configmap4',
                'configmap5',
                'configmap6',
                'configmap7'
              ],
              deployment: [
                'deployment1',
                'deployment2',
                'deployment3',
                'deployment4',
                'deployment5',
                'deployment6',
                'deployment7'
              ],
              statefulset: [
                'statefulset1',
                'statefulset2',
                'statefulset3',
                'statefulset4',
                'statefulset5',
                'statefulset6',
                'statefulset7'
              ],
              ingress: [
                'ingress1',
                'ingress2',
                'ingress3',
                'ingress4',
                'ingress5',
                'ingress6',
                'ingress7'
              ],
              secret: [
                'secret1',
                'secret2',
                'secret3',
                'secret4',
                'secret5',
                'secret6',
                'secret7'
              ],
              pvc: ['pvc1', 'pvc2', 'pvc3', 'pvc4', 'pvc5', 'pvc6', 'pvc7'],
              service: [
                'service1',
                'service2',
                'service3',
                'service4',
                'service5',
                'service6',
                'service7'
              ]
            }
          }
        })
    },
    loadServiceFromKubernetesNamespace () {
      this.$refs.importK8sNamespaceRefRef.validate(() => {
        const payload = cloneDeep(this.importNamespace)
        payload.services = payload.services.map(service => {
          const workloads_map = {}
          service.workloads_map.forEach(workload => {
            workloads_map[workload.type] = workload.configs
          })
          return {
            name: service.name,
            workloads_map
          }
        })
        console.log('import:', this.importNamespace, payload)
        this.importLoading = true
        createServiceFromK8sNamespaceAPI(this.projectName, payload)
          .then(() => {
            this.importLoading = false
            this.$message.success('创建服务成功！')
            this.closeDialog()
            this.importServiceFromNamespaceSuccess()
          })
          .catch(() => {
            this.importLoading = false
          })
      })
    }
  },
  computed: {
    remainingConfig () {
      const workloadsMap = this.workloadsMap
      const remaining = cloneDeep(workloadsMapInfo)
      const current = cloneDeep(workloadsMapInfo)
      this.importNamespace.services.forEach(service => {
        service.workloads_map.forEach(workload => {
          if (workload.type) {
            current[workload.type] = [
              ...current[workload.type],
              ...workload.configs
            ]
          }
        })
      })
      for (const key in remaining) {
        remaining[key] = difference(workloadsMap[key], current[key])
      }
      return remaining
    }
  },
  mounted () {
    this.importNamespace.product_name = this.projectName
    this.getCluster()
  }
}
</script>
<style lang="less">
.dialog-import-from-namespace {
  .el-dialog__header {
    padding: 20px 20px 10px;
    font-size: 16px;
    border: 1px solid #d2d2d2;
  }

  .el-dialog__footer {
    padding: 0 20px 20px;
    text-align: right;
  }

  .el-dialog__body {
    padding: 30px 70px 0;
  }
}
</style>
