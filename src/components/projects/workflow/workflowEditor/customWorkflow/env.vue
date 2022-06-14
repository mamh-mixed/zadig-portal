<template>
  <div class="env">
    <Docker :projectName="projectName" v-if="value.type==='zadig-build'" v-model="value.spec.docker_registry_id" />
    <BuildEnv :projectName="projectName" v-if="value.type === 'zadig-deploy'" v-model="value.spec" />
  </div>
</template>

<script>
import BuildEnv from './components/BuildEnv'
import Docker from './components/Docker'
export default {
  name: 'Env',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    value: {
      type: Object,
      default: () => {}
    }
  },
  components: {
    BuildEnv,
    Docker
  },
  data () {
    return {}
  }
}
</script>
