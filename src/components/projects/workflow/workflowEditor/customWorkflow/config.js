const tabList = [
  {
    label: '界面化',
    name: 'ui'
  },
  {
    label: 'YAML',
    name: 'yaml'
  }
]
const jobTabList = [
  {
    label: '基本配置',
    name: 'base'
  },
  {
    label: '变量',
    name: 'env'
  }
]
const jobTypeList = [
  // {
  //   label: '自定义',
  //   name: 'custom',
  //   tip: '自定义'
  // },
  {
    label: '构建',
    name: 'zadig-build',
    tip: '可直接引用「项目」-「构建」模块中的配置'
  },
  {
    label: '部署',
    name: 'zadig-deploy',
    tip: '可更新容器形态的服务镜像'
  },
  {
    label: '测试',
    name: '',
    tip: 'coming soon'
  },
  {
    label: '自定义',
    name: '',
    tip: 'coming soon'
  }
]
const configList = [
  {
    label: '变量',
    value: 'var'
  },
  {
    label: '触发器',
    value: 'webhook'
  },
  {
    label: '通知',
    value: 'notify'
  },
  {
    label: '高级配置',
    value: 'high'
  }
]
const jobType = {
  build: 'zadig-build',
  deploy: 'zadig-deploy'
}
const editorOptions = {
  mode: 'yaml',
  theme: 'neo',
  lineNumbers: true,
  lineWrapping: true,
  indentUnit: 2,
  tabSize: 2,
  indentWithTabs: false,
  autofocus: true,
  extraKeys: {
    'Ctrl-Space': 'autocomplete'
  }
}
export {
  tabList,
  configList,
  jobTabList,
  jobTypeList,
  editorOptions,
  jobType
}
