<template>
  <div class="variable-list">
    <el-table :data="variables" style="width: 90%; max-width: 1000px;">
      <el-table-column :label="$t(`workflow.key`)" prop="key" width="270px"></el-table-column>
      <el-table-column :label="$t(`workflow.value`)">
        <template slot-scope="{ row }">
          <VariableEditor style="margin-right: 10px;" :varKey="row.key" :value.sync="row.value" :diabled="rollbackMode" />
        </template>
      </el-table-column>
      <el-table-column label="关联服务">
        <template slot-scope="{ row }">
          <span>{{ row.services?row.services.join(','):'-' }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  props: {
    variables: Array,
    rollbackMode: {
      default: false,
      type: Boolean
    }
  }
}
</script>

<style lang="less" scoped>
@darkBackgroundColor: rgba(246, 246, 246, 0.6);

.variable-list {
  /deep/.el-table {
    th.el-table__cell {
      color: @secondaryColor;
      background: #fff;
    }

    .el-table__row {
      background: @darkBackgroundColor;
    }
  }
}
</style>
