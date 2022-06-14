<template>
  <div class="build-env">
    <el-form :label-width="labelWidth">
      <el-form-item label="镜像仓库">
        <el-select v-model="docker_registry_id" placeholder="请选择" :size="size">
          <el-option v-for="item in dockerList" :key="item.id" :label="item.namespace" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { getRegistryWhenBuildAPI } from '@/api'
export default {
  name: 'Docker',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    value: {
      type: [String, Number],
      default: ''
    },
    size: {
      type: String,
      default: 'small'
    },
    labelWidth: {
      type: String,
      default: '90px'
    }
  },
  data () {
    return {
      form: {
        name: ' ',
        name1: ''
      },
      dockerList: []
    }
  },
  computed: {
    docker_registry_id: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },
  created () {
    this.getRegistryWhenBuild()
  },
  methods: {
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    }
  }
}
</script>
<style lang="less" scoped>
.build-env {
}
</style>
