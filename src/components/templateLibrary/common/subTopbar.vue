<template>
  <div class="template-library-subtopbar-container">
    <div class="nav-container">
      <div class="nav-content">
        <ul v-if="routerList.length > 0" class="nav-item-list">
          <router-link v-for="(item,index) in routerList" :key="index" active-class="active" :to="item.url">
            <li class="nav-item">
              <i v-if="item.icon" class="icon" :class="[item.icon]"></i>
              <span class="name">{{item.name}}</span>
            </li>
          </router-link>
        </ul>
      </div>
    </div>
    <div class="operation">
      <template v-if="$route.path === `/v1/template/workflows`">
        <el-dropdown @command="handleCommand">
          <el-button type="primary" size="small">新建工作流模版</el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="custom">自定义工作流</el-dropdown-item>
            <el-dropdown-item command="release">发布工作流</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {}
  },
  props: {},
  computed: {
    routerList () {
      return [
        {
          name: 'K8s YAML',
          icon: 'iconfont iconvery-k8s',
          url: `/v1/template/k8s-yamls`
        },
        {
          name: 'Helm Chart',
          icon: 'iconfont iconhelmrepo',
          url: `/v1/template/charts`
        },
        {
          name: 'Dockerfile',
          icon: 'iconfont icondocker',
          url: `/v1/template/dockerfiles`
        },
        {
          name: '构建',
          icon: 'iconfont iconvery-build',
          url: `/v1/template/builds`
        },
        {
          name: '工作流',
          icon: 'iconfont icongongzuoliucheng',
          url: `/v1/template/workflows`
        }
      ]
    }
  },
  methods: {
    handleCommand (val) {
      this.$router.push(`/v1/template/workflows/config?type=${val}`)
    }
  }
}
</script>
<style lang="less">
.template-library-subtopbar-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  padding-right: 40px;
  padding-left: 26px;
  background-color: #fff;

  .nav-container {
    .nav-content {
      .nav-item-list {
        display: flex;

        .nav-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 9px 12px;
          color: #000;
          font-weight: 300;
          font-size: 16px;
          line-height: 22px;
          cursor: pointer;

          .icon {
            margin-right: 18px;
            color: #d2d2d2;
            font-size: 22px;
          }
        }

        a {
          margin-right: 16px;

          &.active {
            box-shadow: inset 0 -2px 0 @themeColor;

            .icon {
              color: @themeColor;
            }
          }
        }
      }
    }
  }

  .operation {
    display: flex;
    margin-right: 80px;
  }
}
</style>
