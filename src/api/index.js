import axios from 'axios'
import qs from 'qs'
import store from 'storejs'
import Element from 'element-ui'
import errorMap from '@/utilities/errorMap'
import Router from '../router'
const returnFullResponseAPIs = ['/api/aslan/system/operation', '/api/aslan/delivery/artifacts', '/api/aslan/environment/kube/workloads', '/api/v1/login']
const returnFullResponseRegexAPIs = [/api\/aslan\/environment\/environments\/[a-z-A-Z-0-9]+\/workloads/, /api\/aslan\/environment\/environments\/[a-z-A-Z-0-9]+\/groups/]
const ignoreErrReqPrefix = '/api/aslan/services/validateUpdate/'
const ignoreErrReqAPIs = ['/api/aslan/system/jenkins/user/connection', '/api/aslan/system/sonar/validate', '/api/aslan/system/project_management/validate']
const ignoreErrResponse = 'the following services are modified since last update:'
const analyticsPrefix = 'https://api.koderover.com'
const analyticsReq = `${analyticsPrefix}/api/operation/upload`
const userInitEnvRoute = '/v1/projects/initialize/'

const http = axios.create()
const CancelToken = axios.CancelToken
let source = null
export function initSource () {
  source = CancelToken.source()
  return source
}
export function rmSource () {
  source = null
}

class TokenSource {
  constructor ({ cancelInfo }) {
    this.source = null
    this.cancelInfo = cancelInfo || 'cancel'
  }

  get sourceToken () {
    return this.source.token
  }

  initSource () {
    this.source = CancelToken.source()
  }

  rmSource () {
    this.source = null
  }

  cancelRequest () {
    this.source.cancel(this.cancelInfo)
  }
}

const analyticsReqSource = new TokenSource({ cancelInfo: 'cancel analytics request' })
analyticsReqSource.initSource()

http.interceptors.request.use((config) => {
  if (source && config.method === 'get') {
    config.cancelToken = source.token
  }
  // Optimize analyticsReq.
  if (config.url === analyticsReq) {
    analyticsReqSource.cancelRequest()
    analyticsReqSource.initSource()
    config.cancelToken = analyticsReqSource.sourceToken
  }
  // Set token for forgot password.
  if (config.url === '/api/v1/reset' && config.data.token) {
    config.headers.Authorization = 'Bearer ' + config.data.token
  }
  // Set Authorization Header.
  if (store.get('userInfo') && store.get('userInfo') !== 'undefined' && !config.url.startsWith(analyticsPrefix)) {
    config.headers.Authorization = 'Bearer ' + store.get('userInfo').token
  }
  return config
})

function displayError (error) {
  const response = error.response.data
  if (errorMap[response.resultCode]) {
    Element.Message({
      message: errorMap[response.resultCode],
      type: 'error',
      dangerouslyUseHTMLString: false
    })
    return
  }
  let msg = `${error.response.status} API 请求错误`
  if (error.response.data.errorMsg) {
    msg = `${error.response.status} : ${error.response.data.errorMsg}`
  } else if (error.response.data.message) {
    msg = `${error.response.status} : ${error.response.data.message} ${error.response.data.description}`
  }
  Element.Message({
    message: msg,
    type: 'error',
    dangerouslyUseHTMLString: false
  })
}

http.interceptors.response.use(
  (response) => {
    const req = response.config.url.split(/[?#]/)[0]
    const isInReg = (returnFullResponseRegexAPIs.findIndex(element => {
      return element.test(req)
    })) >= 0
    if (returnFullResponseAPIs.includes(req)) {
      return response
    } else if (isInReg) {
      return response
    } else if (response.data && response.data.code && response.data.code === 10000) {
      const currentRoute = Router.history.current
      if (currentRoute.fullPath.startsWith(userInitEnvRoute)) {
        return response.data
      }
      Router.push(`${userInitEnvRoute}${currentRoute.params.project_name}`)
    } else {
      return response.data
    }
  },
  (error) => {
    if (axios.isCancel(error)) {
      if (error.message === analyticsReqSource.cancelInfo) {
        return Promise.reject(analyticsReqSource.cancelInfo)
      }
      return Promise.reject('CANCEL')
    }
    // Don't expose analysis API errors
    if (
      error.response &&
      !error.response.config.url.startsWith(analyticsPrefix) &&
      !error.response.config.url.includes(ignoreErrReqPrefix) &&
      !ignoreErrReqAPIs.includes(error.response.config.url)) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response)
      if (document.title !== '登录') {
        // unauthorized 401
        if (error.response.status === 401) {
          const redirectPath = window.location.pathname + window.location.search
          Element.Message.error('登录信息失效, 请返回重新登录')
          store.remove('userInfo')
          store.remove('role')
          window.location.href = `/signin?redirect=${encodeURIComponent(redirectPath)}`
        } else if (error.response.status === 403) {
          Element.Message.error('暂无权限')
        }
        if (error.response.data && ([6168, 6094, 6940].includes(error.response.data.code) || (error.response.data.description && error.response.data.description.includes(ignoreErrResponse)))) {
          return Promise.reject(error)
        } else {
          displayError(error)
        }
      } else if (document.title === '登录') {
        displayError(error)
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message)
    }
    return Promise.reject(error)
  }
)

window.__spockEventSources = {}
function makeEventSource (basePath, config) {
  let path = basePath
  const params = config && config.params
  if (typeof params === 'object') {
    path = basePath + '?' + qs.stringify(params)
  }
  if (typeof params === 'string') {
    path = basePath + '?' + params
  }

  const evtSource = new EventSource(path, {
    headers: {
      Authorization: 'Bearer ' + store.get('userInfo').token
    }
  })
  evtSource.userCount = 0

  const normalHandlers = []
  const errorHandlers = []
  evtSource.onmessage = (e) => {
    normalHandlers.forEach((h) => h({ data: JSON.parse(e.data) }))
  }
  evtSource.onerror = (e) => {
    console.log(e)
  }

  const ret = {
    then (fun1, fun2) {
      normalHandlers.push(fun1)
      if (typeof fun2 === 'function') {
        errorHandlers.push(fun2)
      }
      return ret
    },
    catch (fun) {
      errorHandlers.push(fun)
      return ret
    },
    close () {
      evtSource.close()
      return ret
    },
    closeWhenDestroy (vm) {
      evtSource.userCount++
      if (!window.__spockEventSources[vm._uid]) {
        window.__spockEventSources[vm._uid] = []
      }
      window.__spockEventSources[vm._uid].push(evtSource)
      return ret
    },
    isAlive () {
      /* 0 — connecting
         1 — open
         2 — closed */
      return evtSource.readyState !== 2
    }
  }

  return ret
}

// Release Version
export function getReleaseVersionAPI () {
  return http.get(`/static/version.json?v=${Date.now()}`)
}

// Analytics
export function analyticsRequestAPI (payload) {
  return http.post(analyticsReq, payload)
}

export function userStatisticsAPI () {
  return http.get(`/api/v1/user/count`)
}

export function uploadUserNumberAPI (payload) {
  return http.post(`${analyticsPrefix}/api/operation/upload/user`, payload)
}

// Statistics
export function getStatisticsOverviewAPI () {
  return http.get('/api/v1/picket/stat/dashboard/overview')
}

export function getBuildStatisticsAPI (start, end) {
  return http.get(`/api/v1/picket/stat/dashboard/build?startDate=${start}&endDate=${end}`)
}

export function getDeployStatisticsAPI (start, end) {
  return http.get(`/api/v1/picket/stat/dashboard/deploy?startDate=${start}&endDate=${end}`)
}

export function getTestStatisticsAPI (start, end) {
  return http.get(`/api/v1/picket/stat/dashboard/test?startDate=${start}&endDate=${end}`)
}

// Status
export function taskRunningSSEAPI () {
  return makeEventSource('/api/aslan/workflow/sse/tasks/running')
}

export function taskPendingSSEAPI () {
  return makeEventSource('/api/aslan/workflow/sse/tasks/pending')
}

// Permission
export function getGlobalPermissionAPI () {
  return http.get(`/api/v1/policy/permission`)
}

export function getProjectPermissionAPI (projectName) {
  return http.get(`/api/v1/policy/permission/project/${projectName}`)
}

// Env
export function listProductAPI (projectName = '', envType = '') {
  if (envType) {
    return http.get(`/api/aslan/environment/environments?projectName=${projectName}&envType=${envType}`)
  } else {
    return http.get(`/api/aslan/environment/environments?projectName=${projectName}`)
  }
}

export function getGlobalVariablesAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}/globalVariables?projectName=${projectName}`)
}

export function getEnvGlobalVariablesAPI (projectName, envName, ifPassFilter = true) {
  return http.get(`/api/aslan/environment/rendersets/globalVariables?projectName=${projectName}&envName=${envName}&ifPassFilter=${ifPassFilter}`)
}

export function createFavoriteEnvAPI (name, projectName, type = 'environment') {
  return http.post(`/api/aslan/system/favorite/${type}/${name}?projectName=${projectName}`)
}

export function deleteFavoriteEnvAPI (name, projectName, type = 'environment') {
  return http.delete(`/api/aslan/system/favorite/${type}/${name}?projectName=${projectName}`)
}

export function getServicePipelineAPI (projectName, envName, serviceName, serviceType) {
  return http.get(`/api/aslan/workflow/servicetask/workflows/${projectName}/${envName}/${serviceName}/${serviceType}?projectName=${projectName}`)
}

export function envRevisionsAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/revision/products?projectName=${projectName}&envName=${envName}`)
}

export function getEnvServicesAPI (projectName, envName, envSource, searchName = '', perPage = 20, page = 1) {
  if (envSource === 'helm') {
    // searchName: serviceName=xxx|yyy,name=zzz
    return http.get(`/api/aslan/environment/environments/${envName}/workloads?projectName=${projectName}&filter=${searchName}&perPage=${perPage}&page=${page}`)
  } else if (envSource === 'external') {
    return http.get(`/api/aslan/environment/environments/${envName}/workloads?projectName=${projectName}&filter=name=${searchName}&perPage=${perPage}&page=${page}`)
  } else {
    return http.get(`/api/aslan/environment/environments/${envName}/groups?projectName=${projectName}&serviceName=${searchName}&perPage=${perPage}&page=${page}`)
  }
}

export function getEnvInfoAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/environments/${envName}?projectName=${projectName}`)
}

export function updateEnvImageRegistry (projectName, envName, payload) {
  return http.put(`/api/aslan/environment/environments/${envName}/registry?projectName=${projectName}`, payload)
}

export function getTheEnvChangeLogAPI (payload) {
  // payload: projectName, envName, page, pageSize, status, username, function, detail
  return http.get(`/api/aslan/environment/operations`, { params: payload })
}

// Project
export function getProjectsAPI (pageNum = 1, pageSize = 20, filter = '') {
  return http.get(`/api/v1/picket/projects?verbosity=detailed&page_num=${pageNum}&page_size=${pageSize}&filter=${filter}`)// verbosity=detailed<brief,minimal>,IgnoreNoVersions,IgnoreNoEnvs
}

export function getEnvironmentsAPI (projectName) {
  return http.get(`/api/aslan/environment/environments?projectName=${projectName}`)
}

export function getProjectVariablesAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}/globalVariables`)
}

export function getProjectVariableCandidatesAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}/globalVariableCandidates`)
}

export function updateProjectVariablesAPI (projectName, payload) {
  return http.put(`/api/aslan/project/products/${projectName}/globalVariables`, payload)
}

// Service
export function templatesAPI () {
  return http.get('/api/aslan/project/templates/info')
}

export function getProjectServicesAPI (projectName = '', envName = '') {
  return http.get(`/api/aslan/service/services?projectName=${projectName}&envName=${envName}`)
}

export function projectServiceWithConfigAPI (name, projectName) {
  return http.get(`/api/aslan/service/services/${name}?projectName=${projectName}`)
}

export function saveServiceVariableAPI (name, projectName, payload) {
  return http.put(`/api/aslan/service/services/${name}/variable?projectName=${projectName}`, payload)
}

export function parseK8sYamlVariableAPI (payload) {
  return http.post(`/api/aslan/template/yaml/extractVariable`, payload)
}

export function convertVariableToKvAPI (payload) {
  return http.post(`/api/aslan/service/services/variable/convert`, payload)
}

export function getServiceDetailAPI (name, type, projectName) {
  return http.get(`/api/aslan/service/services/${name}/${type}?projectName=${projectName}`)
}

export function serviceTemplateAfterRenderAPI (projectName, serviceName, envName) {
  return http.get(`/api/aslan/environment/diff/products/${projectName}/service/${serviceName}?projectName=${projectName}&envName=${envName}`)
}

export function saveServiceAPI (isEdit = false, payload) {
  return http.post(`/api/aslan/service/services?projectName=${payload.product_name}&force=${isEdit}`, payload)
}

export function updateServicePermissionAPI (projectName, data) {
  return http.put(`/api/aslan/service/services?projectName=${projectName}`, data)
}

export function deleteProjectServiceAPI (name, type, projectName, visibility) {
  return http.delete(`/api/aslan/service/services/${name}/${type}?projectName=${projectName}&visibility=${visibility}`)
}

export function serviceTemplateAfterRenderByEnvAPI (projectName, serviceName, payload) {
  return http.put(`/api/aslan/service/services/${serviceName}/yaml/view?projectName=${projectName}`, payload)
}

export function createPmServiceAPI (projectName, payload) {
  return http.post(`/api/aslan/service/pm/${projectName}?projectName=${projectName}`, payload)
}

export function updatePmServiceAPI (projectName, payload) {
  return http.put(`/api/aslan/service/pm/${projectName}?projectName=${projectName}`, payload)
}

export function addHostToPmEnvAPI (projectName, data) {
  return http.put(`/api/aslan/service/pm/healthCheckUpdate?projectName=${projectName}`, data)
}

export function getHelmChartProjectChartsAPI (project, projectName = '') {
  return http.get(`/api/aslan/service/harbor/project/${project}/charts?projectName=${projectName}`)
}

export function updateHelmChartAPI (serviceName, projectName = '', payload) {
  return http.put(`/api/aslan/service/helm/${serviceName}/file?projectName=${projectName}`, payload)
}

export function getHelmChartVersionAPI (project, chart) {
  return http.get(`/api/aslan/service/harbor/project/${project}/chart/${chart}/versions?projectName=${project}`)
}

export function helmChartWithConfigAPI (serviceName, projectName) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}?projectName=${projectName}`)
}

export function getHelmChartServiceAPI (projectName) {
  return http.get(`/api/aslan/service/helm/${projectName}?projectName=${projectName}`)
}

export function updateServicesOrchestrationAPI (projectName, payload) {
  return http.patch(`/api/aslan/project/products/${projectName}?projectName=${projectName}`, payload)
}

export function getHelmChartServiceFilePathAPI ({ projectName, serviceName, path, revision = '', deliveryVersion = false }) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/filePath?projectName=${projectName}&dir=${path}&revision=${revision}&deliveryVersion=${deliveryVersion}`)
}

export function getHelmChartServiceFileContentAPI ({ projectName, serviceName, path, fileName, revision = '', deliveryVersion = false }) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/fileContent?filePath=${path}&fileName=${fileName}&revision=${revision}&deliveryVersion=${deliveryVersion}&projectName=${projectName}`)
}

export function getHelmChartServiceModuleAPI (projectName, serviceName) {
  return http.get(`/api/aslan/service/helm/${projectName}/${serviceName}/serviceModule?projectName=${projectName}`)
}

export function getHelmRepoChartAPI (repoName) {
  return http.get(`/api/aslan/system/helm/${repoName}/index`)
}

export function renamingHelmReleaseAPI (projectName, payload) {
  return http.put(`/api/aslan/service/helm/services/releaseNaming?projectName=${projectName}`, payload)
}

export function imagesAPI (payload, registry = '') {
  return http.post(`/api/aslan/system/registry/images?registryId=${registry}`, { names: payload })
}

export function initProjectEnvAPI (projectName, isStcov, envType = 'general', isBaseEnv = true, baseEnvName = '') {
  return http.get(`/api/aslan/environment/init_info/${projectName}${isStcov ? '?stcov=true' : '?'}envType=${envType}&isBaseEnv=${isBaseEnv}&baseEnv=${baseEnvName}&projectName=${projectName}`)
}

export function getConfigFromNamespaceAPI (projectName, clusterId, namespace) {
  return http.get(`/api/aslan/service/services/kube/workloads?projectName=${projectName}&cluster_id=${clusterId}&namespace=${namespace}`)
}

export function createServiceFromK8sNamespaceAPI (projectName, payload) {
  return http.post(`/api/aslan/service/services/yaml?projectName=${projectName}`, payload)
}

// Build
export function getImgListAPI (from = '', imageFrom = '') {
  return http.get(`/api/aslan/system/basicImages?image_from=${from}&image_type=${imageFrom}`)
}

export function deleteBuildConfigAPI (name, version, projectName) {
  return http.delete(`/api/aslan/build/build?name=${name}&version=${version}&projectName=${projectName}`)
}

export function createBuildConfigAPI (payload) {
  return http.post(`/api/aslan/build/build?projectName=${payload.product_name}`, payload)
}

export function updateBuildConfigAPI (payload) {
  return http.put(`/api/aslan/build/build?projectName=${payload.product_name}`, payload)
}

export function saveBuildConfigTargetsAPI (projectName = '', payload) {
  return http.post(`/api/aslan/build/build/targets?projectName=${projectName}`, payload)
}

export function getBuildConfigDetailAPI (name, projectName = '') {
  return http.get(`/api/aslan/build/build/${name}?projectName=${projectName}`)
}

export function getRepoFilesAPI ({ codehostId = '', repoOwner = '', repoName = '', branchName = '', path = '', type = '', repoLink = '', remoteName = 'origin', namespace = '' }) {
  if (type === 'github' || type === 'gitlab' || type === 'helm' || type === 'githubPublic') {
    let params = {}
    if (type === 'githubPublic') {
      params = {
        path: path,
        repoLink: repoLink
      }
    } else {
      params = {
        repo: repoName,
        path: path,
        branch: branchName,
        owner: repoOwner,
        codehost_id: codehostId,
        namespace: namespace
      }
    }
    return http.get(`/api/aslan/code/workspace/tree`, { params })
  } else if (type === 'gerrit' || type === 'gitee') {
    const params = {
      repoOwner: repoOwner,
      repoName: repoName,
      branchName: branchName,
      remoteName: remoteName,
      dir: path
    }
    return http.get(`/api/aslan/code/workspace/git/${codehostId}`, { params })
  }
}

export function getRepoFileServiceAPI (codehostId, repoOwner, repoName, branchName, path, isDir, remoteName = '') {
  const params = {
    repoOwner: repoOwner,
    repoName: repoName,
    branchName: branchName,
    path: path,
    isDir: isDir,
    remoteName: remoteName
  }
  return http.get(`/api/aslan/service/loader/preload/${codehostId}`, { params })
}

export function loadRepoServiceAPI (projectName, codehostId, repoOwner, repoName, branchName, remoteName = '', namespace = '', payload) {
  const params = {
    projectName: projectName,
    repoOwner: repoOwner,
    repoName: repoName,
    branchName: branchName,
    remoteName: remoteName,
    namespace: namespace
  }
  return http.post(`/api/aslan/service/loader/load/${codehostId}`, payload, { params })
}

export function updateLoadRepoServiceAPI (projectName, codehostId, repoOwner, repoName, branchName, remoteName = '', namespace = '', payload) {
  const params = {
    projectName: projectName,
    repoOwner: repoOwner,
    repoName: repoName,
    branchName: branchName,
    remoteName: remoteName,
    namespace: namespace
  }
  return http.put(`/api/aslan/service/loader/load/${codehostId}`, payload, { params })
}

export function validPreloadService (codehostId, repoOwner, repoName, branchName, path, serviceName, isDir = false, remoteName = '') {
  const params = {
    repoOwner: repoOwner,
    repoName: repoName,
    branchName: branchName,
    path: path,
    serviceName: serviceName,
    isDir: isDir,
    remoteName: remoteName
  }
  return http.get(`/api/aslan/service/loader/validateUpdate/${codehostId}`, { params })
}

export function getServiceTargetsAPI (projectName = '') {
  return http.get(`/api/aslan/build/targets?projectName=${projectName}`)
}

export function getTargetBuildConfigsAPI (target, project_name) {
  return http.get(`/api/aslan/build/build?targets=${target}&projectName=${project_name}`)
}

export function getBuildConfigsAPI (projectName = '') {
  return http.get(`/api/aslan/build/build?projectName=${projectName}`)
}

// Workflow

// Workflow view
export function getViewPresetAPI (projectName, viewName) {
  return http.get(`/api/aslan/workflow/view/preset?projectName=${projectName}&viewName=${viewName}`)
}

export function getWorkflowViewListAPI (projectName) {
  return http.get(`/api/aslan/workflow/view?projectName=${projectName}`)
}

export function addWorkflowViewAPI (payload, projectName) {
  return http.post(`/api/aslan/workflow/view?projectName=${projectName}`, payload)
}

export function editWorkflowViewAPI (payload, projectName) {
  return http.put(`/api/aslan/workflow/view?projectName=${projectName}`, payload)
}

export function removeWorkflowViewAPI (projectName, viewName) {
  return http.delete(`/api/aslan/workflow/view/${projectName}/${viewName}?projectName=${projectName}`)
}

export function getWorkflowHistoryBuildLogAPI (projectName, workflowName, taskID, serviceName, type) {
  return http.get(`/api/aslan/logs/log/workflow/${workflowName}/tasks/${taskID}/service/${serviceName}?type=${type}&projectName=${projectName}`)
}

export function getWorkflowHistoryTestLogAPI (projectName, workflowName, taskID, testName, serviceName, workflowType = '') {
  return http.get(`/api/aslan/logs/log/workflow/${workflowName}/tasks/${taskID}/tests/${testName}/service/${serviceName}?workflowType=${workflowType}&projectName=${projectName}`)
}

export function imageReposAPI () {
  return http.get('/api/aslan/system/registry/release/repos')
}

export function getArtifactWorkspaceAPI (projectName, workflowName, taskId, dir = '') {
  return http.get(`/api/aslan/testing/workspace/workflow/${workflowName}/taskId/${taskId}?dir=${dir}&projectName=${projectName}`)
}

export function getAllBranchInfoAPI (data, param = '') {
  return http.put(`/api/aslan/code/codehost/infos?param=${param}`, data)
}

