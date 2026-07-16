import acceptDelegationRequest from "./acceptDelegationRequest";
import addClientIDToOpenIDConnectProvider from "./addClientIDToOpenIDConnectProvider";
import addRoleToInstanceProfile from "./addRoleToInstanceProfile";
import addUserToGroup from "./addUserToGroup";
import associateDelegationRequest from "./associateDelegationRequest";
import attachGroupPolicy from "./attachGroupPolicy";
import attachRolePolicy from "./attachRolePolicy";
import attachUserPolicy from "./attachUserPolicy";
import changePassword from "./changePassword";
import createAccessKey from "./createAccessKey";
import createAccountAlias from "./createAccountAlias";
import createDelegationRequest from "./createDelegationRequest";
import createGroup from "./createGroup";
import createInstanceProfile from "./createInstanceProfile";
import createLoginProfile from "./createLoginProfile";
import createOpenIDConnectProvider from "./createOpenIDConnectProvider";
import createPolicy from "./createPolicy";
import createPolicyVersion from "./createPolicyVersion";
import createRole from "./createRole";
import createSAMLProvider from "./createSAMLProvider";
import createServiceLinkedRole from "./createServiceLinkedRole";
import createServiceSpecificCredential from "./createServiceSpecificCredential";
import createUser from "./createUser";
import createVirtualMFADevice from "./createVirtualMFADevice";
import deactivateMFADevice from "./deactivateMFADevice";
import deleteAccessKey from "./deleteAccessKey";
import deleteAccountAlias from "./deleteAccountAlias";
import deleteAccountPasswordPolicy from "./deleteAccountPasswordPolicy";
import deleteGroup from "./deleteGroup";
import deleteGroupPolicy from "./deleteGroupPolicy";
import deleteInstanceProfile from "./deleteInstanceProfile";
import deleteLoginProfile from "./deleteLoginProfile";
import deleteOpenIDConnectProvider from "./deleteOpenIDConnectProvider";
import deletePolicy from "./deletePolicy";
import deletePolicyVersion from "./deletePolicyVersion";
import deleteRole from "./deleteRole";
import deleteRolePermissionsBoundary from "./deleteRolePermissionsBoundary";
import deleteRolePolicy from "./deleteRolePolicy";
import deleteSAMLProvider from "./deleteSAMLProvider";
import deleteSSHPublicKey from "./deleteSSHPublicKey";
import deleteServerCertificate from "./deleteServerCertificate";
import deleteServiceLinkedRole from "./deleteServiceLinkedRole";
import deleteServiceSpecificCredential from "./deleteServiceSpecificCredential";
import deleteSigningCertificate from "./deleteSigningCertificate";
import deleteUser from "./deleteUser";
import deleteUserPermissionsBoundary from "./deleteUserPermissionsBoundary";
import deleteUserPolicy from "./deleteUserPolicy";
import deleteVirtualMFADevice from "./deleteVirtualMFADevice";
import detachGroupPolicy from "./detachGroupPolicy";
import detachRolePolicy from "./detachRolePolicy";
import detachUserPolicy from "./detachUserPolicy";
import disableOrganizationsRootCredentialsManagement from "./disableOrganizationsRootCredentialsManagement";
import disableOrganizationsRootSessions from "./disableOrganizationsRootSessions";
import disableOutboundWebIdentityFederation from "./disableOutboundWebIdentityFederation";
import enableMFADevice from "./enableMFADevice";
import enableOrganizationsRootCredentialsManagement from "./enableOrganizationsRootCredentialsManagement";
import enableOrganizationsRootSessions from "./enableOrganizationsRootSessions";
import enableOutboundWebIdentityFederation from "./enableOutboundWebIdentityFederation";
import generateCredentialReport from "./generateCredentialReport";
import generateOrganizationsAccessReport from "./generateOrganizationsAccessReport";
import generateServiceLastAccessedDetails from "./generateServiceLastAccessedDetails";
import getAccessKeyLastUsed from "./getAccessKeyLastUsed";
import getAccountAuthorizationDetails from "./getAccountAuthorizationDetails";
import getAccountPasswordPolicy from "./getAccountPasswordPolicy";
import getAccountSummary from "./getAccountSummary";
import getContextKeysForCustomPolicy from "./getContextKeysForCustomPolicy";
import getContextKeysForPrincipalPolicy from "./getContextKeysForPrincipalPolicy";
import getCredentialReport from "./getCredentialReport";
import getDelegationRequest from "./getDelegationRequest";
import getGroup from "./getGroup";
import getGroupPolicy from "./getGroupPolicy";
import getHumanReadableSummary from "./getHumanReadableSummary";
import getInstanceProfile from "./getInstanceProfile";
import getLoginProfile from "./getLoginProfile";
import getMFADevice from "./getMFADevice";
import getOpenIDConnectProvider from "./getOpenIDConnectProvider";
import getOrganizationsAccessReport from "./getOrganizationsAccessReport";
import getOutboundWebIdentityFederationInfo from "./getOutboundWebIdentityFederationInfo";
import getPolicy from "./getPolicy";
import getPolicyVersion from "./getPolicyVersion";
import getRole from "./getRole";
import getRolePolicy from "./getRolePolicy";
import getSAMLProvider from "./getSAMLProvider";
import getSSHPublicKey from "./getSSHPublicKey";
import getServerCertificate from "./getServerCertificate";
import getServiceLastAccessedDetails from "./getServiceLastAccessedDetails";
import getServiceLastAccessedDetailsWithEntities from "./getServiceLastAccessedDetailsWithEntities";
import getServiceLinkedRoleDeletionStatus from "./getServiceLinkedRoleDeletionStatus";
import getUser from "./getUser";
import getUserPolicy from "./getUserPolicy";
import listAccessKeys from "./listAccessKeys";
import listAccountAliases from "./listAccountAliases";
import listAttachedGroupPolicies from "./listAttachedGroupPolicies";
import listAttachedRolePolicies from "./listAttachedRolePolicies";
import listAttachedUserPolicies from "./listAttachedUserPolicies";
import listDelegationRequests from "./listDelegationRequests";
import listEntitiesForPolicy from "./listEntitiesForPolicy";
import listGroupPolicies from "./listGroupPolicies";
import listGroups from "./listGroups";
import listGroupsForUser from "./listGroupsForUser";
import listInstanceProfileTags from "./listInstanceProfileTags";
import listInstanceProfiles from "./listInstanceProfiles";
import listInstanceProfilesForRole from "./listInstanceProfilesForRole";
import listMFADeviceTags from "./listMFADeviceTags";
import listMFADevices from "./listMFADevices";
import listOpenIDConnectProviderTags from "./listOpenIDConnectProviderTags";
import listOpenIDConnectProviders from "./listOpenIDConnectProviders";
import listOrganizationsFeatures from "./listOrganizationsFeatures";
import listPolicies from "./listPolicies";
import listPoliciesGrantingServiceAccess from "./listPoliciesGrantingServiceAccess";
import listPolicyTags from "./listPolicyTags";
import listPolicyVersions from "./listPolicyVersions";
import listRolePolicies from "./listRolePolicies";
import listRoleTags from "./listRoleTags";
import listRoles from "./listRoles";
import listSAMLProviderTags from "./listSAMLProviderTags";
import listSAMLProviders from "./listSAMLProviders";
import listSSHPublicKeys from "./listSSHPublicKeys";
import listServerCertificateTags from "./listServerCertificateTags";
import listServerCertificates from "./listServerCertificates";
import listServiceSpecificCredentials from "./listServiceSpecificCredentials";
import listSigningCertificates from "./listSigningCertificates";
import listUserPolicies from "./listUserPolicies";
import listUserTags from "./listUserTags";
import listUsers from "./listUsers";
import listVirtualMFADevices from "./listVirtualMFADevices";
import putGroupPolicy from "./putGroupPolicy";
import putRolePermissionsBoundary from "./putRolePermissionsBoundary";
import putRolePolicy from "./putRolePolicy";
import putUserPermissionsBoundary from "./putUserPermissionsBoundary";
import putUserPolicy from "./putUserPolicy";
import rejectDelegationRequest from "./rejectDelegationRequest";
import removeClientIDFromOpenIDConnectProvider from "./removeClientIDFromOpenIDConnectProvider";
import removeRoleFromInstanceProfile from "./removeRoleFromInstanceProfile";
import removeUserFromGroup from "./removeUserFromGroup";
import resetServiceSpecificCredential from "./resetServiceSpecificCredential";
import resyncMFADevice from "./resyncMFADevice";
import sendDelegationToken from "./sendDelegationToken";
import setDefaultPolicyVersion from "./setDefaultPolicyVersion";
import setSecurityTokenServicePreferences from "./setSecurityTokenServicePreferences";
import simulateCustomPolicy from "./simulateCustomPolicy";
import simulatePrincipalPolicy from "./simulatePrincipalPolicy";
import tagInstanceProfile from "./tagInstanceProfile";
import tagMFADevice from "./tagMFADevice";
import tagOpenIDConnectProvider from "./tagOpenIDConnectProvider";
import tagPolicy from "./tagPolicy";
import tagRole from "./tagRole";
import tagSAMLProvider from "./tagSAMLProvider";
import tagServerCertificate from "./tagServerCertificate";
import tagUser from "./tagUser";
import untagInstanceProfile from "./untagInstanceProfile";
import untagMFADevice from "./untagMFADevice";
import untagOpenIDConnectProvider from "./untagOpenIDConnectProvider";
import untagPolicy from "./untagPolicy";
import untagRole from "./untagRole";
import untagSAMLProvider from "./untagSAMLProvider";
import untagServerCertificate from "./untagServerCertificate";
import untagUser from "./untagUser";
import updateAccessKey from "./updateAccessKey";
import updateAccountPasswordPolicy from "./updateAccountPasswordPolicy";
import updateAssumeRolePolicy from "./updateAssumeRolePolicy";
import updateDelegationRequest from "./updateDelegationRequest";
import updateGroup from "./updateGroup";
import updateLoginProfile from "./updateLoginProfile";
import updateOpenIDConnectProviderThumbprint from "./updateOpenIDConnectProviderThumbprint";
import updateRole from "./updateRole";
import updateRoleDescription from "./updateRoleDescription";
import updateSAMLProvider from "./updateSAMLProvider";
import updateSSHPublicKey from "./updateSSHPublicKey";
import updateServerCertificate from "./updateServerCertificate";
import updateServiceSpecificCredential from "./updateServiceSpecificCredential";
import updateSigningCertificate from "./updateSigningCertificate";
import updateUser from "./updateUser";
import uploadSSHPublicKey from "./uploadSSHPublicKey";
import uploadServerCertificate from "./uploadServerCertificate";
import uploadSigningCertificate from "./uploadSigningCertificate";

