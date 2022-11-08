<template>
  <div class="doc-link-container">
    <el-popover placement="bottom" popper-class="doc-droplist" trigger="hover">
      <ul class="dropdown-menu">
        <span class="title">文档链接</span>
        <li role="separator" class="divider"></li>
        <li v-for="(link, index) in links" :key="index" class="link-container">
          <a :href="link.url" target="_blank">
            <span class="icon">
              <img src="@assets/icons/others/doc.svg" />
            </span>
            <div class="info-wrap">
              <span class="link-name">{{link.name}}</span>
              <span class="link-desc">{{link.desc}}</span>
            </div>
          </a>
        </li>
      </ul>
      <span slot="reference">
        <i class="function-icon iconfont iconvery-teach"></i>
      </span>
    </el-popover>
  </div>
</template>
<script>
export default {
  data () {
    return {
      links: [
        {
          name: '文档站',
          desc: 'Zadig 官方文档站入口',
          url: 'https://docs.koderover.com'
        },
        {
          name: '入门',
          desc: '了解 Zadig 的业务架构以及核心能力',
          url: 'https://docs.koderover.com/zadig/quick-start/introduction/'
        },
        {
          name: '最佳实践',
          desc: '查看来自官方的最佳实践',
          url: 'https://koderover.com/tutorials/'
        },
        {
          name: '工作流',
          desc: '学习工作流的配置和使用',
          url: 'https://docs.koderover.com/zadig/project/workflow/'
        },
        {
          name: '环境',
          desc: '查看环境的相关操作',
          url: 'https://docs.koderover.com/zadig/project/env/k8s/'
        },
        {
          name: '项目管理',
          desc: '了解不同项目的适应场景以及如何创建项目',
          url: 'https://docs.koderover.com/zadig/project/overview/'
        },
        {
          name: '系统设置',
          desc: '了解系统中的相关配置项',
          url: 'https://docs.koderover.com/zadig/settings/codehost/overview'
        },
        {
          name: '开发者中心',
          desc: '通过 Open API 调用的方式，玩转 Zadig',
          url: 'https://docs.koderover.com/zadig/api/usage/'
        }
      ]
    }
  }
}
</script>
<style lang="less">
.doc-droplist {
  min-width: 0;

  .dropdown-menu {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
    padding-bottom: 0;
    list-style: none;

    .divider {
      height: 1px;
      margin: 9px 0;
      padding: 0;
      overflow: hidden;
      background-color: #e5e5e5;
    }

    .title {
      display: flex;
    }

    li {
      display: flex;
    }

    .link-container {
      display: flex;
      flex-direction: column;
      padding: 8px 10px;
      border-radius: 6px;

      &:hover {
        background-color: rgba(0, 102, 255, 0.07);
      }

      a {
        display: flex;
        align-items: center;

        .icon {
          display: flex;
          margin-right: 10px;

          img {
            width: 24px;
            height: 24px;
          }
        }

        .info-wrap {
          display: flex;
          flex-direction: column;

          .link-name {
            display: flex;
            color: rgb(16, 16, 16);
            font-weight: 500;
            font-size: 13px;
          }

          .link-desc {
            display: flex;
            color: #909399;
            font-size: 12px;
          }
        }
      }
    }
  }
}

.doc-link-container {
  .function-icon {
    color: #a0a0a0;
    font-size: 20px;
    cursor: pointer;

    &:hover {
      color: @themeColor;
    }
  }
}
</style>
