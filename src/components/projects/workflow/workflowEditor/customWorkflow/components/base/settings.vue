<template>
  <div class="settings">
    <el-form :model="workflowInfo" ref="settings">
      <div class="mg-b16 title">运行策略</div>
      <el-form-item>
        <span class="mg-r16">
          <span class="text">并发运行</span>
          <el-tooltip effect="dark" content="当同时更新多个不同服务时，产生的多个任务将会并发执行，以提升工作流运行效率" placement="top">
            <i class="pointer el-icon-question"></i>
          </el-tooltip>
        </span>
        <el-switch v-model="workflowInfo.multi_run"></el-switch>
      </el-form-item>
      <div class="mg-b16 title">
        <span>共享目录</span>
        <el-button type="text" v-if="!workflowInfo.share_storages ||workflowInfo.share_storages.length===0" @click="addBuildEnv">添加</el-button>
      </div>
      <div v-if="workflowInfo.share_storages&&workflowInfo.share_storages.length>0">
        <el-row :gutter="10">
          <el-col :span="6">
            <span class="text">名称</span>
          </el-col>
          <el-col :span="6">
            <span class="text">共享目录</span>
          </el-col>
        </el-row>
        <el-row :gutter="10" v-for="(item,index) in workflowInfo.share_storages" :key="index">
          <el-col :span="6">
            <el-form-item
              :prop="'share_storages.' + index + '.name'"
              :rules="{required: true, validator: validateName, trigger: ['blur','change']}"
            >
              <el-input v-model="workflowInfo.share_storages[index].name" size="small" placeholder="名称" @input="update($event,item,'name')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              :prop="'share_storages.' + index + '.path'"
              :rules="{required: true, message: '共享目录不能为空', trigger: ['blur','change']}"
            >
              <el-input v-model="item.path" size="small" placeholder="共享目录" @input="update($event,item,'path')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-button @click="deleteBuildEnv(index)" type="danger" size="mini" icon="el-icon-minus" circle plain></el-button>
            <el-button @click="addBuildEnv()" type="primary" size="mini" icon="el-icon-plus" circle plain></el-button>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script>
const validateName = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入名称'))
  } else {
    if (!/^[a-z0-9-]{1,63}$/.test(value)) {
      callback(new Error('名称只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      validateName,
      isShowConfig: false
    }
  },
  props: {
    workflowInfo: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    addBuildEnv () {
      if (!this.workflowInfo.share_storages) {
        this.workflowInfo.share_storages = []
      }
      this.$refs.settings.validate().then(valid => {
        if (valid) {
          this.workflowInfo.share_storages.push({
            name: '',
            path: ''
          })
          this.$forceUpdate()
        }
      })
    },
    deleteBuildEnv (index) {
      this.workflowInfo.share_storages.splice(index, 1)
      this.$forceUpdate()
    },
    update (val, item, type) {
      this.$set(item, type, val)
      console.log(item)
      this.$forceUpdate()
    }
  }
}
</script>

<style lang="less" scoped>
.settings {
  .text {
    color: #72767b;
    font-size: 14px;
  }
}
</style>