export function getWorkflowBindAPI (projectName, testName) {
  return http.get(`/api/v1/picket/workflows/testName/${testName}?projectName=${projectName}`)
}

export function getProductWorkflowsAPI (projectName) {
  return http.get(`/api/v1/picket/workflows?projectName=${projectName || ''}`)
}

export function getProductWorkflowsInProjectAPI (projectName) {
  return http.get(`/api/aslan/workflow/workflow?projectName=${projectName || ''}`)
}

export function setFavoriteAPI (payload) {
  return http.post('/api/aslan/workflow/favorite', payload)
}

export function deleteFavoriteAPI (projectName, workflowName, type) {
  return http.delete(`/api/aslan/workflow/favorite/${projectName}/${workflowName}/${type}?projectName=${projectName}`)
}

export function getWorkflowDetailAPI (projectName, name) {
  return http.get(`/api/aslan/workflow/workflow/find/${name}?projectName=${projectName}`)
}

export function workflowPresetAPI (projectName) {
  return http.get(`/api/aslan/workflow/workflow/preset/${projectName}?projectName=${projectName}`)
}

export function createWorkflowAPI (data) {
  return http.post(`/api/aslan/workflow/workflow?projectName=${data.product_tmpl_name}`, data)
}

export function updateWorkflowAPI (data, ifPassFilter = false) {
  return http.put(`/api/aslan/workflow/workflow/${data.name}?projectName=${data.product_tmpl_name}&ifPassFilter=${ifPassFilter}`, data)
}

export function deleteProductWorkflowAPI (projectName, name) {
  return http.delete(`/api/aslan/workflow/workflow/${name}?projectName=${projectName}`)
}

export function getAssociatedBuildsAPI (projectName, excludeJenkins = false, key = '') {
  return http.get(`/api/aslan/build/build/serviceModule?projectName=${projectName}&excludeJenkins=${excludeJenkins}&encryptedKey=${key}`)
}

export function checkRegularAPI (payload) { // {regular: '', branches: []}
  return http.post(`/api/aslan/code/codehost/branches/regular/check`, payload)
}

export function copyProductWorkflowAPI (projectName, oldName, newName, newDisplay) {
  return http.put(`/api/aslan/workflow/workflow/old/${oldName}/new/${newName}/${newDisplay}?projectName=${projectName}`)
}

export function precreateWorkflowTaskAPI (projectName, workflowName, envName) {
  return http.get(`/api/aslan/workflow/workflowtask/preset/${envName}/${workflowName}?projectName=${projectName}`)
}
export function createWorkflowTaskAPI (projectName, envName, payload) {
  return http.post(`/api/aslan/workflow/workflowtask/targets/${projectName}/${envName}?projectName=${projectName}`, payload)
}

export function getRegistryWhenBuildAPI (projectName) {
  return http.get(`/api/aslan/system/registry?projectName=${projectName}`)
}

export function getBuildTargetsAPI (projectName) {
  return http.get(`/api/aslan/build/targets/${projectName}?projectName=${projectName}`)
}

export function runWorkflowAPI (projectName, data, isArtifact = false) {
  if (isArtifact) {
    return http.put(`/api/aslan/workflow/workflowtask/${data.workflow_name}?projectName=${projectName}`, data)
  } else {
    return http.post(`/api/aslan/workflow/workflowtask/${data.workflow_name}?projectName=${projectName}`, data)
  }
}

export function restartWorkflowAPI (projectName, workflowName, taskID) {
  return http.post(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}/restart?projectName=${projectName}`)
}

export function cancelWorkflowAPI (projectName, workflowName, taskID) {
  return http.delete(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}?projectName=${projectName}`)
}

export function workflowTaskListAPI (projectName, name, start, max, workflowType = '', queryType = '', filters = '') {
  return http.get(`/api/aslan/workflow/workflowtask/max/${max}/start/${start}/pipelines/${name}?projectName=${projectName}&workflowType=${workflowType}&queryType=${queryType}&filters=${filters}`)
}

export function workflowTaskDetailAPI (projectName, workflowName, taskID, workflowType = '') {
  return http.get(`/api/aslan/workflow/workflowtask/id/${taskID}/pipelines/${workflowName}?projectName=${projectName}&workflowType=${workflowType}`)
}

export function getWorkflowFilterListAPI (projectName, name, queryType, workflowType = 'workflow') {
  return http.get(`/api/aslan/workflow/workflowtask/filters/pipelines/${name}?projectName=${projectName}&queryType=${queryType}&workflowType=${workflowType}`)
}

export function workflowTaskDetailSSEAPI (projectName, workflowName, taskID, workflowType = '') {
  return makeEventSource(`/api/aslan/workflow/sse/workflows/id/${taskID}/pipelines/${workflowName}?projectName=${projectName}&workflowType=${workflowType}`)
}

// Test
export function testsAPI (projectName = '', testType = '') {
  return http.get(`/api/aslan/testing/test?projectName=${projectName}&testType=${testType}`)
}
export function testDetailAPI (projectName = '') {
  return http.get(`/api/aslan/testing/testdetail?projectName=${projectName}`)
}

export function runTestsAPI (payload) {
  return http.post(`/api/aslan/testing/testtask?projectName=${payload.product_name}`, payload)
}

export function restartTestTaskAPI (projectName, testName, taskID) {
  return http.post(`/api/aslan/testing/testtask/productName/${projectName}/id/${taskID}/pipelines/${testName}/restart?projectName=${projectName}`)
}

export function cancelTestTaskAPI (projectName, testName, taskID) {
  return http.delete(`/api/aslan/testing/testtask/productName/${projectName}/id/${taskID}/pipelines/${testName}?projectName=${projectName}`)
}

export function singleTestAPI (name, projectName = '') {
  return http.get(`/api/aslan/testing/test/${name}?projectName=${projectName}`)
}

export function deleteTestAPI (name, projectName = '') {
  return http.delete(`/api/aslan/testing/test/${name}?projectName=${projectName}`)
}

export function createTestAPI (projectName, data) {
  return http.post(`/api/aslan/testing/test?projectName=${projectName}`, data)
}

export function updateTestAPI (projectName, data) {
  return http.put(`/api/aslan/testing/test?projectName=${projectName}`, data)
}

export function getLatestTestReportAPI (projectName, serviceName) {
  return http.get(`/api/aslan/testing/itreport/latest/service/${serviceName}?projectName=${projectName}`)
}
export function getTestReportAPI (projectName, workflowName, taskID, testJobName, serviceName, testType, workflowType = '') {
  return http.get(
    `/api/aslan/testing/itreport/workflow/${workflowName}/id/${taskID}/names/${testJobName}/service/${serviceName}?projectName=${projectName}&testType=${testType}&workflowType=${workflowType}`
  )
}

// Code Scanner
export function createCodeScannerAPI (payload) {
  return http.post(`/api/aslan/testing/scanning?projectName=${payload.project_name}`, payload)
}
export function updateCodeScannerAPI (id, payload) {
  return http.put(`/api/aslan/testing/scanning/${id}?projectName=${payload.project_name}`, payload)
}

export function getCodeScannerDetailAPI (id, projectName = '') {
  return http.get(`/api/aslan/testing/scanning/${id}?projectName=${projectName}`)
}
export function deleteCodeScannerAPI (id, projectName = '') {
  return http.delete(`/api/aslan/testing/scanning/${id}?projectName=${projectName}`)
}

export function getCodeScannerListAPI (projectName = '') {
  return http.get(`/api/aslan/testing/scanning?projectName=${projectName}`)
}

export function getCodeScannerHistoryAPI (id, projectName = '', pageNum, pageSize) {
  return http.get(`/api/aslan/testing/scanning/${id}/task?projectName=${projectName}&page_num=${pageNum}&page_size=${pageSize}`)
}

export function runCodeScannerTaskAPI (id, payload, projectName = '') {
  return http.post(`/api/aslan/testing/scanning/${id}/task?projectName=${projectName}`, payload)
}

export function scannerTaskDetailAPI (scannerId, taskId, projectName = '') {
  return http.get(`/api/aslan/testing/scanning/${scannerId}/task/${taskId}?projectName=${projectName}`)
}

export function scannerTaskDetailSSEAPI (scannerId, taskId, projectName = '') {
  return makeEventSource(`/api/aslan/testing/scanning/${scannerId}/task/${taskId}/sse?projectName=${projectName}`)
}

export function restartScannerTaskAPI (scannerId, taskId, payload, projectName = '') {
  return http.post(`/api/aslan/testing/scanning/${scannerId}/task/${taskId}?projectName=${projectName}`, payload)
}

export function cancelScannerTaskAPI (scannerId, taskId, projectName = '') {
  return http.delete(`/api/aslan/testing/scanning/${scannerId}/task/${taskId}?projectName=${projectName}`)
}

export function getScannerTaskLogAPI (scannerId, taskId, projectName = '') {
  return http.get(`/api/aslan/logs/log/scanning/${scannerId}/task/${taskId}?projectName=${projectName}`)
}

// User Management
export function usersAPI (payload, projectName = '') {
  return http.post(`/api/v1/users/search?projectName=${projectName}`, payload)
}
export function getUsersAPI (payload, projectName = '') {
  return http.post(`/api/v1/picket/users?projectName=${projectName}`, payload)
}

export function updateSystemRoleAPI (payload) {
  return http.post(`/api/v1/system-rolebindings/update?userID=${payload.userID}`, payload)
}

export function deleteSystemRoleAPI (name) {
  return http.delete(`/api/v1/system-roles/${name} `)
}

export function queryUserAPI (uid) {
  return http.get(`/api/v1/users/${uid}`)
}

export function addUserAPI (payload) {
  return http.post(`/api/v1/users`, payload)
}

export function deleteUserAPI (uid) {
  return http.delete(`/api/v1/picket/users/${uid}`)
}

export function updateUserAPI (uid, payload) {
  return http.put(`/api/v1/users/${uid}`, payload)
}

export function changeRegistrationAPI (payload) {
  return http.put(`/api/v1/features/RegisterTrigger`, payload)
}

export function getSystemRoleBindingsAPI () {
  return http.get(`/api/v1/system-rolebindings`)
}

export function addSystemRoleBindingsAPI (payload) {
  return http.post(`/api/v1/system-rolebindings`, payload)
}
export function updateSystemRoleBindingsAPI (uid, payload) {
  return http.post(`/api/v1/system-rolebindings/update?userID=${uid}`, payload)
}

export function deleteSystemRoleBindingsAPI (name) {
  return http.delete(`/api/v1/system-rolebindings/${name}`)
}

// System role
export function getRolePolicyListAPI (role) {
  return http.get(`/api/v1/policy-definitions?scope=${role}`)
}

export function getRoleListAPI () {
  return http.get(`/api/v1/system-roles`)
}

export function addSystemRoleAPI (payload) {
  return http.post(`/api/v1/system-roles `, payload)
}

// ----- System Setting-Integration -----

// Code
// Information is masked no detail
export function getCodeSourceMaskedAPI (key) {
  return http.get(`/api/v1/codehosts?encryptedKey=${key}`)
}

// Return details and only for admin
export function getCodeProviderAPI (key) {
  return http.get(`/api/v1/codehosts?encryptedKey=${key}`)
}

export function createCodeSourceAPI (payload) {
  return http.post(`/api/v1/codehosts`, payload)
}

