<template>
  <div class="doc-link-container">
    <el-popover placement="bottom" popper-class="doc-link-droplist" trigger="hover">
      <ul class="dropdown-menu" uib-dropdown-menu>
        <li>
          <a href="https://docs.koderover.com/zadig/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>文档站</span>
          </a>
        </li>
        <li>
          <a href="https://docs.koderover.com/zadig/quick-start/introduction/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>入门</span>
          </a>
        </li>
        <li>
          <a href="https://www.koderover.com/tutorials/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>最佳实践</span>
          </a>
        </li>
        <li>
          <a href="https://docs.koderover.com/zadig/workflow/trigger/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>工作流</span>
          </a>
        </li>
        <li>
          <a href="https://docs.koderover.com/zadig/env/loadbalance/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>环境</span>
          </a>
        </li>
        <li>
          <a href="https://docs.koderover.com/zadig/project/overview/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>项目管理</span>
          </a>
        </li>
        <li>
          <a href="https://docs.koderover.com/zadig/delivery/artifact/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>交付中心</span>
          </a>
        </li>
        <li role="separator" class="divider"></li>
        <li>
          <a href="https://docs.koderover.com/zadig/settings/codehost/gitlab/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>系统设置</span>
          </a>
        </li>
        <li>
          <a href="https://docs.koderover.com/zadig/api/usage/" target="_blank">
            <i class="icon el-icon-link"></i>
            <span>开发者中心</span>
          </a>
        </li>
      </ul>
      <span slot="reference">
        <i class="function-icon iconfont iconvery-teach"></i>
      </span>
    </el-popover>
  </div>
</template>
<style lang="less">
.doc-link-droplist {
  min-width: 0;

  .dropdown-menu {
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

    li {
      padding: 4px 8px;

      & > a {
        display: block;
        clear: both;
        color: #333;
        font-weight: normal;
        line-height: 1.42857143;
        white-space: nowrap;

        .icon {
          position: relative;
          margin-right: 2px;
          font-size: 16px;
        }
      }

      &:hover {
        color: #262626;
        text-decoration: none;
        background-color: rgba(0, 102, 255, 0.07);
        border-radius: 6px;

        & > a {
          color: @themeColor;
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
