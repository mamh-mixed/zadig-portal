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
    console.log(projectName)
    console.log(logic)
    return true
  } else {
    return false
  }
  // const currentProjectPermissions = permissions[projectName] ? permissions[projectName] : {}
  // if (!isEmpty(currentProjectPermissions)) {
  //   let permissionActions = []
  //   for (const resource in currentProjectPermissions) {
  //     if (Object.hasOwnProperty.call(currentProjectPermissions, resource)) {
  //       permissionActions = permissionActions.concat(currentProjectPermissions[resource])
  //     }
  //   }
  //   // * means all actions
  //   if (permissionActions.includes('*')) {
  //     return true
  //   }
  //   if (action) {
  //     return permissionActions.includes(action)
  //   }
  //   if (logic) {
  //     const { actions, operator } = logic
  //     if (operator === 'and') {
  //       for (const action of actions) {
  //         if (!permissionActions.includes(action)) {
  //           return false
  //         }
  //       }
  //     }
  //     if (operator === 'or') {
  //       for (const action of actions) {
  //         if (permissionActions.includes(action)) {
  //           return true
  //         }
  //       }
  //     }
  //   }
}

export async function permissionCheckingLogic (opts) {
  console.log(opts)
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
    console.log(projectName)
    return true
  } else {
    return false
  }
  // const currentProjectPermissions = permissions[projectName] ? permissions[projectName] : {}
  // if (!isEmpty(currentProjectPermissions)) {
  //   let permissionActions = []
  //   for (const resource in currentProjectPermissions) {
  //     if (Object.hasOwnProperty.call(currentProjectPermissions, resource)) {
  //       permissionActions = permissionActions.concat(currentProjectPermissions[resource])
  //     }
  //   }
  //   // * means all actions
  //   if (permissionActions.includes('*')) {
  //     return true
  //   }
  //   if (action) {
  //     return permissionActions.includes(action)
  //   }
  //   if (logic) {
  //     const { actions, operator } = logic
  //     if (operator === 'and') {
  //       for (const action of actions) {
  //         if (!permissionActions.includes(action)) {
  //           return false
  //         }
  //       }
  //     }
  //     if (operator === 'or') {
  //       for (const action of actions) {
  //         if (permissionActions.includes(action)) {
  //           return true
  //         }
  //       }
  //     }
  //   }
}

export function projectRoleCheckingLogic (opts) {
  const { projectName, role } = opts

  const templates = store.state.project_templates.templates

  if (templates.length === 0) {
    return true
  }

  const projectTemplate = templates.find(item => item.product_name === projectName) // 使用唯一字段product_name，project_name是alias，不唯一

  if (projectTemplate) {
    if (projectTemplate.role === 'admin') {
      return true
    }

    if (role) {
      return projectTemplate.role === role
    }
  }

  return false
}
