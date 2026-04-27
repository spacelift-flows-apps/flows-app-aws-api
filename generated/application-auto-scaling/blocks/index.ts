import deleteScalingPolicy from "./deleteScalingPolicy";
import deleteScheduledAction from "./deleteScheduledAction";
import deregisterScalableTarget from "./deregisterScalableTarget";
import describeScalableTargets from "./describeScalableTargets";
import describeScalingActivities from "./describeScalingActivities";
import describeScalingPolicies from "./describeScalingPolicies";
import describeScheduledActions from "./describeScheduledActions";
import getPredictiveScalingForecast from "./getPredictiveScalingForecast";
import listTagsForResource from "./listTagsForResource";
import putScalingPolicy from "./putScalingPolicy";
import putScheduledAction from "./putScheduledAction";
import registerScalableTarget from "./registerScalableTarget";
import tagResource from "./tagResource";
import untagResource from "./untagResource";

export const blocks = {
  deleteScalingPolicy,
  deleteScheduledAction,
  deregisterScalableTarget,
  describeScalableTargets,
  describeScalingActivities,
  describeScalingPolicies,
  describeScheduledActions,
  getPredictiveScalingForecast,
  listTagsForResource,
  putScalingPolicy,
  putScheduledAction,
  registerScalableTarget,
  tagResource,
  untagResource,
};
