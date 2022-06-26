<template>
  <div class="build-env">
    <el-form :label-width="labelWidth" :model="form" ref="ruleForm">
      {{form.docker_registry_id}}
      <el-form-item label="镜像仓库" required prop="docker_registry_id">
        <el-select v-model="form.docker_registry_id" placeholder="请选择" :size="size">
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
        // docker_registry_id: ''
      },
      dockerList: []
    }
  },
  computed: {
    'form.docker_registry_id': {
      get () {
        return this.value
      }
      // set (val) {
      //   console.log(val)
      //   this.$emit('input', val)
      // }
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
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  }
  // watch: {
  //   'form.docker_registry_id' (val) {
  //     this.$emit('input', val)
  //   }
  // }
}
</script>
<style lang="less" scoped>
.build-env {
}
</style>
