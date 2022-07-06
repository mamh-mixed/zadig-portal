<template>
  <div class="build-env">
    <el-form :label-width="labelWidth" :model="form" ref="ruleForm">
      <el-form-item label="镜像仓库" :required="required" prop="docker_registry_id">
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
    dockerRegistryId: {
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
    },
    required: {
      type: Boolean,
      default: false
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
  created () {
    this.getRegistryWhenBuild()
  },
  methods: {
    getData () {
      return this.form.docker_registry_id
    },
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  },
  watch: {
    dockerRegistryId: {
      handler (val) {
        this.$set(this.form, 'docker_registry_id', val)
      },
      immediate: true
    }
  }
}
</script>
