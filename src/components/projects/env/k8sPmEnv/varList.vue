<template>
  <div class="variable-list">
    <el-table :data="variables" style="width: 90%; max-width: 800px;">
      <el-table-column label="键" prop="key"></el-table-column>
      <el-table-column label="值">
        <template slot-scope="{ row }">
          <VariableEditor :varKey="row.key" :value.sync="row.value" :diabled="rollbackMode" />
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
