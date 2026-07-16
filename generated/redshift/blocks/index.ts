import acceptReservedNodeExchange from "./acceptReservedNodeExchange";
import addPartner from "./addPartner";
import associateDataShareConsumer from "./associateDataShareConsumer";
import authorizeClusterSecurityGroupIngress from "./authorizeClusterSecurityGroupIngress";
import authorizeDataShare from "./authorizeDataShare";
import authorizeEndpointAccess from "./authorizeEndpointAccess";
import authorizeSnapshotAccess from "./authorizeSnapshotAccess";
import batchDeleteClusterSnapshots from "./batchDeleteClusterSnapshots";
import batchModifyClusterSnapshots from "./batchModifyClusterSnapshots";
import cancelResize from "./cancelResize";
import copyClusterSnapshot from "./copyClusterSnapshot";
import createAuthenticationProfile from "./createAuthenticationProfile";
import createCluster from "./createCluster";
import createClusterParameterGroup from "./createClusterParameterGroup";
import createClusterSecurityGroup from "./createClusterSecurityGroup";
import createClusterSnapshot from "./createClusterSnapshot";
import createClusterSubnetGroup from "./createClusterSubnetGroup";
import createCustomDomainAssociation from "./createCustomDomainAssociation";
import createEndpointAccess from "./createEndpointAccess";
import createEventSubscription from "./createEventSubscription";
import createHsmClientCertificate from "./createHsmClientCertificate";
import createHsmConfiguration from "./createHsmConfiguration";
import createIntegration from "./createIntegration";
import createRedshiftIdcApplication from "./createRedshiftIdcApplication";
import createScheduledAction from "./createScheduledAction";
import createSnapshotCopyGrant from "./createSnapshotCopyGrant";
import createSnapshotSchedule from "./createSnapshotSchedule";
import createTags from "./createTags";
import createUsageLimit from "./createUsageLimit";
import deauthorizeDataShare from "./deauthorizeDataShare";
import deleteAuthenticationProfile from "./deleteAuthenticationProfile";
import deleteCluster from "./deleteCluster";
import deleteClusterParameterGroup from "./deleteClusterParameterGroup";
import deleteClusterSecurityGroup from "./deleteClusterSecurityGroup";
import deleteClusterSnapshot from "./deleteClusterSnapshot";
import deleteClusterSubnetGroup from "./deleteClusterSubnetGroup";
import deleteCustomDomainAssociation from "./deleteCustomDomainAssociation";
import deleteEndpointAccess from "./deleteEndpointAccess";
import deleteEventSubscription from "./deleteEventSubscription";
import deleteHsmClientCertificate from "./deleteHsmClientCertificate";
import deleteHsmConfiguration from "./deleteHsmConfiguration";
import deleteIntegration from "./deleteIntegration";
import deletePartner from "./deletePartner";
import deleteRedshiftIdcApplication from "./deleteRedshiftIdcApplication";
import deleteResourcePolicy from "./deleteResourcePolicy";
import deleteScheduledAction from "./deleteScheduledAction";
import deleteSnapshotCopyGrant from "./deleteSnapshotCopyGrant";
import deleteSnapshotSchedule from "./deleteSnapshotSchedule";
import deleteTags from "./deleteTags";
import deleteUsageLimit from "./deleteUsageLimit";
import deregisterNamespace from "./deregisterNamespace";
import describeAccountAttributes from "./describeAccountAttributes";
import describeAuthenticationProfiles from "./describeAuthenticationProfiles";
import describeClusterDbRevisions from "./describeClusterDbRevisions";
import describeClusterParameterGroups from "./describeClusterParameterGroups";
import describeClusterParameters from "./describeClusterParameters";
import describeClusterSecurityGroups from "./describeClusterSecurityGroups";
import describeClusterSnapshots from "./describeClusterSnapshots";
import describeClusterSubnetGroups from "./describeClusterSubnetGroups";
import describeClusterTracks from "./describeClusterTracks";
import describeClusterVersions from "./describeClusterVersions";
import describeClusters from "./describeClusters";
import describeCustomDomainAssociations from "./describeCustomDomainAssociations";
import describeDataShares from "./describeDataShares";
import describeDataSharesForConsumer from "./describeDataSharesForConsumer";
import describeDataSharesForProducer from "./describeDataSharesForProducer";
import describeDefaultClusterParameters from "./describeDefaultClusterParameters";
import describeEndpointAccess from "./describeEndpointAccess";
import describeEndpointAuthorization from "./describeEndpointAuthorization";
import describeEventCategories from "./describeEventCategories";
import describeEventSubscriptions from "./describeEventSubscriptions";
import describeEvents from "./describeEvents";
import describeHsmClientCertificates from "./describeHsmClientCertificates";
import describeHsmConfigurations from "./describeHsmConfigurations";
import describeInboundIntegrations from "./describeInboundIntegrations";
import describeIntegrations from "./describeIntegrations";
import describeLoggingStatus from "./describeLoggingStatus";
import describeNodeConfigurationOptions from "./describeNodeConfigurationOptions";
import describeOrderableClusterOptions from "./describeOrderableClusterOptions";
import describePartners from "./describePartners";
import describeRedshiftIdcApplications from "./describeRedshiftIdcApplications";
import describeReservedNodeExchangeStatus from "./describeReservedNodeExchangeStatus";
import describeReservedNodeOfferings from "./describeReservedNodeOfferings";
import describeReservedNodes from "./describeReservedNodes";
import describeResize from "./describeResize";
import describeScheduledActions from "./describeScheduledActions";
import describeSnapshotCopyGrants from "./describeSnapshotCopyGrants";
import describeSnapshotSchedules from "./describeSnapshotSchedules";
import describeStorage from "./describeStorage";
import describeTableRestoreStatus from "./describeTableRestoreStatus";
import describeTags from "./describeTags";
import describeUsageLimits from "./describeUsageLimits";
import disableLogging from "./disableLogging";
import disableSnapshotCopy from "./disableSnapshotCopy";
import disassociateDataShareConsumer from "./disassociateDataShareConsumer";
import enableLogging from "./enableLogging";
import enableSnapshotCopy from "./enableSnapshotCopy";
import failoverPrimaryCompute from "./failoverPrimaryCompute";
import getClusterCredentials from "./getClusterCredentials";
import getClusterCredentialsWithIAM from "./getClusterCredentialsWithIAM";
import getIdentityCenterAuthToken from "./getIdentityCenterAuthToken";
import getReservedNodeExchangeConfigurationOptions from "./getReservedNodeExchangeConfigurationOptions";
import getReservedNodeExchangeOfferings from "./getReservedNodeExchangeOfferings";
import getResourcePolicy from "./getResourcePolicy";
import listRecommendations from "./listRecommendations";
import modifyAquaConfiguration from "./modifyAquaConfiguration";
import modifyAuthenticationProfile from "./modifyAuthenticationProfile";
import modifyCluster from "./modifyCluster";
import modifyClusterDbRevision from "./modifyClusterDbRevision";
import modifyClusterIamRoles from "./modifyClusterIamRoles";
import modifyClusterMaintenance from "./modifyClusterMaintenance";
import modifyClusterParameterGroup from "./modifyClusterParameterGroup";
import modifyClusterSnapshot from "./modifyClusterSnapshot";
import modifyClusterSnapshotSchedule from "./modifyClusterSnapshotSchedule";
import modifyClusterSubnetGroup from "./modifyClusterSubnetGroup";
import modifyCustomDomainAssociation from "./modifyCustomDomainAssociation";
import modifyEndpointAccess from "./modifyEndpointAccess";
import modifyEventSubscription from "./modifyEventSubscription";
import modifyIntegration from "./modifyIntegration";
import modifyLakehouseConfiguration from "./modifyLakehouseConfiguration";
import modifyRedshiftIdcApplication from "./modifyRedshiftIdcApplication";
import modifyScheduledAction from "./modifyScheduledAction";
import modifySnapshotCopyRetentionPeriod from "./modifySnapshotCopyRetentionPeriod";
import modifySnapshotSchedule from "./modifySnapshotSchedule";
import modifyUsageLimit from "./modifyUsageLimit";
import pauseCluster from "./pauseCluster";
import purchaseReservedNodeOffering from "./purchaseReservedNodeOffering";
import putResourcePolicy from "./putResourcePolicy";
import rebootCluster from "./rebootCluster";
import registerNamespace from "./registerNamespace";
import rejectDataShare from "./rejectDataShare";
import resetClusterParameterGroup from "./resetClusterParameterGroup";
import resizeCluster from "./resizeCluster";
import restoreFromClusterSnapshot from "./restoreFromClusterSnapshot";
import restoreTableFromClusterSnapshot from "./restoreTableFromClusterSnapshot";
import resumeCluster from "./resumeCluster";
import revokeClusterSecurityGroupIngress from "./revokeClusterSecurityGroupIngress";
import revokeEndpointAccess from "./revokeEndpointAccess";
import revokeSnapshotAccess from "./revokeSnapshotAccess";
import rotateEncryptionKey from "./rotateEncryptionKey";
import updatePartnerStatus from "./updatePartnerStatus";

