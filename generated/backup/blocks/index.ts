import associateBackupVaultMpaApprovalTeam from "./associateBackupVaultMpaApprovalTeam";
import cancelLegalHold from "./cancelLegalHold";
import createBackupPlan from "./createBackupPlan";
import createBackupSelection from "./createBackupSelection";
import createBackupVault from "./createBackupVault";
import createFramework from "./createFramework";
import createLegalHold from "./createLegalHold";
import createLogicallyAirGappedBackupVault from "./createLogicallyAirGappedBackupVault";
import createReportPlan from "./createReportPlan";
import createRestoreAccessBackupVault from "./createRestoreAccessBackupVault";
import createRestoreTestingPlan from "./createRestoreTestingPlan";
import createRestoreTestingSelection from "./createRestoreTestingSelection";
import createTieringConfiguration from "./createTieringConfiguration";
import deleteBackupPlan from "./deleteBackupPlan";
import deleteBackupSelection from "./deleteBackupSelection";
import deleteBackupVault from "./deleteBackupVault";
import deleteBackupVaultAccessPolicy from "./deleteBackupVaultAccessPolicy";
import deleteBackupVaultLockConfiguration from "./deleteBackupVaultLockConfiguration";
import deleteBackupVaultNotifications from "./deleteBackupVaultNotifications";
import deleteFramework from "./deleteFramework";
import deleteRecoveryPoint from "./deleteRecoveryPoint";
import deleteReportPlan from "./deleteReportPlan";
import deleteRestoreTestingPlan from "./deleteRestoreTestingPlan";
import deleteRestoreTestingSelection from "./deleteRestoreTestingSelection";
import deleteTieringConfiguration from "./deleteTieringConfiguration";
import describeBackupJob from "./describeBackupJob";
import describeBackupVault from "./describeBackupVault";
import describeCopyJob from "./describeCopyJob";
import describeFramework from "./describeFramework";
import describeGlobalSettings from "./describeGlobalSettings";
import describeProtectedResource from "./describeProtectedResource";
import describeRecoveryPoint from "./describeRecoveryPoint";
import describeRegionSettings from "./describeRegionSettings";
import describeReportJob from "./describeReportJob";
import describeReportPlan from "./describeReportPlan";
import describeRestoreJob from "./describeRestoreJob";
import describeScanJob from "./describeScanJob";
import disassociateBackupVaultMpaApprovalTeam from "./disassociateBackupVaultMpaApprovalTeam";
import disassociateRecoveryPoint from "./disassociateRecoveryPoint";
import disassociateRecoveryPointFromParent from "./disassociateRecoveryPointFromParent";
import exportBackupPlanTemplate from "./exportBackupPlanTemplate";
import getBackupPlan from "./getBackupPlan";
import getBackupPlanFromJSON from "./getBackupPlanFromJSON";
import getBackupPlanFromTemplate from "./getBackupPlanFromTemplate";
import getBackupSelection from "./getBackupSelection";
import getBackupVaultAccessPolicy from "./getBackupVaultAccessPolicy";
import getBackupVaultNotifications from "./getBackupVaultNotifications";
import getLegalHold from "./getLegalHold";
import getRecoveryPointIndexDetails from "./getRecoveryPointIndexDetails";
import getRecoveryPointRestoreMetadata from "./getRecoveryPointRestoreMetadata";
import getRestoreJobMetadata from "./getRestoreJobMetadata";
import getRestoreTestingInferredMetadata from "./getRestoreTestingInferredMetadata";
import getRestoreTestingPlan from "./getRestoreTestingPlan";
import getRestoreTestingSelection from "./getRestoreTestingSelection";
import getSupportedResourceTypes from "./getSupportedResourceTypes";
import getTieringConfiguration from "./getTieringConfiguration";
import listBackupJobSummaries from "./listBackupJobSummaries";
import listBackupJobs from "./listBackupJobs";
import listBackupPlanTemplates from "./listBackupPlanTemplates";
import listBackupPlanVersions from "./listBackupPlanVersions";
import listBackupPlans from "./listBackupPlans";
import listBackupSelections from "./listBackupSelections";
import listBackupVaults from "./listBackupVaults";
import listCopyJobSummaries from "./listCopyJobSummaries";
import listCopyJobs from "./listCopyJobs";
import listFrameworks from "./listFrameworks";
import listIndexedRecoveryPoints from "./listIndexedRecoveryPoints";
import listLegalHolds from "./listLegalHolds";
import listProtectedResources from "./listProtectedResources";
import listProtectedResourcesByBackupVault from "./listProtectedResourcesByBackupVault";
import listRecoveryPointsByBackupVault from "./listRecoveryPointsByBackupVault";
import listRecoveryPointsByLegalHold from "./listRecoveryPointsByLegalHold";
import listRecoveryPointsByResource from "./listRecoveryPointsByResource";
import listReportJobs from "./listReportJobs";
import listReportPlans from "./listReportPlans";
import listRestoreAccessBackupVaults from "./listRestoreAccessBackupVaults";
import listRestoreJobSummaries from "./listRestoreJobSummaries";
import listRestoreJobs from "./listRestoreJobs";
import listRestoreJobsByProtectedResource from "./listRestoreJobsByProtectedResource";
import listRestoreTestingPlans from "./listRestoreTestingPlans";
import listRestoreTestingSelections from "./listRestoreTestingSelections";
import listScanJobSummaries from "./listScanJobSummaries";
import listScanJobs from "./listScanJobs";
import listTags from "./listTags";
import listTieringConfigurations from "./listTieringConfigurations";
import putBackupVaultAccessPolicy from "./putBackupVaultAccessPolicy";
import putBackupVaultLockConfiguration from "./putBackupVaultLockConfiguration";
import putBackupVaultNotifications from "./putBackupVaultNotifications";
import putRestoreValidationResult from "./putRestoreValidationResult";
import revokeRestoreAccessBackupVault from "./revokeRestoreAccessBackupVault";
import startBackupJob from "./startBackupJob";
import startCopyJob from "./startCopyJob";
import startReportJob from "./startReportJob";
import startRestoreJob from "./startRestoreJob";
import startScanJob from "./startScanJob";
import stopBackupJob from "./stopBackupJob";
import tagResource from "./tagResource";
import untagResource from "./untagResource";
import updateBackupPlan from "./updateBackupPlan";
import updateFramework from "./updateFramework";
import updateGlobalSettings from "./updateGlobalSettings";
import updateRecoveryPointIndexSettings from "./updateRecoveryPointIndexSettings";
import updateRecoveryPointLifecycle from "./updateRecoveryPointLifecycle";
import updateRegionSettings from "./updateRegionSettings";
import updateReportPlan from "./updateReportPlan";
import updateRestoreTestingPlan from "./updateRestoreTestingPlan";
import updateRestoreTestingSelection from "./updateRestoreTestingSelection";
import updateTieringConfiguration from "./updateTieringConfiguration";

