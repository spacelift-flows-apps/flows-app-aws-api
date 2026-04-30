import attachInstances from "./attachInstances";
import attachLoadBalancerTargetGroups from "./attachLoadBalancerTargetGroups";
import attachLoadBalancers from "./attachLoadBalancers";
import attachTrafficSources from "./attachTrafficSources";
import batchDeleteScheduledAction from "./batchDeleteScheduledAction";
import batchPutScheduledUpdateGroupAction from "./batchPutScheduledUpdateGroupAction";
import cancelInstanceRefresh from "./cancelInstanceRefresh";
import completeLifecycleAction from "./completeLifecycleAction";
import createAutoScalingGroup from "./createAutoScalingGroup";
import createLaunchConfiguration from "./createLaunchConfiguration";
import createOrUpdateTags from "./createOrUpdateTags";
import deleteAutoScalingGroup from "./deleteAutoScalingGroup";
import deleteLaunchConfiguration from "./deleteLaunchConfiguration";
import deleteLifecycleHook from "./deleteLifecycleHook";
import deleteNotificationConfiguration from "./deleteNotificationConfiguration";
import deletePolicy from "./deletePolicy";
import deleteScheduledAction from "./deleteScheduledAction";
import deleteTags from "./deleteTags";
import deleteWarmPool from "./deleteWarmPool";
import describeAccountLimits from "./describeAccountLimits";
import describeAdjustmentTypes from "./describeAdjustmentTypes";
import describeAutoScalingGroups from "./describeAutoScalingGroups";
import describeAutoScalingInstances from "./describeAutoScalingInstances";
import describeAutoScalingNotificationTypes from "./describeAutoScalingNotificationTypes";
import describeInstanceRefreshes from "./describeInstanceRefreshes";
import describeLaunchConfigurations from "./describeLaunchConfigurations";
import describeLifecycleHookTypes from "./describeLifecycleHookTypes";
import describeLifecycleHooks from "./describeLifecycleHooks";
import describeLoadBalancerTargetGroups from "./describeLoadBalancerTargetGroups";
import describeLoadBalancers from "./describeLoadBalancers";
import describeMetricCollectionTypes from "./describeMetricCollectionTypes";
import describeNotificationConfigurations from "./describeNotificationConfigurations";
import describePolicies from "./describePolicies";
import describeScalingActivities from "./describeScalingActivities";
import describeScalingProcessTypes from "./describeScalingProcessTypes";
import describeScheduledActions from "./describeScheduledActions";
import describeTags from "./describeTags";
import describeTerminationPolicyTypes from "./describeTerminationPolicyTypes";
import describeTrafficSources from "./describeTrafficSources";
import describeWarmPool from "./describeWarmPool";
import detachInstances from "./detachInstances";
import detachLoadBalancerTargetGroups from "./detachLoadBalancerTargetGroups";
import detachLoadBalancers from "./detachLoadBalancers";
import detachTrafficSources from "./detachTrafficSources";
import disableMetricsCollection from "./disableMetricsCollection";
import enableMetricsCollection from "./enableMetricsCollection";
import enterStandby from "./enterStandby";
import executePolicy from "./executePolicy";
import exitStandby from "./exitStandby";
import getPredictiveScalingForecast from "./getPredictiveScalingForecast";
import launchInstances from "./launchInstances";
import putLifecycleHook from "./putLifecycleHook";
import putNotificationConfiguration from "./putNotificationConfiguration";
import putScalingPolicy from "./putScalingPolicy";
import putScheduledUpdateGroupAction from "./putScheduledUpdateGroupAction";
import putWarmPool from "./putWarmPool";
import recordLifecycleActionHeartbeat from "./recordLifecycleActionHeartbeat";
import resumeProcesses from "./resumeProcesses";
import rollbackInstanceRefresh from "./rollbackInstanceRefresh";
import setDesiredCapacity from "./setDesiredCapacity";
import setInstanceHealth from "./setInstanceHealth";
import setInstanceProtection from "./setInstanceProtection";
import startInstanceRefresh from "./startInstanceRefresh";
import suspendProcesses from "./suspendProcesses";
import terminateInstanceInAutoScalingGroup from "./terminateInstanceInAutoScalingGroup";
import updateAutoScalingGroup from "./updateAutoScalingGroup";

export const blocks = {
  attachInstances,
  attachLoadBalancerTargetGroups,
  attachLoadBalancers,
  attachTrafficSources,
  batchDeleteScheduledAction,
  batchPutScheduledUpdateGroupAction,
  cancelInstanceRefresh,
  completeLifecycleAction,
  createAutoScalingGroup,
  createLaunchConfiguration,
  createOrUpdateTags,
  deleteAutoScalingGroup,
  deleteLaunchConfiguration,
  deleteLifecycleHook,
  deleteNotificationConfiguration,
  deletePolicy,
  deleteScheduledAction,
  deleteTags,
  deleteWarmPool,
  describeAccountLimits,
  describeAdjustmentTypes,
  describeAutoScalingGroups,
  describeAutoScalingInstances,
  describeAutoScalingNotificationTypes,
  describeInstanceRefreshes,
  describeLaunchConfigurations,
  describeLifecycleHookTypes,
  describeLifecycleHooks,
  describeLoadBalancerTargetGroups,
  describeLoadBalancers,
  describeMetricCollectionTypes,
  describeNotificationConfigurations,
  describePolicies,
  describeScalingActivities,
  describeScalingProcessTypes,
  describeScheduledActions,
  describeTags,
  describeTerminationPolicyTypes,
  describeTrafficSources,
  describeWarmPool,
  detachInstances,
  detachLoadBalancerTargetGroups,
  detachLoadBalancers,
  detachTrafficSources,
  disableMetricsCollection,
  enableMetricsCollection,
  enterStandby,
  executePolicy,
  exitStandby,
  getPredictiveScalingForecast,
  launchInstances,
  putLifecycleHook,
  putNotificationConfiguration,
  putScalingPolicy,
  putScheduledUpdateGroupAction,
  putWarmPool,
  recordLifecycleActionHeartbeat,
  resumeProcesses,
  rollbackInstanceRefresh,
  setDesiredCapacity,
  setInstanceHealth,
  setInstanceProtection,
  startInstanceRefresh,
  suspendProcesses,
  terminateInstanceInAutoScalingGroup,
  updateAutoScalingGroup,
};
