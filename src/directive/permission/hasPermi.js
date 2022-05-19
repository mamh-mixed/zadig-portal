import { permissionCheckingLogic } from '@utils/checkPermission'

async function checkPermission (el, binding) {
  const { type, projectName, action, actions, operator } = binding.value
  const hasPermission = await permissionCheckingLogic({
    type,
    projectName,
    action,
    actions,
    operator
  })
  if (!hasPermission) {
    el.parentNode && el.parentNode.removeChild(el)
  }
}

export default {
  async inserted (el, binding) {
    await checkPermission(el, binding)
  },
  async update (el, binding) {
    await checkPermission(el, binding)
  }
}