export function getCodeSourceAPI (code_source_id) {
  return http.get(`/api/v1/codehosts/${code_source_id}`)
}

export function deleteCodeSourceAPI (code_source_id) {
  return http.delete(`/api/v1/codehosts/${code_source_id}`)
}

export function updateCodeSourceAPI (code_source_id, payload) {
  return http.patch(`/api/v1/codehosts/${code_source_id}`, payload)
}

export function getRepoOwnerByIdAPI (id, key = '') {
  return http.get(`/api/aslan/code/codehost/${id}/namespaces?key=${key}`)
}

export function getRepoNameByIdAPI (id, type, repoOwner, key = '') {
  const params = {
    repoOwner: repoOwner,
    type: type,
    page: 1,
    per_page: 200,
    key: key
  }
  return http.get(`/api/aslan/code/codehost/${id}/projects`, { params })
}
// repoOwner from namespace
export function getBranchInfoByIdAPI (id, repoOwner, repoName, page = 1, perPage = 200, key = '') {
  const params = {
    repoOwner: repoOwner,
    repoName: repoName,
    page: page,
    per_page: perPage,
    key: key
  }
  return http.get(`/api/aslan/code/codehost/${id}/branches`, { params })
}
export function getTagsInfoByIdAPI (id, repoOwner, repoName, page = 1, perPage = 200, key = '') {
  const params = {
    repoOwner: repoOwner,
    repoName: repoName,
    page: page,
    per_page: perPage,
    key: key
  }
  return http.get(`/api/aslan/code/codehost/${id}/tags`, { params })
}

// Account
export function getConnectorsAPI (key) {
  return http.get(`/api/v1/connectors?encryptedKey=${key}`)
}

export function deleteConnectorAPI (id) {
  return http.delete(`/api/v1/connectors/${id}`)
}

export function updateConnectorAPI (id, payload) {
  return http.put(`/api/v1/connectors/${id}`, payload)
}

export function createConnectorAPI (payload) {
  return http.post(`/api/v1/connectors`, payload)
}

export function syncLDAPAPI (id) {
  return http.post(`/api/v1/users/ldap/${id}`)
}

export function setDefaultAccountAPI (payload) {
  return http.post(`/api/aslan/system/login/default`, payload)
}

// Jira
export function getProjectManageAPI (key) {
  return http.get(`/api/aslan/system/project_management?encryptedKey=${key}`)
}

export function updateProjectManageAPI (payload, id) {
  return http.patch(`/api/aslan/system/project_management/${id}`, payload)
}

export function deleteProjectManageAPI (id) {
  return http.delete(`/api/aslan/system/project_management/${id}`)
}

export function createProjectManageAPI (payload) {
  return http.post(`/api/aslan/system/project_management`, payload)
}
export function checkProjectManageAPI (payload) {
  return http.post(`/api/aslan/system/project_management/validate`, payload)
}

// Jenkins
export function addJenkins (payload) {
  return http.post('/api/aslan/system/jenkins/integration', payload)
}

export function editJenkins (payload) {
  return http.put(`/api/aslan/system/jenkins/integration/${payload.id}`, payload)
}

export function deleteJenkins (payload) {
  return http.delete(`/api/aslan/system/jenkins/integration/${payload.id}`, payload)
}

export function checkJenkinsConfigExistsAPI () {
  return http.get('/api/aslan/system/jenkins/exist')
}

export function queryJenkins (key) {
  return http.get(`/api/aslan/system/jenkins/integration?encryptedKey=${key}`)
}

export function jenkinsConnection (payload) {
  return http.post('/api/aslan/system/jenkins/user/connection', payload)
}

export function queryJenkinsJob (id) {
  return http.get(`/api/aslan/system/jenkins/jobNames/${id}`)
}

export function queryJenkinsParams (id, jobName) {
  return http.get(`/api/aslan/system/jenkins/buildArgs/${id}/${jobName}`)
}

// Sonar
export function querySonarAPI (key, projectName = '') {
  return http.get(`/api/aslan/system/sonar/integration?encryptedKey=${key}&projectName=${projectName}`)
}

export function addSonarAPI (payload) {
  return http.post('/api/aslan/system/sonar/integration', payload)
}

export function editSonarAPI (payload) {
  return http.put(`/api/aslan/system/sonar/integration/${payload.id}`, payload)
}

export function deleteSonarAPI (payload) {
  return http.delete(`/api/aslan/system/sonar/integration/${payload.id}`, payload)
}

export function checkSonarConnectionAPI (payload) {
  return http.post('/api/aslan/system/sonar/validate', payload)
}

// External System
export function createExternalSystemAPI (payload) {
  return http.post(`/api/aslan/system/external`, payload)
}

export function getExternalSystemsAPI (key, page_num = 1, page_size = 100) {
  return http.get(`/api/aslan/system/external?page_num=${page_num}&page_size=${page_size}&encryptedKey=${key}`)
}

export function getExternalSystemByIdAPI (id) {
  return http.get(`/api/aslan/system/external/${id}`)
}

export function updateExternalSystemAPI (id, payload) {
  return http.put(`/api/aslan/system/external/${id}`, payload)
}

export function deleteExternalSystemAPI (id) {
  return http.delete(`/api/aslan/system/external/${id}`)
}

// Approval
export function getApprovalListAPI (projectName) {
  return http.get(`/api/aslan/system/im_app?projectName=${projectName}`)
}

export function getDepartmentAPI (id, department_id, projectName) {
  return http.get(`/api/aslan/system/lark/${id}/department/${department_id}?projectName=${projectName}`)
}

// Mail
export function getEmailHostAPI (key) {
  return http.get(`/api/v1/emails/internal/host?encryptedKey=${key}`)
}

export function checkEmailHostAPI () {
  return http.get(`/api/v1/emails/host`)
}

export function deleteEmailHostAPI () {
  return http.delete(`/api/v1/emails/host`)
}

export function createEmailHostAPI (payload) {
  return http.post(`/api/v1/emails/host`, payload)
}

export function updateEmailHostAPI (payload) {
  return http.patch(`/api/v1/emails/host`, payload)
}

export function getEmailServiceAPI () {
  return http.get(`/api/v1/emails/service`)
}

export function deleteEmailServiceAPI () {
  return http.delete(`/api/v1/emails/service`)
}

export function createEmailServiceAPI (payload) {
  return http.post(`/api/v1/emails/service`, payload)
}

export function updateEmailServiceAPI (payload) {
  return http.patch(`/api/v1/emails/service`, payload)
}
// ----- System Setting-Application -----

export function getAllAppsAPI (showAvailable = true) {
  return http.get(`/api/aslan/system/install?available=${showAvailable}`)
}

export function createAppAPI (data) {
  return http.post('/api/aslan/system/install', data)
}

export function updateAppAPI (data) {
  return http.put('/api/aslan/system/install', data)
}

export function deleteAppAPI (data) {
  return http.put('/api/aslan/system/install/delete', data)
}

export function getAuditLogAPI (payload) {
  return http.get(`/api/aslan/system/operation`, { params: payload })
}

export function getAnnouncementsAPI () {
  return http.get(`/api/aslan/system/announcement`)
}

export function createAnnouncementAPI (payload) {
  return http.post(`/api/aslan/system/announcement`, payload)
}

export function updateAnnouncementAPI (payload) {
  return http.put(`/api/aslan/system/announcement/update`, payload)
}

export function getAnnouncementListAPI () {
  return http.get(`/api/aslan/system/announcement/all`)
}

export function deleteAnnouncementAPI (id) {
  return http.delete(`/api/aslan/system/announcement/${id}`)
}

// Custom image
export function addImgAPI (payload) {
  return http.post(`/api/aslan/system/basicImages`, payload)
}
export function deleteImgAPI (id) {
  return http.delete(`/api/aslan/system/basicImages/${id}`)
}
export function updateImgAPI (id, payload) {
  return http.put(`/api/aslan/system/basicImages/${id}`, payload)
}

// Proxy
export function checkProxyAPI (payload) {
  return http.post('/api/aslan/system/proxyManage/connectionTest', payload)
}

export function getProxyConfigAPI () {
  return http.get('/api/aslan/system/proxyManage')
}

export function createProxyConfigAPI (payload) {
  return http.post('/api/aslan/system/proxyManage', payload)
}

export function updateProxyConfigAPI (id, payload) {
  return http.put(`/api/aslan/system/proxyManage/${id}`, payload)
}

// Quota
export function getWorkflowConcurrencySettingsAPI () {
  return http.get(`/api/aslan/system/concurrency/workflow`)
}

export function updateWorkflowConcurrencySettingsAPI (payload) {
  return http.post(`/api/aslan/system/concurrency/workflow`, payload)
}

export function getCapacityAPI (target) {
  return http.get(`/api/aslan/system/capacity/target/${target}`)
}

export function setCapacityAPI (payload) {
  return http.post(`/api/aslan/system/capacity`, payload)
}

// Cache
export function cleanCacheAPI () {
  return http.post('/api/aslan/system/cleanCache/oneClick')
}

export function timingCleanAPI (payload) {
  return http.post('/api/aslan/system/cleanCache/cron', payload)
}

export function getCleanCacheStatusAPI () {
  return http.get('/api/aslan/system/cleanCache/state')
}

// External link
export function createExternalLinkAPI (payload) {
  return http.post(`/api/aslan/system/externalLink`, payload)
}

export function updateExternalLinkAPI (id, payload) {
  return http.put(`/api/aslan/system/externalLink/${id}`, payload)
}

export function getExternalLinksAPI () {
  return http.get(`/api/aslan/system/externalLink`)
}

export function deleteExternalLinkAPI (id) {
  return http.delete(`/api/aslan/system/externalLink/${id}`)
}

// Registry
export function getRegistryListAPI (key) {
  return http.get(`/api/aslan/system/registry/namespaces?encryptedKey=${key}`)
}

export function createRegistryAPI (payload) {
  return http.post('/api/aslan/system/registry/namespaces', payload)
}

export function updateRegistryAPI (id, payload) {
  return http.put(`/api/aslan/system/registry/namespaces/${id}`, payload)
}

export function deleteRegistryAPI (id) {
  return http.delete(`/api/aslan/system/registry/namespaces/${id}`)
}

// OSS
export function getStorageListAPI (key) {
  return http.get(`/api/aslan/system/s3storage?encryptedKey=${key}`)
}

export function createStorageAPI (payload) {
  return http.post('/api/aslan/system/s3storage', payload)
}

export function updateStorageAPI (id, payload) {
  return http.put(`/api/aslan/system/s3storage/${id}`, payload)
}

export function deleteStorageAPI (id) {
  return http.delete(`/api/aslan/system/s3storage/${id}`)
}

// System setting : HELM
export function getHelmRepoAPI (key) {
  return http.get(`/api/aslan/system/helm?encryptedKey=${key}`)
}

export function createHelmAPI (payload) {
  return http.post(`/api/aslan/system/helm`, payload)
}

export function updateHelmAPI (id, payload) {
  return http.put(`/api/aslan/system/helm/${id}`, payload)
}

export function deleteHelmAPI (id) {
  return http.delete(`/api/aslan/system/helm/${id}`)
}

// Cluster
export function getClusterListAPI (projectName = '') {
  return http.get(`/api/aslan/cluster/clusters?projectName=${projectName}`)
}

export function createClusterAPI (payload) {
  return http.post(`/api/aslan/cluster/clusters`, payload)
}

