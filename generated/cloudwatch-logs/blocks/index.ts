import associateKmsKey from "./associateKmsKey";
import associateSourceToS3TableIntegration from "./associateSourceToS3TableIntegration";
import cancelExportTask from "./cancelExportTask";
import cancelImportTask from "./cancelImportTask";
import createDelivery from "./createDelivery";
import createExportTask from "./createExportTask";
import createImportTask from "./createImportTask";
import createLogAnomalyDetector from "./createLogAnomalyDetector";
import createLogGroup from "./createLogGroup";
import createLogStream from "./createLogStream";
import createLookupTable from "./createLookupTable";
import createScheduledQuery from "./createScheduledQuery";
import deleteAccountPolicy from "./deleteAccountPolicy";
import deleteDataProtectionPolicy from "./deleteDataProtectionPolicy";
import deleteDelivery from "./deleteDelivery";
import deleteDeliveryDestination from "./deleteDeliveryDestination";
import deleteDeliveryDestinationPolicy from "./deleteDeliveryDestinationPolicy";
import deleteDeliverySource from "./deleteDeliverySource";
import deleteDestination from "./deleteDestination";
import deleteIndexPolicy from "./deleteIndexPolicy";
import deleteIntegration from "./deleteIntegration";
import deleteLogAnomalyDetector from "./deleteLogAnomalyDetector";
import deleteLogGroup from "./deleteLogGroup";
import deleteLogStream from "./deleteLogStream";
import deleteLookupTable from "./deleteLookupTable";
import deleteMetricFilter from "./deleteMetricFilter";
import deleteQueryDefinition from "./deleteQueryDefinition";
import deleteResourcePolicy from "./deleteResourcePolicy";
import deleteRetentionPolicy from "./deleteRetentionPolicy";
import deleteScheduledQuery from "./deleteScheduledQuery";
import deleteSubscriptionFilter from "./deleteSubscriptionFilter";
import deleteTransformer from "./deleteTransformer";
import describeAccountPolicies from "./describeAccountPolicies";
import describeConfigurationTemplates from "./describeConfigurationTemplates";
import describeDeliveries from "./describeDeliveries";
import describeDeliveryDestinations from "./describeDeliveryDestinations";
import describeDeliverySources from "./describeDeliverySources";
import describeDestinations from "./describeDestinations";
import describeExportTasks from "./describeExportTasks";
import describeFieldIndexes from "./describeFieldIndexes";
import describeImportTaskBatches from "./describeImportTaskBatches";
import describeImportTasks from "./describeImportTasks";
import describeIndexPolicies from "./describeIndexPolicies";
import describeLogGroups from "./describeLogGroups";
import describeLogStreams from "./describeLogStreams";
import describeLookupTables from "./describeLookupTables";
import describeMetricFilters from "./describeMetricFilters";
import describeQueries from "./describeQueries";
import describeQueryDefinitions from "./describeQueryDefinitions";
import describeResourcePolicies from "./describeResourcePolicies";
import describeSubscriptionFilters from "./describeSubscriptionFilters";
import disassociateKmsKey from "./disassociateKmsKey";
import disassociateSourceFromS3TableIntegration from "./disassociateSourceFromS3TableIntegration";
import filterLogEvents from "./filterLogEvents";
import getDataProtectionPolicy from "./getDataProtectionPolicy";
import getDelivery from "./getDelivery";
import getDeliveryDestination from "./getDeliveryDestination";
import getDeliveryDestinationPolicy from "./getDeliveryDestinationPolicy";
import getDeliverySource from "./getDeliverySource";
import getIntegration from "./getIntegration";
import getLogAnomalyDetector from "./getLogAnomalyDetector";
import getLogEvents from "./getLogEvents";
import getLogFields from "./getLogFields";
import getLogGroupFields from "./getLogGroupFields";
import getLogObject from "./getLogObject";
import getLogRecord from "./getLogRecord";
import getLookupTable from "./getLookupTable";
import getQueryResults from "./getQueryResults";
import getScheduledQuery from "./getScheduledQuery";
import getScheduledQueryHistory from "./getScheduledQueryHistory";
import getTransformer from "./getTransformer";
import listAggregateLogGroupSummaries from "./listAggregateLogGroupSummaries";
import listAnomalies from "./listAnomalies";
import listIntegrations from "./listIntegrations";
import listLogAnomalyDetectors from "./listLogAnomalyDetectors";
import listLogGroups from "./listLogGroups";
import listLogGroupsForQuery from "./listLogGroupsForQuery";
import listScheduledQueries from "./listScheduledQueries";
import listSourcesForS3TableIntegration from "./listSourcesForS3TableIntegration";
import listTagsForResource from "./listTagsForResource";
import listTagsLogGroup from "./listTagsLogGroup";
import putAccountPolicy from "./putAccountPolicy";
import putBearerTokenAuthentication from "./putBearerTokenAuthentication";
import putDataProtectionPolicy from "./putDataProtectionPolicy";
import putDeliveryDestination from "./putDeliveryDestination";
import putDeliveryDestinationPolicy from "./putDeliveryDestinationPolicy";
import putDeliverySource from "./putDeliverySource";
import putDestination from "./putDestination";
import putDestinationPolicy from "./putDestinationPolicy";
import putIndexPolicy from "./putIndexPolicy";
import putIntegration from "./putIntegration";
import putLogEvents from "./putLogEvents";
import putLogGroupDeletionProtection from "./putLogGroupDeletionProtection";
import putMetricFilter from "./putMetricFilter";
import putQueryDefinition from "./putQueryDefinition";
import putResourcePolicy from "./putResourcePolicy";
import putRetentionPolicy from "./putRetentionPolicy";
import putSubscriptionFilter from "./putSubscriptionFilter";
import putTransformer from "./putTransformer";
import startLiveTail from "./startLiveTail";
import startQuery from "./startQuery";
import stopQuery from "./stopQuery";
import tagLogGroup from "./tagLogGroup";
import tagResource from "./tagResource";
import testMetricFilter from "./testMetricFilter";
import testTransformer from "./testTransformer";
import untagLogGroup from "./untagLogGroup";
import untagResource from "./untagResource";
import updateAnomaly from "./updateAnomaly";
import updateDeliveryConfiguration from "./updateDeliveryConfiguration";
import updateLogAnomalyDetector from "./updateLogAnomalyDetector";
import updateLookupTable from "./updateLookupTable";
import updateScheduledQuery from "./updateScheduledQuery";

