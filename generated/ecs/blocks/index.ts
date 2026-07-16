import createCapacityProvider from "./createCapacityProvider";
import createCluster from "./createCluster";
import createDaemon from "./createDaemon";
import createExpressGatewayService from "./createExpressGatewayService";
import createService from "./createService";
import createTaskSet from "./createTaskSet";
import deleteAccountSetting from "./deleteAccountSetting";
import deleteAttributes from "./deleteAttributes";
import deleteCapacityProvider from "./deleteCapacityProvider";
import deleteCluster from "./deleteCluster";
import deleteDaemon from "./deleteDaemon";
import deleteDaemonTaskDefinition from "./deleteDaemonTaskDefinition";
import deleteExpressGatewayService from "./deleteExpressGatewayService";
import deleteService from "./deleteService";
import deleteTaskDefinitions from "./deleteTaskDefinitions";
import deleteTaskSet from "./deleteTaskSet";
import deregisterContainerInstance from "./deregisterContainerInstance";
import deregisterTaskDefinition from "./deregisterTaskDefinition";
import describeCapacityProviders from "./describeCapacityProviders";
import describeClusters from "./describeClusters";
import describeContainerInstances from "./describeContainerInstances";
import describeDaemon from "./describeDaemon";
import describeDaemonDeployments from "./describeDaemonDeployments";
import describeDaemonRevisions from "./describeDaemonRevisions";
import describeDaemonTaskDefinition from "./describeDaemonTaskDefinition";
import describeExpressGatewayService from "./describeExpressGatewayService";
import describeServiceDeployments from "./describeServiceDeployments";
import describeServiceRevisions from "./describeServiceRevisions";
import describeServices from "./describeServices";
import describeTaskDefinition from "./describeTaskDefinition";
import describeTaskSets from "./describeTaskSets";
import describeTasks from "./describeTasks";
import discoverPollEndpoint from "./discoverPollEndpoint";
import executeCommand from "./executeCommand";
import getTaskProtection from "./getTaskProtection";
import listAccountSettings from "./listAccountSettings";
import listAttributes from "./listAttributes";
import listClusters from "./listClusters";
import listContainerInstances from "./listContainerInstances";
import listDaemonDeployments from "./listDaemonDeployments";
import listDaemonTaskDefinitions from "./listDaemonTaskDefinitions";
import listDaemons from "./listDaemons";
import listServiceDeployments from "./listServiceDeployments";
import listServices from "./listServices";
import listServicesByNamespace from "./listServicesByNamespace";
import listTagsForResource from "./listTagsForResource";
import listTaskDefinitionFamilies from "./listTaskDefinitionFamilies";
import listTaskDefinitions from "./listTaskDefinitions";
import listTasks from "./listTasks";
import putAccountSetting from "./putAccountSetting";
import putAccountSettingDefault from "./putAccountSettingDefault";
import putAttributes from "./putAttributes";
import putClusterCapacityProviders from "./putClusterCapacityProviders";
import registerContainerInstance from "./registerContainerInstance";
import registerDaemonTaskDefinition from "./registerDaemonTaskDefinition";
import registerTaskDefinition from "./registerTaskDefinition";
import runTask from "./runTask";
import startTask from "./startTask";
import stopServiceDeployment from "./stopServiceDeployment";
import stopTask from "./stopTask";
import submitAttachmentStateChanges from "./submitAttachmentStateChanges";
import submitContainerStateChange from "./submitContainerStateChange";
import submitTaskStateChange from "./submitTaskStateChange";
import tagResource from "./tagResource";
import untagResource from "./untagResource";
import updateCapacityProvider from "./updateCapacityProvider";
import updateCluster from "./updateCluster";
import updateClusterSettings from "./updateClusterSettings";
import updateContainerAgent from "./updateContainerAgent";
import updateContainerInstancesState from "./updateContainerInstancesState";
import updateDaemon from "./updateDaemon";
import updateExpressGatewayService from "./updateExpressGatewayService";
import updateService from "./updateService";
import updateServicePrimaryTaskSet from "./updateServicePrimaryTaskSet";
import updateTaskProtection from "./updateTaskProtection";
import updateTaskSet from "./updateTaskSet";

export const blocks = {
  createCapacityProvider,
  createCluster,
  createDaemon,
  createExpressGatewayService,
  createService,
  createTaskSet,
  deleteAccountSetting,
  deleteAttributes,
  deleteCapacityProvider,
  deleteCluster,
  deleteDaemon,
  deleteDaemonTaskDefinition,
  deleteExpressGatewayService,
  deleteService,
  deleteTaskDefinitions,
  deleteTaskSet,
  deregisterContainerInstance,
  deregisterTaskDefinition,
  describeCapacityProviders,
  describeClusters,
  describeContainerInstances,
  describeDaemon,
  describeDaemonDeployments,
  describeDaemonRevisions,
  describeDaemonTaskDefinition,
  describeExpressGatewayService,
  describeServiceDeployments,
  describeServiceRevisions,
  describeServices,
  describeTaskDefinition,
  describeTaskSets,
  describeTasks,
  discoverPollEndpoint,
  executeCommand,
  getTaskProtection,
  listAccountSettings,
  listAttributes,
  listClusters,
  listContainerInstances,
  listDaemonDeployments,
  listDaemonTaskDefinitions,
  listDaemons,
  listServiceDeployments,
  listServices,
  listServicesByNamespace,
  listTagsForResource,
  listTaskDefinitionFamilies,
  listTaskDefinitions,
  listTasks,
  putAccountSetting,
  putAccountSettingDefault,
  putAttributes,
  putClusterCapacityProviders,
  registerContainerInstance,
  registerDaemonTaskDefinition,
  registerTaskDefinition,
  runTask,
  startTask,
  stopServiceDeployment,
  stopTask,
  submitAttachmentStateChanges,
  submitContainerStateChange,
  submitTaskStateChange,
  tagResource,
  untagResource,
  updateCapacityProvider,
  updateCluster,
  updateClusterSettings,
  updateContainerAgent,
  updateContainerInstancesState,
  updateDaemon,
  updateExpressGatewayService,
  updateService,
  updateServicePrimaryTaskSet,
  updateTaskProtection,
  updateTaskSet,
};