export const blocks = {
  acceptReservedNodeExchange,
  addPartner,
  associateDataShareConsumer,
  authorizeClusterSecurityGroupIngress,
  authorizeDataShare,
  authorizeEndpointAccess,
  authorizeSnapshotAccess,
  batchDeleteClusterSnapshots,
  batchModifyClusterSnapshots,
  cancelResize,
  copyClusterSnapshot,
  createAuthenticationProfile,
  createCluster,
  createClusterParameterGroup,
  createClusterSecurityGroup,
  createClusterSnapshot,
  createClusterSubnetGroup,
  createCustomDomainAssociation,
  createEndpointAccess,
  createEventSubscription,
  createHsmClientCertificate,
  createHsmConfiguration,
  createIntegration,
  createRedshiftIdcApplication,
  createScheduledAction,
  createSnapshotCopyGrant,
  createSnapshotSchedule,
  createTags,
  createUsageLimit,
  deauthorizeDataShare,
  deleteAuthenticationProfile,
  deleteCluster,
  deleteClusterParameterGroup,
  deleteClusterSecurityGroup,
  deleteClusterSnapshot,
  deleteClusterSubnetGroup,
  deleteCustomDomainAssociation,
  deleteEndpointAccess,
  deleteEventSubscription,
  deleteHsmClientCertificate,
  deleteHsmConfiguration,
  deleteIntegration,
  deletePartner,
  deleteRedshiftIdcApplication,
  deleteResourcePolicy,
  deleteScheduledAction,
  deleteSnapshotCopyGrant,
  deleteSnapshotSchedule,
  deleteTags,
  deleteUsageLimit,
  deregisterNamespace,
  describeAccountAttributes,
  describeAuthenticationProfiles,
  describeClusterDbRevisions,
  describeClusterParameterGroups,
  describeClusterParameters,
  describeClusterSecurityGroups,
  describeClusterSnapshots,
  describeClusterSubnetGroups,
  describeClusterTracks,
  describeClusterVersions,
  describeClusters,
  describeCustomDomainAssociations,
  describeDataShares,
  describeDataSharesForConsumer,
  describeDataSharesForProducer,
  describeDefaultClusterParameters,
  describeEndpointAccess,
  describeEndpointAuthorization,
  describeEventCategories,
  describeEventSubscriptions,
  describeEvents,
  describeHsmClientCertificates,
  describeHsmConfigurations,
  describeInboundIntegrations,
  describeIntegrations,
  describeLoggingStatus,
  describeNodeConfigurationOptions,
  describeOrderableClusterOptions,
  describePartners,
  describeRedshiftIdcApplications,
  describeReservedNodeExchangeStatus,
  describeReservedNodeOfferings,
  describeReservedNodes,
  describeResize,
  describeScheduledActions,
  describeSnapshotCopyGrants,
  describeSnapshotSchedules,
  describeStorage,
  describeTableRestoreStatus,
  describeTags,
  describeUsageLimits,
  disableLogging,
  disableSnapshotCopy,
  disassociateDataShareConsumer,
  enableLogging,
  enableSnapshotCopy,
  failoverPrimaryCompute,
  getClusterCredentials,
  getClusterCredentialsWithIAM,
  getIdentityCenterAuthToken,
  getReservedNodeExchangeConfigurationOptions,
  getReservedNodeExchangeOfferings,
  getResourcePolicy,
  listRecommendations,
  modifyAquaConfiguration,
  modifyAuthenticationProfile,
  modifyCluster,
  modifyClusterDbRevision,
  modifyClusterIamRoles,
  modifyClusterMaintenance,
  modifyClusterParameterGroup,
  modifyClusterSnapshot,
  modifyClusterSnapshotSchedule,
  modifyClusterSubnetGroup,
  modifyCustomDomainAssociation,
  modifyEndpointAccess,
  modifyEventSubscription,
  modifyIntegration,
  modifyLakehouseConfiguration,
  modifyRedshiftIdcApplication,
  modifyScheduledAction,
  modifySnapshotCopyRetentionPeriod,
  modifySnapshotSchedule,
  modifyUsageLimit,
  pauseCluster,
  purchaseReservedNodeOffering,
  putResourcePolicy,
  rebootCluster,
  registerNamespace,
  rejectDataShare,
  resetClusterParameterGroup,
  resizeCluster,
  restoreFromClusterSnapshot,
  restoreTableFromClusterSnapshot,
  resumeCluster,
  revokeClusterSecurityGroupIngress,
  revokeEndpointAccess,
  revokeSnapshotAccess,
  rotateEncryptionKey,
  updatePartnerStatus,
};