export function updateClusterAPI (id, payload) {
  return http.put(`/api/aslan/cluster/clusters/${id}`, payload)
}

export function recoverClusterAPI (id) {
  return http.put(`/api/aslan/cluster/clusters/${id}/reconnect`)
}

export function disconnectClusterAPI (id) {
  return http.put(`/api/aslan/cluster/clusters/${id}/disconnect`)
}

export function deleteClusterAPI (id) {
  return http.delete(`/api/aslan/cluster/clusters/${id}`)
}

export function upgradeHubAgentAPI (id) {
  return http.get(`/api/aslan/cluster/agent/${id}/upgrade`)
}

export function getClusterNodeInfo (clusterId = '') {
  return http.get(`/api/aslan/environment/kube/nodes?clusterId=${clusterId}`)
}

export function getClusterStorageClassAPI (clusterId, type = '') {
  // type: 'all'(all available storageClasses)/ null(storageClasses for file storage types)
  return http.get(`/api/aslan/cluster/${clusterId}/storageclasses?type=${type}`)
}

export function getClusterPvcAPI (clusterId, namespace) {
  return http.get(`/api/aslan/cluster/${clusterId}/${namespace}/pvcs`)
}

// Host
export function getHostListAPI (key, keyword = '') {
  return http.get(`/api/aslan/system/privateKey?encryptedKey=${key}&keyword=${keyword}`)
}

export function getHostLabelListAPI () {
  return http.get(`/api/aslan/system/privateKey/labels`)
}

export function createHostAPI (payload) {
  return http.post(`/api/aslan/system/privateKey`, payload)
}

export function updateHostAPI (id, payload) {
  return http.put(`/api/aslan/system/privateKey/${id}`, payload)
}

export function deleteHostAPI (id) {
  return http.delete(`/api/aslan/system/privateKey/${id}`)
}

// Project Host
export function getProjectHostListAPI (key, projectName = '', keyword = '') {
  return http.get(`/api/aslan/project/pms?encryptedKey=${key}&projectName=${projectName}&keyword=${keyword}`)
}

export function createProjectHostAPI (projectName = '', payload) {
  return http.post(`/api/aslan/project/pms?projectName=${projectName}`, payload)
}

export function updateProjectHostAPI (id, projectName = '', payload) {
  return http.put(` /api/aslan/project/pms/${id}?projectName=${projectName}`, payload)
}

export function deleteProjectHostAPI (id, projectName) {
  return http.delete(`/api/aslan/project/pms/${id}?projectName=${projectName}`)
}

// Delivery Center
export function getArtifactsAPI (per_page, page, name = '', type = '', image = '', repoName = '', branch = '') {
  return http.get(`/api/aslan/delivery/artifacts?per_page=${per_page}&page=${page}&name=${name}&type=${type}&image=${image}&repoName=${repoName}&branch=${branch}`)
}

export function getArtifactsDetailAPI (id) {
  return http.get(`/api/aslan/delivery/artifacts/${id}`)
}

export function addArtifactActivitiesAPI (id, payload) {
  return http.post(`/api/aslan/delivery/artifacts/${id}/activities`, payload)
}

// Project
export function getSingleProjectAPI (projectName, envType = 'general', isBaseEnv, baseEnvName) {
  return http.get(`/api/aslan/project/products/${projectName}/services?projectName=${projectName}&envType=${envType}&isBaseEnv=${isBaseEnv}&baseEnv=${baseEnvName}`)
}

export function getProjectInfoAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}?projectName=${projectName}`)
}

export function updateProjectTypeAPI (projectName) {
  return http.put(`/api/aslan/project/products/${projectName}/type?projectName=${projectName}`)
}

export function updateSingleProjectAPI (projectName, payload) {
  return http.put(`/api/v1/picket/projects/${projectName}?projectName=${projectName}`, payload)
}

export function createProjectAPI (payload) {
  return http.post('/api/v1/picket/projects', payload)
}

export function deleteProjectAPI (projectName, is_delete = true) {
  return http.delete(`/api/v1/picket/projects/${projectName}?projectName=${projectName}&is_delete=${is_delete}`)
}

export function downloadDevelopCLIAPI (os) {
  return http.get(`/api/aslan/kodespace/downloadUrl?os=${os}`)
}

export function getServicesTemplateWithSharedAPI (projectName) {
  return http.get(`/api/aslan/service/name?projectName=${projectName}`)
}

export function updateEnvTemplateAPI (projectName, payload) {
  return http.put(`/api/aslan/project/products/${projectName}?projectName=${projectName}`, payload)
}

// Env and Service
export function createEnvAPI (projectName, payload, scene = '', type = '') {
  return http.post(`/api/aslan/environment/environments?projectName=${projectName}&scene=${scene}&type=${type}`, payload)
}

export function updateServiceAPI (projectName, serviceName, serviceType, envName, data, envType = '') {
  return http.put(`/api/aslan/environment/environments/${envName}/services/${serviceName}?projectName=${projectName}&envType=${envType}&serviceType=${serviceType}`, data, {
    params: {
      envName: envName
    }
  })
}

export function updatePmEnvAPI (projectName, envName, payload, envType = '', force = '') {
  return http.put(`/api/aslan/environment/environments/${envName}?projectName=${projectName}&envType=${envType}&force=${force}`, payload)
}

export function updateK8sEnvAPI (projectName, envName, payload) {
  return http.put(`/api/aslan/environment/environments/${envName}/k8s/globalVariables?projectName=${projectName}`, payload)
}

export function getServiceDeployableEnvsAPI (projectName, serviceName) {
  return http.get(`/api/aslan/service/services/${serviceName}/environments/deployable?projectName=${projectName}`)
}

export function updateConfigmapAPI (envType = '', payload) {
  return http.put(`/api/aslan/environment/configmaps?projectName=${payload.product_name}&envType=${envType}`, payload)
}

export function rollbackConfigmapAPI (envType = '', payload) {
  return http.post(`/api/aslan/environment/configmaps?projectName=${payload.product_name}&envType=${envType}`, payload)
}

export function deleteProjectEnvAPI (projectName, envName, envType = '', is_delete = true) {
  return http.delete(`/api/aslan/environment/environments/${envName}?projectName=${projectName}&envType=${envType}&is_delete=${is_delete}`)
}

export function restartPodAPI (podName, projectName, envName, envType = '') {
  return http.delete(`/api/aslan/environment/kube/${envName}/pods/${podName}?projectName=${projectName}&envType=${envType}`)
}

export function restartServiceOriginAPI (projectName, serviceName, envName = '', envType = '') {
  return http.post(`/api/aslan/environment/environments/${envName}/services/${serviceName}/restart?projectName=${projectName}&envType=${envType}`)
}

export function restartServiceAPI (projectName, serviceName, envName = '', scaleName, type, envType = '') {
  return http.post(`/api/aslan/environment/environments/${envName}/services/${serviceName}/restartNew?projectName=${projectName}&type=${type}&name=${scaleName}&envType=${envType}`)
}

export function restartPmServiceAPI (payload) {
  return http.post(`/api/aslan/workflow/servicetask?projectName=${payload.product_name}&`, payload)
}

export function scaleServiceAPI (projectName, serviceName, envName = '', scaleName, scaleNumber, type, envType = '') {
  return http.post(
    `/api/aslan/environment/environments/${envName}/services/${serviceName}/scaleNew?projectName=${projectName}&number=${scaleNumber}&envName=${envName}&type=${type}&name=${scaleName}&envType=${envType}`
  )
}

export function scaleEventAPI (projectName, scaleName, envName = '', type, envType = '') {
  return http.get(`/api/aslan/environment/kube/events?projectName=${projectName}&envName=${envName}&type=${type}&name=${scaleName}&envType=${envType}`)
}

export function podEventAPI (projectName, podName, envName = '', envType = '') {
  return http.get(`/api/aslan/environment/kube/pods/${podName}/events?projectName=${projectName}&envName=${envName}&envType=${envType}`)
}

export function exportYamlAPI (projectName, serviceName, envName = '', envType = '') {
  return http.get(`/api/aslan/environment/export/service?serviceName=${serviceName}&envName=${envName}&projectName=${projectName}&envType=${envType}`)
}

export function getServiceInfo (projectName, serviceName, envName = '', envType = '', workLoadType) {
  return http.get(`/api/aslan/environment/environments/${envName}/services/${serviceName}?projectName=${projectName}&envType=${envType}&workLoadType=${workLoadType}`)
}

export function autoUpgradeEnvAPI (projectName, payload, force = '') {
  return http.put(`/api/aslan/environment/environments?auto=true&projectName=${projectName}&force=${force}`, payload)
}

export function deleteEnvServicesAPI (projectName, name, payload) {
  return http.put(`/api/aslan/environment/environments/${name}/services?projectName=${projectName}`, payload)
}

export function checkingClusterIstioAPI (clusterId) {
  return http.get(`/api/aslan/cluster/istio/check/${clusterId}`)
}

export function checkingK8sServiceWorkloadsAPI (envName, projectName) {
  return http.get(`/api/aslan/environment/environments/${envName}/check/workloads/k8services?projectName=${projectName}`)
}

export function checkingShareEnvStatusAPI (envName, projectName, operation) {
  return http.get(`/api/aslan/environment/environments/${envName}/check/sharenv/${operation}/ready?projectName=${projectName}`)
}

export function enableShareEnvAPI (envName, projectName) {
  return http.post(`/api/aslan/environment/environments/${envName}/share/enable?projectName=${projectName}`)
}

export function disableShareEnvAPI (envName, projectName) {
  return http.delete(`/api/aslan/environment/environments/${envName}/share/enable?projectName=${projectName}`)
}

export function checkEphemeralContainersAPI (projectName, envName) {
  return http.get(`/api/aslan/cluster/check/ephemeralcontainers?projectName=${projectName}&envName=${envName}`)
}

export function startEphemeralContainersDebugAPI ({ projectName, envName, podName, image }) {
  return http.post(`/api/aslan/environment/kube/${envName}/pods/${podName}/debugcontainer?projectName=${projectName}&debugImage=${image}`)
}

// Initialization

export function checkInstallationStatusAPI () {
  return http.get(`/api/aslan/system/initialization/status`)
}

export function userInitializationAPI (payload) {
  return http.post(`/api/aslan/system/initialization/user`, payload)
}

// Login
export function userLoginAPI (payload) {
  return http.post(`/api/v1/login`, payload)
}

export function userLogoutAPI () {
  return http.get(`/api/v1/logout`)
}

export function userSignUpAPI (payload) {
  return http.post(`/api/v1/signup`, payload)
}

export function checkConnectorsAPI () {
  return http.get(`/api/v1/login-enabled`)
}

export function checkRegistrationAPI () {
  return http.get(`/api/v1/features/RegisterTrigger`)
}

export function getPublicKeyAPI () {
  return http.get(`/api/aslan/system/rsaKey/publicKey`)
}

export function getCaptchaAPI () {
  return http.get(`/api/v1/captcha`)
}

// Profile
export function getCurrentUserInfoAPI (uid) {
  return http.get(`/api/v1/users/${uid}/personal`)
}

export function updateCurrentUserMailAPI (uid, payload) {
  return http.put(`/api/v1/users/${uid}/personal`, payload)
}

export function updateCurrentUserInfoAPI (id, payload) {
  return http.put(`/api/v1/users/${id}/password`, payload)
}

export function getSubscribeAPI () {
  return http.get('/api/aslan/system/notification/subscribe')
}

export function saveSubscribeAPI (payload) {
  return http.post('/api/aslan/system/notification/subscribe', payload)
}

export function updateServiceImageAPI (payload, type, projectName, envName, envType = '') {
  return http.post(`/api/aslan/environment/image/${type}/${envName}?projectName=${projectName}&envType=${envType}`, payload)
}

// Preference Setting
export function getPreferenceSettingAPI (uid) {
  return http.get(`/api/v1/users/${uid}/setting`)
}

export function savePreferenceSettingAPI (uid, payload) {
  return http.put(`/api/v1/users/${uid}/setting`, payload)
}

// Notification
export function getNotificationAPI () {
  return http.get('/api/aslan/system/notification')
}

export function deleteNotificationAPI (payload) {
  return http.post('/api/aslan/system/notification/delete', payload)
}

export function markNotiReadAPI (payload) {
  return http.put('/api/aslan/system/notification/read', payload)
}

// Onboarding
export function saveOnboardingStatusAPI (projectName, status) {
  return http.put(`/api/aslan/project/products/${projectName}/${status}?projectName=${projectName}`)
}

export function validateYamlAPI (projectName, payload) {
  return http.put(`/api/aslan/service/services/yaml/validator?projectName=${projectName}`, payload)
}

export function generateEnvAPI (projectName, envType = '') {
  return http.post(`/api/aslan/environment/environments?auto=true&projectName=${projectName}&envType=${envType}`)
}

export function generateWorkflowAPI (projectName) {
  return http.post(`/api/aslan/workflow/workflow/${projectName}/auto?projectName=${projectName}`)
}

export function getProjectIngressAPI (projectName) {
  return http.get(`/api/aslan/environment/environments?subresource=ingress&projectName=${projectName}`)
}

export function productHostingNamespaceAPI (clusterId, type = '') {
  return http.get(`/api/aslan/environment/kube/available_namespaces?clusterId=${clusterId}&type=${type}`)
}

export function getHelmReleaseListAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/environments/${envName}/helm/releases?projectName=${projectName}`)
}

