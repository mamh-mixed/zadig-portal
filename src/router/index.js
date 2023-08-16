import Vue from 'vue'
import VueRouter from 'vue-router'
import i18n from '@/lang'

const onboarding_home = () => import('@/components/entry/home.vue')

Vue.use(VueRouter)
const routes = [
  {
    path: '/v1',
    component: onboarding_home,
    meta: {},
    children: [
      { path: 'statistics', component: () => import(/* webpackChunkName: "Statistics" */ '@/components/statistics/view.vue'), meta: { title: i18n.t('sidebarMenu.dataOverview') } },
      {
        path: '/v1/insight',
        component: () => import(/* webpackChunkName: "Insight" */ '@/components/insight/home.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.dataInsight')
        },
        redirect: {
          path: '/v1/insight/build',
          query: { projectNames: '' }
        },
        children: [
          {
            path: 'build',
            component: () => import(/* webpackChunkName: "Insight Build" */ '@/components/insight/build/view.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('dataStatistics.insight.buildInsight')
            }
          },
          {
            path: 'test',
            component: () => import(/* webpackChunkName: "Insight Test" */ '@/components/insight/test/view.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('dataStatistics.insight.testInsight')
            }
          },
          {
            path: 'service',
            component: () => import(/* webpackChunkName: "Insight Service" */ '@/components/insight/service/view.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('dataStatistics.insight.deployInsight')
            }
          }
        ]
      },
      {
        path: 'dashboard',
        component: () => import('@/components/dashboard/index.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.dashboard')
        }
      },
      {
        path: 'projects',
        component: () => import(/* webpackChunkName: "Project List" */ '@/components/projects/detail/home.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.projects')
        }
      },
      {
        path: 'projects/detail/:project_name',
        component: () => import(/* webpackChunkName: "Project View" */ '@/components/projects/detail/view.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.projects')
        },
        children: [
          {
            path: 'detail',
            component: () => import(/* webpackChunkName: "Project Detail" */ '@/components/projects/detail/detail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.projectDetail')
            }
          },
          {
            path: 'pipelines',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/list.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('subTopbarMenu.workflows')
            }
          },
          {
            path: 'pipelines/multi/:workflow_name',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/productWorkflowDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.workflowDetail')
            }
          },
          {
            path: 'pipelines/custom/create',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/workflowEditor/customWorkflow'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.createWorkflow')
            }
          },
          {
            path: 'pipelines/custom/edit/:workflow_name',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/workflowEditor/customWorkflow'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.editWorkflow')
            }
          },
          {
            path: 'pipelines/multi/:workflow_name/:task_id',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/productWorkflowTaskDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.taskDetail')
            }
          },
          {
            path: 'pipelines/custom/:workflow_name/:task_id',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/customWorkflowTaskDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.taskDetail')
            }
          },
          {
            path: 'pipelines/multi/testcase/:workflow_name/:task_id/:test_name/:test_job_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/report/productWorkflowTestCase.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.testReport')
            }
          },
          {
            path: 'customPipelines/multi/testcase/:workflow_name/:task_id/:test_name/:test_job_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/report/customWorkflowTestCase.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.testReport')
            }
          },
          {
            path: 'pipelines/custom/:workflow_name',
            component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/customWorkflowDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.taskList')
            }
          },
          {
            path: 'services',
            component: () => import(/* webpackChunkName: "Project Service" */ '@/components/projects/serviceMgr/service.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('subTopbarMenu.services')
            }
          },
          {
            path: 'builds',
            component: () => import(/* webpackChunkName: "Project Build" */ '@/components/projects/build/config.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('subTopbarMenu.builds')
            }
          },
          {
            path: 'builds/create',
            component: () => import(/* webpackChunkName: "Project Build" */ '@/components/projects/build/configDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.createBuild')
            }
          },
          {
            path: 'builds/detail/:build_name',
            component: () => import(/* webpackChunkName: "Project Build" */ '@/components/projects/build/configDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.buildDetail')
            }
          },
          {
            path: 'test',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/common/function/function.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('subTopbarMenu.tests')
            }
          },
          {
            path: 'test/function/:test_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/function/functionDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('subTopbarMenu.tests')
            }
          },
          {
            path: 'test/add/function',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/function/functionDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.addTest')
            }
          },
          {
            path: 'test/detail/function/:test_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/function/functionSummary.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.testDetail')
            }
          },
          {
            path: 'test/detail/function/:test_name/:task_id',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/function/functionTaskDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.testTaskDetail')
            }
          },
          {
            path: 'test/testcase/function/:workflow_name/:task_id/:test_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/report/testCase.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.testReport')
            }
          },
          {
            path: 'test/testcase/function/:workflow_name/:task_id/test/:test_name',
            component: () => import(/* webpackChunkName: "Project Test" */ '@/components/projects/test/report/testCase.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.testReport')
            }
          },
          {
            path: 'scanner',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/home.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: i18n.t('subTopbarMenu.scannings')
            }
          },
          {
            path: 'scanner/create',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/create.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: i18n.t('metaTitle.createScanning')
            }
          },
          {
            path: 'scanner/edit/:scanner_name',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/create.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: i18n.t('metaTitle.editScanning')
            }
          },
          {
            path: 'scanner/detail/:scanner_name',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/history.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: i18n.t('metaTitle.taskList')
            }
          },
          {
            path: 'scanner/detail/:scanner_name/task/:task_id',
            component: () => import(/* webpackChunkName: "Project Scanner" */ '@/components/projects/scanner/taskDetail.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: i18n.t('metaTitle.scanningTaskDetail')
            }
          },
          {
            path: 'envs',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/home.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('subTopbarMenu.environments')
            },
            children: [
              {
                path: 'create',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/createEnv.vue'),
                meta: {
                  requiresAuth: true,
                  createEnv: true,
                  title: i18n.t('subTopbarMenu.createEnvironment')
                }
              },
              {
                path: 'detail',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/envDetail.vue'),
                meta: {
                  requiresAuth: true,
                  title: i18n.t('subTopbarMenu.environments')
                }
              },
              {
                path: ':env_name/log',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/k8s/common/changeLog.vue'),
                meta: {
                  requiresAuth: true,
                  title: i18n.t('environments.common.envChangeLog')
                }
              },
              {
                path: 'externalConfig',
                component: () => import(/* webpackChunkName: "Project Hosting Env" */ '@/components/projects/env/host/editExternalConfig.vue'),
                meta: {
                  requiresAuth: true,
                  title: '配置托管环境'
                }
              },
              {
                path: 'detail/:service_name',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/k8s/service/serviceDetail.vue'),
                meta: {
                  requiresAuth: true,
                  title: i18n.t('metaTitle.serviceDetail')
                }
              },
              {
                path: 'detail/:service_name/pm',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/pm/service/pmServiceDetail.vue'),
                meta: {
                  requiresAuth: true,
                  title: i18n.t('metaTitle.serviceDetail')
                }
              },
              {
                path: 'detail/:service_name/config',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/k8s/service/serviceConfig.vue'),
                meta: {
                  requiresAuth: true,
                  title: i18n.t('metaTitle.serviceConfiguration')
                }
              },
              {
                path: 'detail/:env_name/envConfig',
                component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/envConfig/home.vue'),
                meta: {
                  requiresAuth: true,
                  title: i18n.t('metaTitle.serviceConfiguration')
                }
              }
            ]
          }
        ]
      },
      {
        path: 'template',
        component: () => import(/* webpackChunkName: "Template Library" */ '@/components/templateLibrary/index.vue'),
        meta: {
          title: i18n.t('subTopbarMenu.templates')
        },
        children: [
          {
            path: '',
            redirect: 'k8s-yamls'
          },
          {
            path: 'charts',
            component: () => import(/* webpackChunkName: "Chart Template" */ '@/components/templateLibrary/chart/index.vue'),
            meta: {
              title: i18n.t('metaTitle.chartTemplates')
            }
          }, {
            path: 'dockerfiles',
            component: () => import(/* webpackChunkName: "Dockerfile Template" */ '@/components/templateLibrary/dockerfile/index.vue'),
            meta: {
              title: 'Dockerfile 模板库'
            }
          },
          {
            path: 'k8s-yamls',
            component: () => import(/* webpackChunkName: "K8s Template" */ '@/components/templateLibrary/k8s/index.vue'),
            meta: {
              title: i18n.t('metaTitle.k8sTemplates')
            }
          },
          {
            path: 'builds',
            component: () => import(/* webpackChunkName: "Build Template" */ '@/components/templateLibrary/builds/index.vue'),
            meta: {
              title: i18n.t('metaTitle.buildTemplates')
            }
          }
        ]
      },
      {
        path: 'delivery',
        component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/home.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.deliveryCenter')
        },
        children: [
          {
            path: '',
            redirect: 'artifacts'
          },
          {
            path: 'artifacts',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/artifacts/index.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: i18n.t('deliveryCenter.artifactsTracking')
            }
          },
          {
            path: 'artifacts/detail/:id',
            component: () => import(/* webpackChunkName: "Project Delivery" */ '@/components/delivery/artifacts/detail.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: false,
              title: i18n.t('deliveryCenter.artifactsTracking')
            }
          }
        ]
      },
      {
        path: 'projects/create',
        component: () => import(/* webpackChunkName: "Project" */ '@/components/projects/detail/create.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/k8s/info',
        component: () => import(/* webpackChunkName: "Onboarding K8s" */ '@/components/projects/guide/k8s/basicInfo.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/k8s/service',
        component: () => import(/* webpackChunkName: "Onboarding K8s" */ '@/components/projects/guide/k8s/service.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/k8s/runtime',
        component: () => import(/* webpackChunkName: "Onboarding K8s" */ '@/components/projects/guide/k8s/runtime.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/k8s/delivery',
        component: () => import(/* webpackChunkName: "Onboarding K8s" */ '@/components/projects/guide/k8s/delivery.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/host/config',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/host/hostConfig.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/helm/info',
        component: () => import(/* webpackChunkName: "Onboarding Helm" */ '@/components/projects/guide/helm/basicInfo.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/helm/service',
        component: () => import(/* webpackChunkName: "Onboarding Helm" */ '@/components/projects/guide/helm/service.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/helm/runtime',
        component: () => import(/* webpackChunkName: "Onboarding Helm" */ '@/components/projects/guide/helm/runtime.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/helm/delivery',
        component: () => import(/* webpackChunkName: "Onboarding Helm" */ '@/components/projects/guide/helm/delivery.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/pm/info',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/pm/info.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/pm/config',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/pm/config.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/pm/deploy',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/pm/deploy.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/create/:project_name/pm/delivery',
        component: () => import(/* webpackChunkName: "Onboarding Host" */ '@/components/projects/guide/pm/delivery.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createProject')
        }
      },
      {
        path: 'projects/edit/:project_name',
        component: () => import(/* webpackChunkName: "Project" */ '@/components/projects/detail/create.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('project.createProjectComp.editProjectInfo')
        }
      },
      {
        path: 'projects/initialize/:project_name',
        component: () => import(/* webpackChunkName: "Project Init" */ '@/components/projects/detail/initialize.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.projectDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/pipelines',
        component: () => import(/* webpackChunkName: "Project Workflow" */ '@/components/projects/workflow/list.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.workflows')
        }
      },
      {
        path: 'projects/detail/:project_name/services',
        component: () => import(/* webpackChunkName: "Project Service" */ '@/components/projects/serviceMgr/service.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.services')
        }
      },
      {
        path: 'projects/detail/:project_name/envs',
        component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/home.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.environments')
        },
        children: [
          {
            path: 'create',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/createEnv.vue'),
            meta: {
              requiresAuth: true,
              createEnv: true,
              title: i18n.t('subTopbarMenu.createEnvironment')
            }
          },
          {
            path: 'detail',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/envDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('subTopbarMenu.environments')
            }
          },
          {
            path: 'externalConfig',
            component: () => import(/* webpackChunkName: "Project External Env" */ '@/components/projects/env/host/editExternalConfig.vue'),
            meta: {
              requiresAuth: true,
              title: '配置托管环境'
            }
          },
          {
            path: 'detail/:service_name',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/k8s/service/serviceDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.serviceDetail')
            }
          },
          {
            path: 'detail/:service_name/pm',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/pm/service/pmServiceDetail.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.serviceDetail')
            }
          },
          {
            path: 'detail/:service_name/config',
            component: () => import(/* webpackChunkName: "Project Env" */ '@/components/projects/env/k8s/service/serviceConfig.vue'),
            meta: {
              requiresAuth: true,
              title: i18n.t('metaTitle.serviceConfiguration')
            }
          }
        ]
      },
      {
        path: 'projects/detail/:project_name/rbac',
        component: () => import(/* webpackChunkName: "Project RBAC" */ '@/components/projects/rbac/home.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.projectPermission')
        }
      },
      {
        path: 'projects/detail/:project_name/policy',
        component: () => import(/* webpackChunkName: "Project Policy" */ '@/components/projects/policy/home.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.projectCollaborationMode')
        }
      },
      {
        path: 'projects/detail/:project_name/group',
        component: () => import(/* webpackChunkName: "Environment Group" */ '@/components/projects/group/index.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.varsGroup')
        }
      },
      {
        path: 'projects/detail/:project_name/group/create',
        component: () => import(/* webpackChunkName: "Environment Group" */ '@/components/projects/group/create.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.varsGroup')
        }
      },
      {
        path: 'projects/detail/:project_name/host',
        component: () => import(/* webpackChunkName: "Project Host Management" */ '@/components/projects/host/home.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('subTopbarMenu.hostManagement')
        }
      }
    ]
  },
  {
    path: '/v1/tests',
    component: onboarding_home,
    meta: {
      requiresAuth: true,
      title: i18n.t('sidebarMenu.testCenter')
    },
    children: [
      {
        path: '',
        component: () => import(/* webpackChunkName: "Quality Manage" */ '@/components/projects/test/common/function/function.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.testCenter')
        }
      }
    ]
  },
  {
    path: '/workflows',
    component: () => import(/* webpackChunkName: "Workflow Editor" */ '@/components/projects/workflow/workflowEditor/view.vue'),
    meta: {
      requiresAuth: true,
      title: i18n.t('metaTitle.editWorkflow')
    },
    children: [
      {
        path: 'product/create',
        component: () => import(/* webpackChunkName: "Workflow Editor" */ '@/components/projects/workflow/workflowEditor/productWorkflow/workflow.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.createWorkflow')
        }
      },
      {
        path: 'product/edit/:name',
        component: () => import(/* webpackChunkName: "Workflow Editor" */ '@/components/projects/workflow/workflowEditor/productWorkflow/workflow.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.editWorkflow')
        }
      }
    ]
  },
  {
    path: '/v1/profile',
    component: onboarding_home,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: 'info'
      },
      {
        path: 'info',
        component: () => import(/* webpackChunkName: "User Setting" */ '@/components/profile/info.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.profile')
        }
      },
      {
        path: 'preference',
        component: () => import(/* webpackChunkName: "User Setting" */ '@/components/profile/preference.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.preference')
        }
      }
    ]
  },
  {
    path: '/v1/system',
    component: onboarding_home,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.settings')
        }
      },
      {
        path: 'apps',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/apps/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.packages')
        }
      },
      {
        path: 'imgs',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/imgs/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.images')
        }
      },
      {
        path: 'plugins',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/plugins/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.plugins')
        }
      },
      {
        path: 'integration',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.systemIntegration')
        }
      },
      {
        path: 'integration/account',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/account.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.accountTab')
        }
      }, {
        path: 'integration/project',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/project.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.projectTab')
        }
      }, {
        path: 'integration/git',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/git.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.gitProviderTab')
        }
      }, {
        path: 'integration/ci',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/ci.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.ciTab')
        }
      }, {
        path: 'integration/scanner',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/scanner.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.scannerTab')
        }
      },
      {
        path: 'integration/registry',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/registry.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.registryTab')
        }
      },
      {
        path: 'integration/storage',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/storage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.storageTab')
        }
      },
      {
        path: 'integration/helmChartRepo',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/helmChartRepo.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.helmChartRepoTab')
        }
      },
      {
        path: 'integration/cluster',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/cluster.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.clusterTab')
        }
      },
      {
        path: 'integration/host',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/host.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.hostTab')
        }
      }, {
        path: 'integration/external',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/integration/external.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sysSetting.integration.externalSystemTab')
        }
      },
      {
        path: 'config',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/config/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.settings')
        },
        children: [
          {
            path: 'manage/quota',
            component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/config/quota.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '系统配额'
            }
          },
          {
            path: 'manage/proxy',
            component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/config/proxy.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '代理配置'
            }
          },
          {
            path: 'manage/cache',
            component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/config/cache.vue'),
            meta: {
              requiresAuth: true,
              requiresSuperAdmin: true,
              title: '缓存清理'
            }
          }
        ]
      },
      {
        path: 'users',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/users/home.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.users')
        }
      },
      {
        path: 'announcement',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/announcement/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.announcement')
        }
      },
      {
        path: 'auditlog',
        component: () => import(/* webpackChunkName: "Setting" */ '@/components/setting/auditlog/manage.vue'),
        meta: {
          requiresAuth: true,
          requiresSuperAdmin: true,
          title: i18n.t('sidebarMenu.auditLog')
        }
      }
    ]
  },
  {
    path: '/mobile',
    component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/index.vue'),
    meta: {
      title: 'Zadig'
    },
    children: [

      {
        path: 'status',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/workflow/status.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.status')
        }
      },
      {
        path: 'profile',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/profile.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.profile')
        }
      },
      {
        path: 'projects',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/projects.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('sidebarMenu.projects')
        }
      },
      {
        path: 'projects/detail/:project_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/detail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.projectDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/workflows/multi/:workflow_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/workflow/product/detail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.workflowDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/workflows/multi/:workflow_name/:task_id',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/workflow/product/taskDetail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.taskDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/tests/:test_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/test/detail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.testDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/tests/:test_name/:task_id',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/test/taskDetail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.testTaskDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/envs/:env_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/env/envDetail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.envDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/envs/:env_name/k8s/:service_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/env/k8sServiceDetail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.serviceDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/envs/:env_name/helm/:service_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/env/helmServiceDetail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.serviceDetail')
        }
      },
      {
        path: 'projects/detail/:project_name/envs/:env_name/pm/:service_name',
        component: () => import(/* webpackChunkName: "Mobile" */ '@/mobile/project/env/pmServiceDetail.vue'),
        meta: {
          requiresAuth: true,
          title: i18n.t('metaTitle.serviceDetail')
        }
      }
    ]
  },
  {
    path: '/signin',
    component: () => import('@/components/entry/login.vue'),
    meta: {
      title: i18n.t('login.signIn')
    }
  },
  {
    path: '/v1/installation',
    component: () => import('@/components/entry/installation.vue'),
    meta: {
      title: i18n.t('installation.signup')
    }
  },
  {
    path: '/404',
    component: () => import('@/components/entry/404.vue'),
    meta: {
      title: '404 Not Found'
    }
  },
  {
    path: '/',
    component: () => import('@/components/entry/login.vue'),
    meta: {
      title: i18n.t('login.signIn')
    }
  },
  {
    path: '/login/password',
    component: () => import('@/components/entry/passwordLogin.vue'),
    meta: {
      title: i18n.t('login.signIn')
    }
  },
  {
    path: '*',
    component: () => import('@/components/entry/404.vue'),
    meta: {
      title: '404 Not Found'
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: __dirname,
  routes: routes
})

router.onError((error) => {
  console.log(error, router)
  const pattern = /Loading chunk (\d)+ failed/g
  const isChunkLoadFailed = error.message.match(pattern)
  if (isChunkLoadFailed) {
    window.location.replace(window.location.href)
  }
})

export default router
