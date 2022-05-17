import store from '../store'
import { isEmpty } from 'lodash'
export async function checkPermission (opts) {
  const { projectName, action, logic, isPublic } = opts
  return permissionCheckingLogic({
    isPublic,
    projectName,
    action,
    logic
  })
}

export function checkPermissionSync (opts) {
  let globalPermission = store.getters.globalPermission
  // 不存在时获取数据
  if (isEmpty(globalPermission)) {
    store.dispatch('getGlobalPermission')
    globalPermission = store.getters.globalPermission
  }
  const isSystemAdmin = globalPermission.is_system_admin
  const { type, projectName, action, actions, operator } = opts
  // 系统管理员放行
  if (isSystemAdmin) {
    return true
  }
  // 系统角色权限判断
  if (type === 'system' && (action || actions)) {
    const systemVerbs = globalPermission.system_verbs ? globalPermission.system_verbs : []
    if (systemVerbs.length > 0) {
      if (operator && actions) {
        if (operator === 'and') {
          for (const action of actions) {
            if (!systemVerbs.includes(action)) {
              return false
            }
          }
        }
        if (operator === 'or') {
          for (const action of actions) {
            if (systemVerbs.includes(action)) {
              return true
            }
          }
        }
      } else {
        return systemVerbs.includes(action)
      }
    } else {
      return false
    }
    // 项目角色权限判断
  } else if (type === 'project' || projectName) {
    const currentProject = store.getters.projectList.find(item => item.name === projectName)
    const currentProjectPermissions = store.getters.projectPermissions[projectName] ? store.getters.projectPermissions[projectName] : {}
    if (currentProject && currentProject.public) {
      return true
    }
    if (!isEmpty(currentProjectPermissions) && (action || actions)) {
      const projectVerbs = currentProjectPermissions.project_verbs ? currentProjectPermissions.project_verbs : []
      console.log(projectVerbs)
      console.log(action)
      if (projectVerbs.length > 0) {
        if (operator && actions) {
          if (operator === 'and') {
            for (const action of actions) {
              if (!projectVerbs.includes(action)) {
                return false
              }
            }
          }
          if (operator === 'or') {
            for (const action of actions) {
              if (projectVerbs.includes(action)) {
                return true
              }
            }
          }
        } else {
          return projectVerbs.includes(action)
        }
      } else {
        return false
      }
    } else {
      return false
    }
  } else {
    return false
  }
}

export async function permissionCheckingLogic (opts) {
  let globalPermission = store.getters.globalPermission
  // 不存在时获取数据
  if (isEmpty(globalPermission)) {
    await store.dispatch('getGlobalPermission')
    globalPermission = store.getters.globalPermission
  }
  const isSystemAdmin = globalPermission.is_system_admin
  const { type, projectName, action, actions, operator } = opts
  // 系统管理员放行
  if (isSystemAdmin) {
    return true
  }
  // 系统角色权限判断
  if (type === 'system' && (action || actions)) {
    const systemVerbs = globalPermission.system_verbs ? globalPermission.system_verbs : []
    if (systemVerbs.length > 0) {
      if (operator && actions) {
        if (operator === 'and') {
          for (const action of actions) {
            if (!systemVerbs.includes(action)) {
              return false
            }
          }
        }
        if (operator === 'or') {
          for (const action of actions) {
            if (systemVerbs.includes(action)) {
              return true
            }
          }
        }
      } else {
        return systemVerbs.includes(action)
      }
    } else {
      return false
    }
    // 项目角色权限判断
  } else if (type === 'project' || projectName) {
    const currentProject = store.getters.projectList.find(item => item.name === projectName)
    const currentProjectPermissions = store.getters.projectPermissions[projectName] ? store.getters.projectPermissions[projectName] : {}
    if (currentProject && currentProject.public) {
      return true
    }
    if (!isEmpty(currentProjectPermissions) && (action || actions)) {
      const projectVerbs = currentProjectPermissions.project_verbs ? currentProjectPermissions.project_verbs : []
      if (projectVerbs.length > 0) {
        if (operator && actions) {
          console.log(actions || action)
          if (operator) {
            console.log(operator)
          }
          if (operator === 'and') {
            for (const action of actions) {
              if (!projectVerbs.includes(action)) {
                return false
              }
            }
          }
          if (operator === 'or') {
            for (const action of actions) {
              if (projectVerbs.includes(action)) {
                console.log(projectVerbs.includes(action))
                return true
              }
            }
          }
        } else {
          return projectVerbs.includes(action)
        }
      } else {
        return false
      }
    } else {
      return false
    }
  } else {
    return false
  }
}