export function getChartInfoAPI (projectName, envName, serviceName) {
  return http.get(`/api/aslan/environment/environments/${envName}/helm/charts?projectName=${projectName}&serviceName=${serviceName.join(',')}`)
}

export function createHelmVersionAPI (projectName, payload) {
  return http.post(`/api/aslan/delivery/releases/helm?projectName=${projectName}`, payload)
}

export function useGlobalVariablesAPI (projectName, payload) {
  return http.post(`/api/aslan/delivery/releases/helm/global-variables?projectName=${projectName}`, payload)
}

export function getChartLastVersionAPI (projectName, chartRepoName, chartName) {
  return http.get(`/api/aslan/delivery/releases/helm/charts/version?projectName=${projectName}&chartName=${chartName.join(',')}&chartRepoName=${chartRepoName}`)
}

export function getChartServiceImgsAPI (projectName, envName, chartName) {
  return http.get(`/api/aslan/environment/environments/${envName}/helm/images?projectName=${projectName}&serviceName=${chartName}`)
}

// Forgot password
export function retrievePasswordAPI (account) {
  return http.get(`/api/v1/retrieve?account=${account}`)
}

export function changePasswordAPI (payload) {
  return http.post('/api/v1/reset', payload)
}

// Template Helm
export function getChartTemplatesAPI (projectName = '') {
  return http.get(`/api/aslan/template/charts?projectName=${projectName}`)
}

export function getChartTemplateByNameAPI (name) {
  return http.get(`/api/aslan/template/charts/${name}`)
}

export function getTemplateFileContentAPI (name, fileName, filePath) {
  return http.get(`/api/aslan/template/charts/${name}/files?fileName=${fileName}&filePath=${filePath}`)
}

export function createChartTemplateAPI (payload) {
  return http.post(`/api/aslan/template/charts`, payload)
}

export function updateChartTemplateAPI (name, payload) {
  return http.put(`/api/aslan/template/charts/${name}`, payload)
}

export function deleteChartTemplateAPI (name) {
  return http.delete(`/api/aslan/template/charts/${name}`)
}

export function createHelmTemplateServiceAPI (projectName, payload) {
  return http.post(`/api/aslan/service/helm/services?projectName=${projectName}`, payload)
}

export function updateHelmTemplateServiceAPI (projectName, payload) {
  return http.put(`/api/aslan/service/helm/services?projectName=${projectName}`, payload)
}

export function createHelmTemplateMultiServiceAPI (projectName, payload) {
  return http.post(`/api/aslan/service/helm/services/bulk?projectName=${projectName}`, payload)
}

export function getHelmTemplateVariableAPI (name) {
  return http.get(`/api/aslan/template/charts/${name}/variables`)
}

export function saveHelmTemplateVariableAPI (name, payload) {
  return http.put(`/api/aslan/template/charts/${name}/variables`, payload)
}

export function getHelmTemplateReferenceAPI (chartName) {
  return http.get(`/api/aslan/template/charts/${chartName}/reference`)
}

// Template Dockerfile
export function getDockerfileTemplatesAPI (projectName = '') {
  return http.get(`/api/aslan/template/dockerfile?page_num=1&page_size=9999&projectName=${projectName}`)
}

export function createDockerfileTemplateAPI (payload) {
  return http.post(`/api/aslan/template/dockerfile`, payload)
}

export function updateDockerfileTemplateAPI (id, payload) {
  return http.put(`/api/aslan/template/dockerfile/${id}`, payload)
}

export function validateDockerfileAPI (payload) {
  return http.post(`/api/aslan/template/dockerfile/validation`, payload)
}

export function getDockerfileAPI (id, projectName = '') {
  return http.get(`/api/aslan/template/dockerfile/${id}?projectName=${projectName}`)
}

export function deleteDockerfileTemplateAPI (id) {
  return http.delete(`/api/aslan/template/dockerfile/${id}`)
}

export function getDockerfileTemplateBuildReferenceAPI (id) {
  return http.get(`/api/aslan/template/dockerfile/${id}/reference`)
}

// Template Kubernetes
export function getKubernetesTemplatesAPI (projectName = '') {
  return http.get(`/api/aslan/template/yaml?projectName=${projectName}&page_num=1&page_size=9999`)
}

export function createKubernetesTemplateAPI (payload) {
  return http.post(`/api/aslan/template/yaml`, payload)
}

export function updateKubernetesTemplateAPI (id, payload) {
  return http.put(`/api/aslan/template/yaml/${id}`, payload)
}

export function updateMulKubernetesTemplateAPI (id, payload) {
  return http.post(`/api/aslan/template/yaml/${id}/reference`)
}

export function validateKubernetesTemplateVariableAPI (payload) {
  return http.post(`/api/aslan/template/yaml/validateVariable`, payload)
}

export function saveKubernetesTemplateVariableAPI (templateId, payload) {
  return http.put(`/api/aslan/template/yaml/${templateId}/variable`, payload)
}

export function getKubernetesTemplateDetailAPI (id, projectName = '') {
  return http.get(`/api/aslan/template/yaml/${id}?projectName=${projectName}`)
}

export function deleteKubernetesTemplateAPI (id) {
  return http.delete(`/api/aslan/template/yaml/${id}`)
}

export function getKubernetesTemplateBuildReferenceAPI (id) {
  return http.get(`/api/aslan/template/yaml/${id}/reference`)
}

export function getKubernetesTemplatePreviewAPI (payload, projectName) {
  return http.post(`/api/aslan/service/template/preview?projectName=${projectName}`, payload)
}

export function loadServiceFromKubernetesTemplateAPI (payload, projectName = '') {
  return http.post(`/api/aslan/service/template/load?projectName=${projectName}`, payload)
}

export function reloadServiceFromKubernetesTemplateAPI (payload, projectName = '') {
  return http.post(`/api/aslan/service/template/reload?projectName=${projectName}`, payload)
}

// Template Build
export function getBuildTemplatesAPI (projectName = '') {
  return http.get(`/api/aslan/template/build?page_num=1&page_size=9999&projectName=${projectName}`)
}

export function createBuildTemplateAPI (payload) {
  return http.post(`/api/aslan/template/build`, payload)
}

export function updateBuildTemplateAPI (id, payload) {
  return http.put(`/api/aslan/template/build/${id}`, payload)
}

export function getBuildTemplateDetailAPI (id, projectName = '') {
  return http.get(`/api/aslan/template/build/${id}?projectName=${projectName}`)
}

export function deleteBuildTemplateAPI (id) {
  return http.delete(`/api/aslan/template/build/${id}`)
}

export function getBuildTemplateReferenceAPI (id) {
  return http.get(`/api/aslan/template/build/${id}/reference`)
}

// Helm env and service
export function getChartValuesYamlAPI (projectName, envName, payload) {
  return http.post(`/api/aslan/environment/rendersets/renderchart?projectName=${projectName}&envName=${envName}`, { get_svc_render_args: payload })
}

export function getAllChartValuesYamlAPI (projectName, envName, payload) {
  return http.post(`/api/aslan/environment/environments/${envName}/estimated-renderchart?projectName=${projectName}`, { get_svc_render_args: payload })
}

export function getEnvDefaultVariableAPI (projectName, envName, ifPassFilter = true) {
  return http.get(`/api/aslan/environment/rendersets/default-values?projectName=${projectName}&envName=${envName}&ifPassFilter=${ifPassFilter}`)
}

export function getServiceDefaultVariableAPI (projectName, envName, serviceName = [], ifPassFilter = true) {
  return http.get(`/api/aslan/environment/rendersets/variables?projectName=${projectName}&envName=${envName}&serviceName=${serviceName.join(',')}&ifPassFilter=${ifPassFilter}`)
}

export function createHelmEnvAPI (projectName, payload, scene = '') {
  return http.post(`/api/aslan/environment/environments?type=helm&projectName=${projectName}&scene=${scene}`, payload)
}

export function updateHelmTemplateAPI (templateName) {
  return http.post(`/api/aslan/template/charts/${templateName}/reference`)
}

export function updateHelmEnvAPI (projectName, payload) {
  return http.put(`/api/aslan/environment/environments?type=helm&projectName=${projectName}`, payload)
}

export function updateHelmEnvVarAPI (projectName, envName, payload) {
  return http.put(`/api/aslan/environment/environments/${envName}/helm/default-values?projectName=${projectName}`, payload)
}

export function updateHelmServiceVarAPI (projectName, envName, payload) {
  return http.put(`/api/aslan/environment/environments/${envName}/helm/charts?projectName=${projectName}`, payload)
}

export function getRunningValuesYamlAPI (projectName, envName, serviceName) {
  return http.get(`/api/aslan/environment/environments/${envName}/helm/values?projectName=${projectName}&serviceName=${serviceName}`)
}

export function updateMatchRulesAPI (projectName, payload) {
  return http.put(`/api/aslan/project/products/${projectName}/searching-rules?projectName=${projectName}`, payload)
}

export function getMatchRulesAPI (projectName) {
  return http.get(`/api/aslan/project/products/${projectName}/searching-rules?projectName=${projectName}`)
}

export function getCreateHelmEnvStatusAPI (projectName) {
  return http.get(`/api/aslan/environment/environments?subresource=status&projectName=${projectName}`)
}

