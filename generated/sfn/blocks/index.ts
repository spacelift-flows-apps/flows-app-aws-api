import createActivity from "./createActivity";
import createStateMachine from "./createStateMachine";
import createStateMachineAlias from "./createStateMachineAlias";
import deleteActivity from "./deleteActivity";
import deleteStateMachine from "./deleteStateMachine";
import deleteStateMachineAlias from "./deleteStateMachineAlias";
import deleteStateMachineVersion from "./deleteStateMachineVersion";
import describeActivity from "./describeActivity";
import describeExecution from "./describeExecution";
import describeMapRun from "./describeMapRun";
import describeStateMachine from "./describeStateMachine";
import describeStateMachineAlias from "./describeStateMachineAlias";
import describeStateMachineForExecution from "./describeStateMachineForExecution";
import getActivityTask from "./getActivityTask";
import getExecutionHistory from "./getExecutionHistory";
import listActivities from "./listActivities";
import listExecutions from "./listExecutions";
import listMapRuns from "./listMapRuns";
import listStateMachineAliases from "./listStateMachineAliases";
import listStateMachineVersions from "./listStateMachineVersions";
import listStateMachines from "./listStateMachines";
import listTagsForResource from "./listTagsForResource";
import publishStateMachineVersion from "./publishStateMachineVersion";
import redriveExecution from "./redriveExecution";
import sendTaskFailure from "./sendTaskFailure";
import sendTaskHeartbeat from "./sendTaskHeartbeat";
import sendTaskSuccess from "./sendTaskSuccess";
import startExecution from "./startExecution";
import startSyncExecution from "./startSyncExecution";
import stopExecution from "./stopExecution";
import tagResource from "./tagResource";
import testState from "./testState";
import untagResource from "./untagResource";
import updateMapRun from "./updateMapRun";
import updateStateMachine from "./updateStateMachine";
import updateStateMachineAlias from "./updateStateMachineAlias";
import validateStateMachineDefinition from "./validateStateMachineDefinition";

export const blocks = {
  createActivity,
  createStateMachine,
  createStateMachineAlias,
  deleteActivity,
  deleteStateMachine,
  deleteStateMachineAlias,
  deleteStateMachineVersion,
  describeActivity,
  describeExecution,
  describeMapRun,
  describeStateMachine,
  describeStateMachineAlias,
  describeStateMachineForExecution,
  getActivityTask,
  getExecutionHistory,
  listActivities,
  listExecutions,
  listMapRuns,
  listStateMachineAliases,
  listStateMachineVersions,
  listStateMachines,
  listTagsForResource,
  publishStateMachineVersion,
  redriveExecution,
  sendTaskFailure,
  sendTaskHeartbeat,
  sendTaskSuccess,
  startExecution,
  startSyncExecution,
  stopExecution,
  tagResource,
  testState,
  untagResource,
  updateMapRun,
  updateStateMachine,
  updateStateMachineAlias,
  validateStateMachineDefinition,
};
