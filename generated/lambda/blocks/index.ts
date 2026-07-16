import addLayerVersionPermission from "./addLayerVersionPermission";
import addPermission from "./addPermission";
import checkpointDurableExecution from "./checkpointDurableExecution";
import createAlias from "./createAlias";
import createCapacityProvider from "./createCapacityProvider";
import createCodeSigningConfig from "./createCodeSigningConfig";
import createEventSourceMapping from "./createEventSourceMapping";
import createFunction from "./createFunction";
import createFunctionUrlConfig from "./createFunctionUrlConfig";
import deleteAlias from "./deleteAlias";
import deleteCapacityProvider from "./deleteCapacityProvider";
import deleteCodeSigningConfig from "./deleteCodeSigningConfig";
import deleteEventSourceMapping from "./deleteEventSourceMapping";
import deleteFunction from "./deleteFunction";
import deleteFunctionCodeSigningConfig from "./deleteFunctionCodeSigningConfig";
import deleteFunctionConcurrency from "./deleteFunctionConcurrency";
import deleteFunctionEventInvokeConfig from "./deleteFunctionEventInvokeConfig";
import deleteFunctionUrlConfig from "./deleteFunctionUrlConfig";
import deleteLayerVersion from "./deleteLayerVersion";
import deleteProvisionedConcurrencyConfig from "./deleteProvisionedConcurrencyConfig";
import getAccountSettings from "./getAccountSettings";
import getAlias from "./getAlias";
import getCapacityProvider from "./getCapacityProvider";
import getCodeSigningConfig from "./getCodeSigningConfig";
import getDurableExecution from "./getDurableExecution";
import getDurableExecutionHistory from "./getDurableExecutionHistory";
import getDurableExecutionState from "./getDurableExecutionState";
import getEventSourceMapping from "./getEventSourceMapping";
import getFunction from "./getFunction";
import getFunctionCodeSigningConfig from "./getFunctionCodeSigningConfig";
import getFunctionConcurrency from "./getFunctionConcurrency";
import getFunctionConfiguration from "./getFunctionConfiguration";
import getFunctionEventInvokeConfig from "./getFunctionEventInvokeConfig";
import getFunctionRecursionConfig from "./getFunctionRecursionConfig";
import getFunctionScalingConfig from "./getFunctionScalingConfig";
import getFunctionUrlConfig from "./getFunctionUrlConfig";
import getLayerVersion from "./getLayerVersion";
import getLayerVersionByArn from "./getLayerVersionByArn";
import getLayerVersionPolicy from "./getLayerVersionPolicy";
import getPolicy from "./getPolicy";
import getProvisionedConcurrencyConfig from "./getProvisionedConcurrencyConfig";
import getRuntimeManagementConfig from "./getRuntimeManagementConfig";
import invoke from "./invoke";
import invokeAsync from "./invokeAsync";
import invokeWithResponseStream from "./invokeWithResponseStream";
import listAliases from "./listAliases";
import listCapacityProviders from "./listCapacityProviders";
import listCodeSigningConfigs from "./listCodeSigningConfigs";
import listDurableExecutionsByFunction from "./listDurableExecutionsByFunction";
import listEventSourceMappings from "./listEventSourceMappings";
import listFunctionEventInvokeConfigs from "./listFunctionEventInvokeConfigs";
import listFunctionUrlConfigs from "./listFunctionUrlConfigs";
import listFunctionVersionsByCapacityProvider from "./listFunctionVersionsByCapacityProvider";
import listFunctions from "./listFunctions";
import listFunctionsByCodeSigningConfig from "./listFunctionsByCodeSigningConfig";
import listLayerVersions from "./listLayerVersions";
import listLayers from "./listLayers";
import listProvisionedConcurrencyConfigs from "./listProvisionedConcurrencyConfigs";
import listTags from "./listTags";
import listVersionsByFunction from "./listVersionsByFunction";
import publishLayerVersion from "./publishLayerVersion";
import publishVersion from "./publishVersion";
import putFunctionCodeSigningConfig from "./putFunctionCodeSigningConfig";
import putFunctionConcurrency from "./putFunctionConcurrency";
import putFunctionEventInvokeConfig from "./putFunctionEventInvokeConfig";
import putFunctionRecursionConfig from "./putFunctionRecursionConfig";
import putFunctionScalingConfig from "./putFunctionScalingConfig";
import putProvisionedConcurrencyConfig from "./putProvisionedConcurrencyConfig";
import putRuntimeManagementConfig from "./putRuntimeManagementConfig";
import removeLayerVersionPermission from "./removeLayerVersionPermission";
import removePermission from "./removePermission";
import sendDurableExecutionCallbackFailure from "./sendDurableExecutionCallbackFailure";
import sendDurableExecutionCallbackHeartbeat from "./sendDurableExecutionCallbackHeartbeat";
import sendDurableExecutionCallbackSuccess from "./sendDurableExecutionCallbackSuccess";
import stopDurableExecution from "./stopDurableExecution";
import tagResource from "./tagResource";
import untagResource from "./untagResource";
import updateAlias from "./updateAlias";
import updateCapacityProvider from "./updateCapacityProvider";
import updateCodeSigningConfig from "./updateCodeSigningConfig";
import updateEventSourceMapping from "./updateEventSourceMapping";
import updateFunctionCode from "./updateFunctionCode";
import updateFunctionConfiguration from "./updateFunctionConfiguration";
import updateFunctionEventInvokeConfig from "./updateFunctionEventInvokeConfig";
import updateFunctionUrlConfig from "./updateFunctionUrlConfig";

