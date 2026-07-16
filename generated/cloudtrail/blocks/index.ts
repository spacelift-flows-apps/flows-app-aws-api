import addTags from "./addTags";
import cancelQuery from "./cancelQuery";
import createChannel from "./createChannel";
import createDashboard from "./createDashboard";
import createEventDataStore from "./createEventDataStore";
import createTrail from "./createTrail";
import deleteChannel from "./deleteChannel";
import deleteDashboard from "./deleteDashboard";
import deleteEventDataStore from "./deleteEventDataStore";
import deleteResourcePolicy from "./deleteResourcePolicy";
import deleteTrail from "./deleteTrail";
import deregisterOrganizationDelegatedAdmin from "./deregisterOrganizationDelegatedAdmin";
import describeQuery from "./describeQuery";
import describeTrails from "./describeTrails";
import disableFederation from "./disableFederation";
import enableFederation from "./enableFederation";
import generateQuery from "./generateQuery";
import getChannel from "./getChannel";
import getDashboard from "./getDashboard";
import getEventConfiguration from "./getEventConfiguration";
import getEventDataStore from "./getEventDataStore";
import getEventSelectors from "./getEventSelectors";
import getImport from "./getImport";
import getInsightSelectors from "./getInsightSelectors";
import getQueryResults from "./getQueryResults";
import getResourcePolicy from "./getResourcePolicy";
import getTrail from "./getTrail";
import getTrailStatus from "./getTrailStatus";
import listChannels from "./listChannels";
import listDashboards from "./listDashboards";
import listEventDataStores from "./listEventDataStores";
import listImportFailures from "./listImportFailures";
import listImports from "./listImports";
import listInsightsData from "./listInsightsData";
import listInsightsMetricData from "./listInsightsMetricData";
import listPublicKeys from "./listPublicKeys";
import listQueries from "./listQueries";
import listTags from "./listTags";
import listTrails from "./listTrails";
import lookupEvents from "./lookupEvents";
import putEventConfiguration from "./putEventConfiguration";
import putEventSelectors from "./putEventSelectors";
import putInsightSelectors from "./putInsightSelectors";
import putResourcePolicy from "./putResourcePolicy";
import registerOrganizationDelegatedAdmin from "./registerOrganizationDelegatedAdmin";
import removeTags from "./removeTags";
import restoreEventDataStore from "./restoreEventDataStore";
import searchSampleQueries from "./searchSampleQueries";
import startDashboardRefresh from "./startDashboardRefresh";
import startEventDataStoreIngestion from "./startEventDataStoreIngestion";
import startImport from "./startImport";
import startLogging from "./startLogging";
import startQuery from "./startQuery";
import stopEventDataStoreIngestion from "./stopEventDataStoreIngestion";
import stopImport from "./stopImport";
import stopLogging from "./stopLogging";
import updateChannel from "./updateChannel";
import updateDashboard from "./updateDashboard";
import updateEventDataStore from "./updateEventDataStore";
import updateTrail from "./updateTrail";

export const blocks = {
  addTags,
  cancelQuery,
  createChannel,
  createDashboard,
  createEventDataStore,
  createTrail,
  deleteChannel,
  deleteDashboard,
  deleteEventDataStore,
  deleteResourcePolicy,
  deleteTrail,
  deregisterOrganizationDelegatedAdmin,
  describeQuery,
  describeTrails,
  disableFederation,
  enableFederation,
  generateQuery,
  getChannel,
  getDashboard,
  getEventConfiguration,
  getEventDataStore,
  getEventSelectors,
  getImport,
  getInsightSelectors,
  getQueryResults,
  getResourcePolicy,
  getTrail,
  getTrailStatus,
  listChannels,
  listDashboards,
  listEventDataStores,
  listImportFailures,
  listImports,
  listInsightsData,
  listInsightsMetricData,
  listPublicKeys,
  listQueries,
  listTags,
  listTrails,
  lookupEvents,
  putEventConfiguration,
  putEventSelectors,
  putInsightSelectors,
  putResourcePolicy,
  registerOrganizationDelegatedAdmin,
  removeTags,
  restoreEventDataStore,
  searchSampleQueries,
  startDashboardRefresh,
  startEventDataStoreIngestion,
  startImport,
  startLogging,
  startQuery,
  stopEventDataStoreIngestion,
  stopImport,
  stopLogging,
  updateChannel,
  updateDashboard,
  updateEventDataStore,
  updateTrail,
};
