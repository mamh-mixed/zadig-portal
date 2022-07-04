<template>
  <div class="approval">
    <el-row class="mg-t24 mg-b24">
      <el-col :span="2">人工审核</el-col>
      <el-col :span="6" class="text">
        <span>开始时间:</span>
        <span>{{$utils.convertTimestamp(approvalInfo.start_time)}}</span>
      </el-col>
      <el-col :span="6" class="text" v-if="approvalInfo.approval.reject_or_approve!=='reject'">
        <span class="red">{{approvalInfo.approval.timeout}} 分钟</span>
        <span>后审核超时</span>
      </el-col>
      <el-col :span="6" class="text" v-else>
        <span>完成时间</span>
        <span>{{$utils.convertTimestamp(approvalInfo.end_time)}}</span>
        <span
          :class="[`status-${$utils.taskElTagType(approvalInfo.approval.reject_or_approve)}`]"
        >{{ wordTranslation(approvalInfo.approval.reject_or_approve,'pipeline','task') }}</span>
      </el-col>
    </el-row>
    <el-table :data="approvalInfo.approval.approve_users">
      <el-table-column prop="user_name" label="审核人"></el-table-column>
      <el-table-column prop="reject_or_approve" label="审核结果">
        <template slot-scope="scope">
          <span
            :class="[`status-${$utils.taskElTagType(scope.row.reject_or_approve)}`]"
          >{{ wordTranslation(scope.row.reject_or_approve,'pipeline','task') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="operation_time" label="审核时间">
        <template slot-scope="scope">
          <span>{{$utils.convertTimestamp(scope.row.operation_time)}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="comment" label="评论信息"></el-table-column>
    </el-table>
    <el-row class="mg-t24">
      <el-button type="warning" size="small" @click="isShowCommentDialog=true">审核</el-button>
    </el-row>
    <el-dialog title="评论信息" :visible.sync="isShowCommentDialog">
      <el-form :model="form">
        <el-input placeholder="输入评论信息" size="small" v-model="form.comment"></el-input>
      </el-form>
      <span slot="footer">
        <el-button type="primary" size="small" @click="submit(true)">通过</el-button>
        <el-button size="small" @click="submit(false)">拒绝</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { approvalCustomWorkflowTaskAPI } from '@api'
import { wordTranslate } from '@utils/wordTranslate.js'

export default {
  name: '',
  props: {
    approvalInfo: {
      type: Object,
      default: () => ({})
    },
    taskId: {
      type: [String, Number],
      default: 1
    },
    workflowName: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      form: {
        comment: ''
      },
      isShowCommentDialog: false
    }
  },
  methods: {
    submit (approvalable) {
      const payload = {
        workflow_name: this.workflowName,
        stage_name: this.approvalInfo.name,
        task_id: Number(this.taskId),
        approve: approvalable,
        comment: this.form.comment
      }
      approvalCustomWorkflowTaskAPI(payload).then(res => {
        this.isShowCommentDialog = false
      })
    },
    hideFooter () {
      this.$emit('showFooter', false)
    },
    wordTranslation (word, category, subitem) {
      return wordTranslate(word, category, subitem)
    }
  }
}
</script>
<style lang="less" scoped>
.approval {
  background: #fff;

  .text {
    color: #8d9199;
    font-size: 14px;

    .red {
      color: red;
    }
  }
}
</style>