export const blocks = {
  addLayerVersionPermission,
  addPermission,
  checkpointDurableExecution,
  createAlias,
  createCapacityProvider,
  createCodeSigningConfig,
  createEventSourceMapping,
  createFunction,
  createFunctionUrlConfig,
  deleteAlias,
  deleteCapacityProvider,
  deleteCodeSigningConfig,
  deleteEventSourceMapping,
  deleteFunction,
  deleteFunctionCodeSigningConfig,
  deleteFunctionConcurrency,
  deleteFunctionEventInvokeConfig,
  deleteFunctionUrlConfig,
  deleteLayerVersion,
  deleteProvisionedConcurrencyConfig,
  getAccountSettings,
  getAlias,
  getCapacityProvider,
  getCodeSigningConfig,
  getDurableExecution,
  getDurableExecutionHistory,
  getDurableExecutionState,
  getEventSourceMapping,
  getFunction,
  getFunctionCodeSigningConfig,
  getFunctionConcurrency,
  getFunctionConfiguration,
  getFunctionEventInvokeConfig,
  getFunctionRecursionConfig,
  getFunctionScalingConfig,
  getFunctionUrlConfig,
  getLayerVersion,
  getLayerVersionByArn,
  getLayerVersionPolicy,
  getPolicy,
  getProvisionedConcurrencyConfig,
  getRuntimeManagementConfig,
  invoke,
  invokeAsync,
  invokeWithResponseStream,
  listAliases,
  listCapacityProviders,
  listCodeSigningConfigs,
  listDurableExecutionsByFunction,
  listEventSourceMappings,
  listFunctionEventInvokeConfigs,
  listFunctionUrlConfigs,
  listFunctionVersionsByCapacityProvider,
  listFunctions,
  listFunctionsByCodeSigningConfig,
  listLayerVersions,
  listLayers,
  listProvisionedConcurrencyConfigs,
  listTags,
  listVersionsByFunction,
  publishLayerVersion,
  publishVersion,
  putFunctionCodeSigningConfig,
  putFunctionConcurrency,
  putFunctionEventInvokeConfig,
  putFunctionRecursionConfig,
  putFunctionScalingConfig,
  putProvisionedConcurrencyConfig,
  putRuntimeManagementConfig,
  removeLayerVersionPermission,
  removePermission,
  sendDurableExecutionCallbackFailure,
  sendDurableExecutionCallbackHeartbeat,
  sendDurableExecutionCallbackSuccess,
  stopDurableExecution,
  tagResource,
  untagResource,
  updateAlias,
  updateCapacityProvider,
  updateCodeSigningConfig,
  updateEventSourceMapping,
  updateFunctionCode,
  updateFunctionConfiguration,
  updateFunctionEventInvokeConfig,
  updateFunctionUrlConfig,
};