export function getCalculatedValuesYamlAPI ({ projectName, serviceName, envName, format, scene }, payload) { // defaultValues, overrideYaml, overrideValues
  return http.post(`/api/aslan/environment/environments/${envName}/estimated-values?projectName=${projectName}&format=${format}&serviceName=${serviceName}&scene=${scene}`, payload)
}

export function getValuesYamlFromGitAPI ({ codehostID, owner, repo, branch, valuesPath, valuesPaths, namespace }) {
  return http.get(`/api/aslan/environment/rendersets/yamlContent`, {
    params: {
      codehostID,
      owner,
      repo,
      branch,
      valuesPaths: valuesPaths.length > 0 && valuesPaths[0] ? valuesPaths.join(',') : valuesPath,
      namespace: namespace || owner
    }
  })
}

// External
export function queryWorkloads (projectName, clusterId, namespace, page) {
  return http.get(`/api/aslan/environment/kube/workloads?projectName=${projectName}&namespace=${namespace}&clusterId=${clusterId}&perPage=1200&page=${page}`)
}

export function queryServiceWorkloads (projectName, envName) {
  return http.get(`/api/aslan/service/workloads?projectName=${projectName}&env=${envName}`)
}

export function postWorkloads (payload) {
  return http.post(`/api/aslan/service/workloads?projectName=${payload.product_name}`, payload)
}

export function editWorkloads (payload) {
  return http.put(`/api/aslan/service/workloads?projectName=${payload.product_name}&env=${payload.env_name}`, payload)
}

// RBAC APIs
export function queryPolicyDefinitionsAPI (projectName, project = '', envType = 'k8s') {
  return http.get(`/api/v1/policy-definitions?projectName=${projectName}&scope=${project}&env_type=${envType}`)
}

export function addRoleAPI (payload) {
  return http.post(`/api/v1/roles?projectName=${payload.projectName}`, payload)
}

export function updateRoleAPI (payload) {
  return http.put(`/api/v1/roles/${payload.name}?projectName=${payload.projectName}`, payload)
}

export function queryRoleAPI (projectName) {
  return http.get(`/api/v1/roles?projectName=${projectName}`)
}

export function queryRoleDetailAPI (name, projectName) {
  return http.get(`/api/v1/roles/${name}?projectName=${projectName}`)
}

export function addPublicRoleAPI (payload, projectName) {
  return http.post(`/api/v1/public-roles?projectName=${projectName}`, payload)
}

export function deletePublicRoleAPI (name, projectName) {
  return http.delete(`/api/v1/public-roles/${name}?projectName=${projectName}`)
}

export function queryPublicRoleAPI (projectName) {
  return http.get(`/api/v1/preset-roles?projectName=${projectName}`)
}

export function updateMutiRolebindingsAPI (projectName, userID, payload) {
  return http.post(`/api/v1/rolebindings/update?projectName=${projectName}&bulk=true&userID=${userID}`, payload)
}

export function queryPublicRoleDetailAPI (name, projectName) {
  return http.get(`/api/v1/public-roles/${name}?projectName=${projectName}`)
}

export function updatePublicRoleAPI (payload, projectName) {
  return http.put(`/api/v1/public-roles/${payload.name}?projectName=${projectName}`, payload)
}

export function deleteRoleAPI (name, projectName) {
  return http.delete(`/api/v1/roles/${name}?projectName=${projectName}`)
}

export function addRoleBindingsAPI (payload, projectName) {
  return http.post(`/api/v1/rolebindings?projectName=${projectName}&bulk=true`, payload)
}

export function deleteRoleBindingsAPI (name, projectName) {
  return http.delete(`/api/v1/rolebindings/${name}?projectName=${projectName}`)
}

export function queryRoleBindingsAPI (projectName) {
  return http.get(`/api/v1/picket/bindings?projectName=${projectName}`)
}

export function queryUserBindingsAPI (uid, projectName = '') { // Query all binding roles of the user, pass projectName for project binding, default is system binding
  return http.get(`/api/v1/userbindings?uid=${uid}&projectName=${projectName}`)
}

export function getArtifactFileAPI (payload, id, projectName = '') {
  return http.post(`/api/aslan/system/s3storage/${id}/releases/search?kind=file&projectName=${projectName}`, payload)
}

// Collaboration mode
export function getNewCollaborationAPI (projectName) {
  return http.get(`/api/aslan/collaboration/collaborations/new?projectName=${projectName}`)
}

export function initializeCollaborationAPI (projectName, payload) {
  return http.post(`/api/aslan/collaboration/collaborations/sync?projectName=${projectName}`, payload)
}

export function getAllCollaborationAPI (projectName) {
  return http.get(`/api/aslan/collaboration/collaborations?projectName=${projectName}`)
}

export function createCollaborationAPI (projectName, payload) {
  return http.post(`/api/aslan/collaboration/collaborations?projectName=${projectName}`, payload)
}

export function updateNewCollaborationAPI (projectName, name, payload) {
  return http.put(`/api/aslan/collaboration/collaborations/${name}?projectName=${projectName}`, payload)
}

export function deleteCollaborationAPI (projectName, name) {
  return http.delete(`/api/aslan/collaboration/collaborations/${name}?projectName=${projectName}`)
}

export function getAllPolicyAPI (projectName) {
  return http.get(`/api/v1/policies?projectName=${projectName}`)
}

export function getPolicyByNameAPI (projectName, name) {
  return http.get(`/api/v1/policies/${name}?projectName=${projectName}`)
}

export function getPolicyByIdAPI (projectName, id) {
  return http.get(`/api/v1/policy/${id}?projectName=${projectName}`)
}

// Variable group list
export function getVariablesGroupsAPI (projectName, page, perPage, ifPassFilter = true) {
  return http.get(`/api/aslan/project/variablesets?page=${page}&perPage=${perPage}&projectName=${projectName}&ifPassFilter=${ifPassFilter}`)
}

export function getVariablesGroupByIdAPI (projectName, id) {
  return http.get(`/api/aslan/project/variablesets/${id}?projectName=${projectName}`)
}

export function createVariablesGroupAPI (projectName, payload) {
  return http.post(`/api/aslan/project/variablesets?projectName=${projectName}`, payload)
}

export function updateVariablesGroupAPI (projectName, id, payload) {
  return http.put(`/api/aslan/project/variablesets/${id}?projectName=${projectName}`, payload)
}

export function deleteVariablesGroupAPI (projectName, id) {
  return http.delete(`/api/aslan/project/variablesets/${id}?projectName=${projectName}`)
}

// Insight
export function getLatestBuildsAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/buildLatestTenMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getLongestBuildsAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/buildTenDurationMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getBuildHealthAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/buildHealthMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getAverageBuildsDurationAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/buildAverageMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getDaliyBuildsFeqAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/buildDailyMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getBuildTrendAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/buildTrend`, { startDate, endDate, productNames: projectNames })
}

export function getTestHealthAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/testHealthMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getAverageTestsDurationAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/testAverageMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getTestTrendAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/testTrend`, { startDate, endDate, productNames: projectNames })
}

export function getTestCasesAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/testCaseMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getTestDeployAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/testDeliveryDeploy`, { startDate, endDate, productNames: projectNames })
}

export function getServiceHealthAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/deployHealthMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getServiceDeployAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/deployWeeklyMeasure`, { startDate, endDate, productNames: projectNames })
}
export function getServiceDeploySummaryAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/deployTopFiveHigherMeasure`, { startDate, endDate, productNames: projectNames })
}

export function getServiceFailureAPI ({ startDate, endDate, projectNames }) {
  return http.post(`/api/aslan/stat/quality/deployTopFiveFailureMeasure`, { startDate, endDate, productNames: projectNames })
}

// Environment config
export function getConfigYamlAPI ({ codehostId, repoOwner, repoName, branchName, path, isDir, projectName }) {
  const params = {
    repoOwner,
    repoName,
    branchName,
    path,
    isDir,
    projectName
  }
  return http.get(`/api/aslan/code/workspace/getcontents/${codehostId}`, { params })
}

export function getIngressObjectAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/ingresses/${envName}?projectName=${projectName}`)
}

export function getConfigMapObjectAPI (projectName, envName, serviceName = '') {
  return http.get(`/api/aslan/environment/configmaps/${envName}?projectName=${projectName}&serviceName=${serviceName}`)
}