export const blocks = {
  acceptDelegationRequest,
  addClientIDToOpenIDConnectProvider,
  addRoleToInstanceProfile,
  addUserToGroup,
  associateDelegationRequest,
  attachGroupPolicy,
  attachRolePolicy,
  attachUserPolicy,
  changePassword,
  createAccessKey,
  createAccountAlias,
  createDelegationRequest,
  createGroup,
  createInstanceProfile,
  createLoginProfile,
  createOpenIDConnectProvider,
  createPolicy,
  createPolicyVersion,
  createRole,
  createSAMLProvider,
  createServiceLinkedRole,
  createServiceSpecificCredential,
  createUser,
  createVirtualMFADevice,
  deactivateMFADevice,
  deleteAccessKey,
  deleteAccountAlias,
  deleteAccountPasswordPolicy,
  deleteGroup,
  deleteGroupPolicy,
  deleteInstanceProfile,
  deleteLoginProfile,
  deleteOpenIDConnectProvider,
  deletePolicy,
  deletePolicyVersion,
  deleteRole,
  deleteRolePermissionsBoundary,
  deleteRolePolicy,
  deleteSAMLProvider,
  deleteSSHPublicKey,
  deleteServerCertificate,
  deleteServiceLinkedRole,
  deleteServiceSpecificCredential,
  deleteSigningCertificate,
  deleteUser,
  deleteUserPermissionsBoundary,
  deleteUserPolicy,
  deleteVirtualMFADevice,
  detachGroupPolicy,
  detachRolePolicy,
  detachUserPolicy,
  disableOrganizationsRootCredentialsManagement,
  disableOrganizationsRootSessions,
  disableOutboundWebIdentityFederation,
  enableMFADevice,
  enableOrganizationsRootCredentialsManagement,
  enableOrganizationsRootSessions,
  enableOutboundWebIdentityFederation,
  generateCredentialReport,
  generateOrganizationsAccessReport,
  generateServiceLastAccessedDetails,
  getAccessKeyLastUsed,
  getAccountAuthorizationDetails,
  getAccountPasswordPolicy,
  getAccountSummary,
  getContextKeysForCustomPolicy,
  getContextKeysForPrincipalPolicy,
  getCredentialReport,
  getDelegationRequest,
  getGroup,
  getGroupPolicy,
  getHumanReadableSummary,
  getInstanceProfile,
  getLoginProfile,
  getMFADevice,
  getOpenIDConnectProvider,
  getOrganizationsAccessReport,
  getOutboundWebIdentityFederationInfo,
  getPolicy,
  getPolicyVersion,
  getRole,
  getRolePolicy,
  getSAMLProvider,
  getSSHPublicKey,
  getServerCertificate,
  getServiceLastAccessedDetails,
  getServiceLastAccessedDetailsWithEntities,
  getServiceLinkedRoleDeletionStatus,
  getUser,
  getUserPolicy,
  listAccessKeys,
  listAccountAliases,
  listAttachedGroupPolicies,
  listAttachedRolePolicies,
  listAttachedUserPolicies,
  listDelegationRequests,
  listEntitiesForPolicy,
  listGroupPolicies,
  listGroups,
  listGroupsForUser,
  listInstanceProfileTags,
  listInstanceProfiles,
  listInstanceProfilesForRole,
  listMFADeviceTags,
  listMFADevices,
  listOpenIDConnectProviderTags,
  listOpenIDConnectProviders,
  listOrganizationsFeatures,
  listPolicies,
  listPoliciesGrantingServiceAccess,
  listPolicyTags,
  listPolicyVersions,
  listRolePolicies,
  listRoleTags,
  listRoles,
  listSAMLProviderTags,
  listSAMLProviders,
  listSSHPublicKeys,
  listServerCertificateTags,
  listServerCertificates,
  listServiceSpecificCredentials,
  listSigningCertificates,
  listUserPolicies,
  listUserTags,
  listUsers,
  listVirtualMFADevices,
  putGroupPolicy,
  putRolePermissionsBoundary,
  putRolePolicy,
  putUserPermissionsBoundary,
  putUserPolicy,
  rejectDelegationRequest,
  removeClientIDFromOpenIDConnectProvider,
  removeRoleFromInstanceProfile,
  removeUserFromGroup,
  resetServiceSpecificCredential,
  resyncMFADevice,
  sendDelegationToken,
  setDefaultPolicyVersion,
  setSecurityTokenServicePreferences,
  simulateCustomPolicy,
  simulatePrincipalPolicy,
  tagInstanceProfile,
  tagMFADevice,
  tagOpenIDConnectProvider,
  tagPolicy,
  tagRole,
  tagSAMLProvider,
  tagServerCertificate,
  tagUser,
  untagInstanceProfile,
  untagMFADevice,
  untagOpenIDConnectProvider,
  untagPolicy,
  untagRole,
  untagSAMLProvider,
  untagServerCertificate,
  untagUser,
  updateAccessKey,
  updateAccountPasswordPolicy,
  updateAssumeRolePolicy,
  updateDelegationRequest,
  updateGroup,
  updateLoginProfile,
  updateOpenIDConnectProviderThumbprint,
  updateRole,
  updateRoleDescription,
  updateSAMLProvider,
  updateSSHPublicKey,
  updateServerCertificate,
  updateServiceSpecificCredential,
  updateSigningCertificate,
  updateUser,
  uploadSSHPublicKey,
  uploadServerCertificate,
  uploadSigningCertificate,
};
