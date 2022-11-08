<template>
  <div class="shortcut-link-container">
    <el-popover placement="bottom" popper-class="shortcuts-droplist" trigger="hover">
      <ul class="dropdown-menu">
        <span class="title">快捷链接</span>
        <li role="separator" class="divider"></li>
        <li v-for="(link, index) in links" :key="index" class="link-container">
          <a :href="link.url" target="_blank">
            <span class="icon">
              <img src="@assets/icons/others/link.svg" />
            </span>
            <div class="info-wrap">
              <span class="link-name">{{link.name}}</span>
              <span class="link-url">{{link.url}}</span>
            </div>
          </a>
        </li>
      </ul>
      <span slot="reference">
        <i class="function-icon iconfont iconkaifang"></i>
      </span>
    </el-popover>
  </div>
</template>
<script>
import { getExternalLinksAPI } from '@api'
import { mapState } from 'vuex'
export default {
  computed: {
    ...mapState({
      links: state => state.externalLink.links
    })
  },
  methods: {
    getExternalLinks () {
      getExternalLinksAPI().then(res => {
        this.$store.commit('SET_EXTERNAL_LINK', res || [])
      })
    }
  },
  created () {
    this.getExternalLinks()
  }
}
</script>
<style lang="less">
.shortcuts-droplist {
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

          .link-url {
            display: flex;
            color: rgb(88, 88, 88);
            font-size: 12px;
          }
        }
      }
    }
    // li {
    //   display: flex;
    //   padding: 4px 8px;

    //   & > a {
    //     display: flex;
    //     clear: both;
    //     color: #333;
    //     font-weight: normal;
    //     line-height: 1.42857143;
    //     white-space: nowrap;
    //     .icon {
    //       position: relative;
    //       margin-right: 2px;
    //       font-size: 16px;
    //     }
    //   }

    //   &:hover {
    //     color: #262626;
    //     text-decoration: none;
    //     background-color: rgba(0, 102, 255, 0.07);
    //     border-radius: 6px;

    //     & > a {
    //       color: @themeColor;
    //     }
    //   }
    // }
  }
}

.shortcut-link-container {
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
