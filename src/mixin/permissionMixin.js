import { permissionCheckingLogic, checkPermissionSync } from '@utils/checkPermission'
export default {
  methods: {
    async checkingPermissionMixin (payload) {
      const hasPermission = await permissionCheckingLogic(payload)
      return hasPermission
    },
    checkPermissionSyncMixin (payload) {
      const hasPermission = checkPermissionSync(payload)
      return hasPermission
    }
  }
}