export const blocks = {
  associateKmsKey,
  associateSourceToS3TableIntegration,
  cancelExportTask,
  cancelImportTask,
  createDelivery,
  createExportTask,
  createImportTask,
  createLogAnomalyDetector,
  createLogGroup,
  createLogStream,
  createLookupTable,
  createScheduledQuery,
  deleteAccountPolicy,
  deleteDataProtectionPolicy,
  deleteDelivery,
  deleteDeliveryDestination,
  deleteDeliveryDestinationPolicy,
  deleteDeliverySource,
  deleteDestination,
  deleteIndexPolicy,
  deleteIntegration,
  deleteLogAnomalyDetector,
  deleteLogGroup,
  deleteLogStream,
  deleteLookupTable,
  deleteMetricFilter,
  deleteQueryDefinition,
  deleteResourcePolicy,
  deleteRetentionPolicy,
  deleteScheduledQuery,
  deleteSubscriptionFilter,
  deleteTransformer,
  describeAccountPolicies,
  describeConfigurationTemplates,
  describeDeliveries,
  describeDeliveryDestinations,
  describeDeliverySources,
  describeDestinations,
  describeExportTasks,
  describeFieldIndexes,
  describeImportTaskBatches,
  describeImportTasks,
  describeIndexPolicies,
  describeLogGroups,
  describeLogStreams,
  describeLookupTables,
  describeMetricFilters,
  describeQueries,
  describeQueryDefinitions,
  describeResourcePolicies,
  describeSubscriptionFilters,
  disassociateKmsKey,
  disassociateSourceFromS3TableIntegration,
  filterLogEvents,
  getDataProtectionPolicy,
  getDelivery,
  getDeliveryDestination,
  getDeliveryDestinationPolicy,
  getDeliverySource,
  getIntegration,
  getLogAnomalyDetector,
  getLogEvents,
  getLogFields,
  getLogGroupFields,
  getLogObject,
  getLogRecord,
  getLookupTable,
  getQueryResults,
  getScheduledQuery,
  getScheduledQueryHistory,
  getTransformer,
  listAggregateLogGroupSummaries,
  listAnomalies,
  listIntegrations,
  listLogAnomalyDetectors,
  listLogGroups,
  listLogGroupsForQuery,
  listScheduledQueries,
  listSourcesForS3TableIntegration,
  listTagsForResource,
  listTagsLogGroup,
  putAccountPolicy,
  putBearerTokenAuthentication,
  putDataProtectionPolicy,
  putDeliveryDestination,
  putDeliveryDestinationPolicy,
  putDeliverySource,
  putDestination,
  putDestinationPolicy,
  putIndexPolicy,
  putIntegration,
  putLogEvents,
  putLogGroupDeletionProtection,
  putMetricFilter,
  putQueryDefinition,
  putResourcePolicy,
  putRetentionPolicy,
  putSubscriptionFilter,
  putTransformer,
  startLiveTail,
  startQuery,
  stopQuery,
  tagLogGroup,
  tagResource,
  testMetricFilter,
  testTransformer,
  untagLogGroup,
  untagResource,
  updateAnomaly,
  updateDeliveryConfiguration,
  updateLogAnomalyDetector,
  updateLookupTable,
  updateScheduledQuery,
};