export const blocks = {
  associateBackupVaultMpaApprovalTeam,
  cancelLegalHold,
  createBackupPlan,
  createBackupSelection,
  createBackupVault,
  createFramework,
  createLegalHold,
  createLogicallyAirGappedBackupVault,
  createReportPlan,
  createRestoreAccessBackupVault,
  createRestoreTestingPlan,
  createRestoreTestingSelection,
  createTieringConfiguration,
  deleteBackupPlan,
  deleteBackupSelection,
  deleteBackupVault,
  deleteBackupVaultAccessPolicy,
  deleteBackupVaultLockConfiguration,
  deleteBackupVaultNotifications,
  deleteFramework,
  deleteRecoveryPoint,
  deleteReportPlan,
  deleteRestoreTestingPlan,
  deleteRestoreTestingSelection,
  deleteTieringConfiguration,
  describeBackupJob,
  describeBackupVault,
  describeCopyJob,
  describeFramework,
  describeGlobalSettings,
  describeProtectedResource,
  describeRecoveryPoint,
  describeRegionSettings,
  describeReportJob,
  describeReportPlan,
  describeRestoreJob,
  describeScanJob,
  disassociateBackupVaultMpaApprovalTeam,
  disassociateRecoveryPoint,
  disassociateRecoveryPointFromParent,
  exportBackupPlanTemplate,
  getBackupPlan,
  getBackupPlanFromJSON,
  getBackupPlanFromTemplate,
  getBackupSelection,
  getBackupVaultAccessPolicy,
  getBackupVaultNotifications,
  getLegalHold,
  getRecoveryPointIndexDetails,
  getRecoveryPointRestoreMetadata,
  getRestoreJobMetadata,
  getRestoreTestingInferredMetadata,
  getRestoreTestingPlan,
  getRestoreTestingSelection,
  getSupportedResourceTypes,
  getTieringConfiguration,
  listBackupJobSummaries,
  listBackupJobs,
  listBackupPlanTemplates,
  listBackupPlanVersions,
  listBackupPlans,
  listBackupSelections,
  listBackupVaults,
  listCopyJobSummaries,
  listCopyJobs,
  listFrameworks,
  listIndexedRecoveryPoints,
  listLegalHolds,
  listProtectedResources,
  listProtectedResourcesByBackupVault,
  listRecoveryPointsByBackupVault,
  listRecoveryPointsByLegalHold,
  listRecoveryPointsByResource,
  listReportJobs,
  listReportPlans,
  listRestoreAccessBackupVaults,
  listRestoreJobSummaries,
  listRestoreJobs,
  listRestoreJobsByProtectedResource,
  listRestoreTestingPlans,
  listRestoreTestingSelections,
  listScanJobSummaries,
  listScanJobs,
  listTags,
  listTieringConfigurations,
  putBackupVaultAccessPolicy,
  putBackupVaultLockConfiguration,
  putBackupVaultNotifications,
  putRestoreValidationResult,
  revokeRestoreAccessBackupVault,
  startBackupJob,
  startCopyJob,
  startReportJob,
  startRestoreJob,
  startScanJob,
  stopBackupJob,
  tagResource,
  untagResource,
  updateBackupPlan,
  updateFramework,
  updateGlobalSettings,
  updateRecoveryPointIndexSettings,
  updateRecoveryPointLifecycle,
  updateRegionSettings,
  updateReportPlan,
  updateRestoreTestingPlan,
  updateRestoreTestingSelection,
  updateTieringConfiguration,
};