export function getSecretObjectAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/secrets/${envName}?projectName=${projectName}`)
}

export function getPvcObjectAPI (projectName, envName) {
  return http.get(`/api/aslan/environment/pvcs/${envName}?projectName=${projectName}`)
}

export function addConfigObjectAPI (projectName, payload) {
  // payload: { env_name, common_env_cfg_type[Secret|Ingress|ConfigMap|PVC], yaml_data }
  return http.post(`/api/aslan/environment/envcfgs/${payload.env_name}?projectName=${projectName}`, payload)
}

export function updateConfigObjectAPI (projectName, rollback = false, payload) {
  return http.put(`/api/aslan/environment/envcfgs/${payload.env_name}?projectName=${projectName}&rollback=${rollback}`, payload)
}

export function deleteConfigObjectAPI ({ objectName, projectName, envName, commonEnvCfgType }) {
  // commonEnvCfgType: Secret|Ingress|ConfigMap|PVC
  return http.delete(`/api/aslan/environment/envcfgs/${envName}/cfg/${objectName}?projectName=${projectName}&commonEnvCfgType=${commonEnvCfgType}`)
}

export function getObjectHistoryVersionAPI ({ objectName, projectName, envName, commonEnvCfgType }) {
  return http.get(`/api/aslan/environment/envcfgs/${envName}/cfg/${objectName}?projectName=${projectName}&commonEnvCfgType=${commonEnvCfgType}`)
}

// Custom Workflow
export function addCustomWorkflowAPI (payload, projectName) {
  return http.post(`/api/aslan/workflow/v4?projectName=${projectName} `, payload)
}

export function updateCustomWorkflowAPI (workflow_name, payload, projectName) {
  return http.put(` /api/aslan/workflow/v4/${workflow_name}?projectName=${projectName} `, payload)
}

export function getCustomWorkflowListAPI (projectName, viewName = '', page_num = 1, page_size = 500) {
  return http.get(`/api/aslan/workflow/v4?project=${projectName}&view_name=${viewName}&page_num=${page_num}&page_size=${page_size}&projectName=${projectName}`)
}

export function getCustomWorkflowDetailAPI (workflow_name, projectName, key = '') {
  return http.get(`/api/aslan/workflow/v4/name/${workflow_name}?projectName=${projectName}&encryptedKey=${key}`)
}

export function deleteCustomWorkflowAPI (workflow_name, projectName) {
  return http.delete(`/api/aslan/workflow/v4/${workflow_name}?projectName=${projectName}`)
}

export function getCustomWorkfloweTaskPresetAPI (workflow_name, projectName, key = '') {
  return http.get(`/api/aslan/workflow/v4/preset/${workflow_name}?projectName=${projectName}&encryptedKey=${key}`)
}

export function checkWorkflowApprovalAPI (workflowName) {
  return http.post(`/api/aslan/workflow/v4/check/lark/${workflowName}`)
}

export function runCustomWorkflowTaskAPI (payload, projectName) {
  return http.post(`/api/aslan/workflow/v4/workflowtask?projectName=${projectName}`, payload)
}

export function getCustomWorkflowTaskListAPI (workflow_name, page_num = 1, page_size = 20, projectName) {
  return http.get(`/api/aslan/workflow/v4/workflowtask?workflow_name=${workflow_name}&page_num=${page_num}&page_size=${page_size}&projectName=${projectName}`)
}

export function getCustomWorkflowTaskDetailAPI (workflow_name, task_id, projectName) {
  return http.get(`/api/aslan/workflow/v4/workflowtask/workflow/${workflow_name}/task/${task_id}?projectName=${projectName}`)
}

export function deleteCustomWorkflowTaskAPI (workflow_name, id, projectName) {
  return http.delete(`/api/aslan/workflow/v4/workflowtask/workflow/${workflow_name}/task/${id}?projectName=${projectName}`)
}

export function retryCustomWorkflowTaskAPI (workflowName, id, projectName) {
  return http.post(`/api/aslan/workflow/v4/workflowtask/retry/workflow/${workflowName}/task/${id}?projectName=${projectName}`)
}

export function getJobHistoryLogsAPI (workflow_name, task_id, job_name, projectName) {
  return http.get(`/api/aslan/logs/log/v4/workflow/${workflow_name}/tasks/${task_id}/jobs/${job_name}?projectName=${projectName}`)
}

export function getRunningLogAPI (workflow_name, task_id, job_name, lines, projectName) {
  return http.get(`/api/aslan/logs/log/v4/workflow/${workflow_name}/${task_id}/jobs/${job_name}/${lines}?projectName=${projectName}`)
}

export function getRunningStatusCustomWorkflowListAPI () {
  return makeEventSource(`/api/aslan/workflow/sse/workflowTasks/running`)
}

export function getPendingStatusCustomWorkflowListAPI () {
  return makeEventSource(`/api/aslan/workflow/sse/workflowTasks/pending`)
}

export function checkCustomWorkflowYaml (payload) {
  return http.post(`/api/aslan/workflow/v4/lint`, payload)
}

export function getCustomCloneDetailAPI (workflow_name, task_id, projectName) {
  return http.get(`/api/aslan/workflow/v4/workflowtask/clone/workflow/${workflow_name}/task/${task_id}?projectName=${projectName}`)
}

// Approval
export function approvalCustomWorkflowTaskAPI (payload, projectName) {
  return http.post(`/api/aslan/workflow/v4/workflowtask/approve?projectName=${projectName}`, payload)
}

// Webhook
export function addCustomWebhookAPI (projectName, workflowName, payload) {
  return http.post(`/api/aslan/workflow/v4/webhook/${workflowName}?projectName=${projectName}`, payload)
}

export function getCustomWebhooksAPI (projectName, workflowName) {
  return http.get(`/api/aslan/workflow/v4/webhook?projectName=${projectName}&workflowName=${workflowName}`)
}

export function getCustomWebhookPresetAPI (projectName, workflowName, triggerName = '') {
  return http.get(`/api/aslan/workflow/v4/webhook/preset?projectName=${projectName}&workflowName=${workflowName}&triggerName=${triggerName}`)
}

export function removeCustomWebhookAPI (projectName, workflowName, triggerName) {
  return http.delete(`/api/aslan/workflow/v4/webhook/${workflowName}/trigger/${triggerName}?projectName=${projectName}`)
}

export function updateCustomWebhookAPI (projectName, workflowName, payload) {
  return http.put(`/api/aslan/workflow/v4/webhook/${workflowName}?projectName=${projectName}`, payload)
}

// Timer
export function addCustomTimerAPI (projectName, workflowName, payload) {
  return http.post(`/api/aslan/workflow/v4/cron/${workflowName}?projectName=${projectName}`, payload)
}

export function getCustomTimersAPI (projectName, workflowName) {
  return http.get(`/api/aslan/workflow/v4/cron?projectName=${projectName}&workflowName=${workflowName}`)
}

export function getCustomTimerPresetAPI (projectName, workflowName, cronID = '') {
  return http.get(`/api/aslan/workflow/v4/cron/preset?projectName=${projectName}&workflowName=${workflowName}&cronID=${cronID}`)
}

export function removeCustomTimerAPI (projectName, workflowName, cronID) {
  return http.delete(`/api/aslan/workflow/v4/cron/${workflowName}/trigger/${cronID}?projectName=${projectName}`)
}

export function updateCustomTimerAPI (projectName, payload) {
  return http.put(`/api/aslan/workflow/v4/cron?projectName=${projectName}`, payload)
}

// Plugins
export function getPluginsAPI () {
  return http.get(`/api/aslan/workflow/plugin/template`)
}

export function updatePlugin (payload) {
  return http.post(`/api/aslan/workflow/plugin`, payload)
}

export function delPlugin (id) {
  return http.delete(`/api/aslan/workflow/plugin/${id}`)
}

export function getPlugins () {
  return http.get(`/api/aslan/workflow/plugin`)
}

export function getNamespaceListAPI (clusterID) {
  return http.get(`/api/aslan/environment/kube/namespace/cluster/${clusterID}`)
}

export function getWorkloadListAPI (clusterID, namespace) {
  return http.get(`/api/aslan/environment/kube/custom_workload/cluster/${clusterID}/namespace/${namespace}`)
}

export function getTestListAPI () {
  return http.get(`/api/v1/picket/testing`)
}

export function getTestJunitReportAPI (workflowName, taskID, jobName, projectName) {
  return http.get(`/api/aslan/testing/itreport/workflowv4/${workflowName}/id/${taskID}/job/${jobName}?projectName=${projectName}`)
}

export function getTestFileListAPI (workflowName, taskID, jobName, projectName) {
  return http.get(`/api/aslan/testing/workspace/workflowv4/${workflowName}/taskId/${taskID}/job/${jobName}?projectName=${projectName}`)
}

export function getResourcesListAPI (clusterID, namespace) {
  return http.get(`/api/aslan/environment/kube/resources/cluster/${clusterID}/namespace/${namespace}`)
}

export function getPatchEnvAPI (payload) {
  return http.post(`/api/aslan/workflow/v4/patch`, payload)
}

export function getDeploymentListAPI (clusterID, namespace) {
  return http.get(`/api/aslan/environment/kube/deployment/cluster/${clusterID}/namespace/${namespace}`)
}

export function getNewWorkloadListAPI (clusterID, namespace) {
  return http.get(`/api/aslan/environment/kube/workload/cluster/${clusterID}/namespace/${namespace}`)
}

export function getCanaryServiceListAPI (clusterID, namespace) {
  return http.get(`/api/aslan/environment/kube/canary_service/cluster/${clusterID}/namespace/${namespace}`)
}

export function getWorkflowGlobalVarsAPI (currentJobName, payload) {
  return http.post(`/api/aslan/workflow/v4/output/${currentJobName}`, payload)
}

export function getClusterStatusAPI (type, projectName, name, id) {
  return http.get(`/api/aslan/workflow/v4/sharestorage?type=${type}&project=${projectName}&name=${name}&id=${id}`)
}

export function getDeploymentsAPI (clusterId, namespace) {
  return http.get(`/api/aslan/cluster/${clusterId}/${namespace}/deployments`)
}

export function getIstioVirtualServicesAPI (clusterId, namespace) {
  return http.get(`/api/aslan/cluster/${clusterId}/${namespace}/istio/virtualservices`)
}

export function previewChangedYaml (envName, serviceName, projectName, payload) {
  return http.post(`/api/aslan/environment/environments/${envName}/services/${serviceName}/preview?projectName=${projectName}`, payload)
}

export function previewChangedHelmYaml (projectName, payload) {
  return http.post(`/api/aslan/workflow/v4/yamlComparison?projectName=${projectName}`, payload)
}

export function getFilterEnvServicesAPI (projectName, payload) {
  return http.post(`/api/aslan/workflow/v4/filterEnv?projectName=${projectName}`, payload)
}

export function getTestEnvServiceListAPI (envName, projectName) {
  return http.get(`/api/aslan/environment/environments/${envName}/services?projectName=${projectName}`)
}

// dashboard

export function addDashboardSettingsAPI (payload) {
  return http.post(`/api/aslan/system/dashboard/settings`, payload)
}
export function updateDashboardSettingsAPI (payload) {
  return http.put(`/api/aslan/system/dashboard/settings`, payload)
}
export function getDashboardSettingsAPI (payload) {
  return http.get(`/api/aslan/system/dashboard/settings`, payload)
}
export function getMyWorkflowAPI (cardId) {
  return http.get(`/api/aslan/system/dashboard/workflow/mine?card_id=${cardId}`)
}
export function getRunningWorkflowAPI () {
  return http.get(`/api/aslan/system/dashboard/workflow/running`)
}
export function getMyEnvAPI (name, projectName) {
  return http.get(`/api/aslan/system/dashboard/environment/${name}?projectName=${projectName}`)
}
export function getMyWorkflowsAPI (projectName) {
  return http.get(`/api/v1/picket/workflows/all?projectName=${projectName}`)
}
// workflow Jira job
export function getJirasAPI (projectName) {
  return http.get(`/api/aslan/system/project_management/jira/project?projectName=${projectName}`)
}
export function getIssueTypesAndStatusAPI (projectName) {
  return http.get(`/api/aslan/system/project_management/jira/type?project=${projectName}`)
}

export function getWebhookJiraAPI (workflowName) {
  return http.get(`/api/aslan/workflow/v4/jirahook/${workflowName}`)
}

export function deleteWebhookJiraAPI (workflowName, hookName, payload) {
  return http.delete(`/api/aslan/workflow/v4/jirahook/${workflowName}/${hookName}`, payload)
}

export function updateWebhookJiraAPI (workflowName, payload) {
  return http.put(`/api/aslan/workflow/v4/jirahook/${workflowName}`, payload)
}
export function addWebhookJiraAPI (workflowName, payload) {
  return http.post(`/api/aslan/workflow/v4/jirahook/${workflowName}`, payload)
}
export function getWebhookJiraPresetAPI (workflowName, hookName) {
  return http.get(`/api/aslan/workflow/v4/jirahook/preset?workflowName=${workflowName}&hookName=${hookName}`)
}

export function searchIssueAPI (project, type, keyword, ne = false) {
  return http.get(`/api/aslan/system/project_management/jira/issue?project=${project}&type=${type}&summary=${keyword}&ne=${ne}`)
}

export function searchJqlIssueAPI (project, jql = '', keyword = '') {
  return http.get(`/api/aslan/system/project_management/jira/issue/jql?project=${project}&jql=${jql}&summary=${keyword}`)
}

export function getWebhookCommonAPI (workflowName) {
  return http.get(`/api/aslan/workflow/v4/generalhook/${workflowName}`)
}

export function deleteWebhookCommonAPI (workflowName, hookName, payload) {
  return http.delete(`/api/aslan/workflow/v4/generalhook/${workflowName}/${hookName}`, payload)
}

export function updateWebhookCommonAPI (workflowName, payload) {
  return http.put(`/api/aslan/workflow/v4/generalhook/${workflowName}`, payload)
}
export function addWebhookCommonAPI (workflowName, payload) {
  return http.post(`/api/aslan/workflow/v4/generalhook/${workflowName}`, payload)
}
export function getWebhookCommonPresetAPI (workflowName, hookName) {
  return http.get(`/api/aslan/workflow/v4/generalhook/preset?workflowName=${workflowName}&hookName=${hookName}`)
}
