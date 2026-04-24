import acceptHandshake from "./acceptHandshake";
import attachPolicy from "./attachPolicy";
import cancelHandshake from "./cancelHandshake";
import closeAccount from "./closeAccount";
import createAccount from "./createAccount";
import createGovCloudAccount from "./createGovCloudAccount";
import createOrganization from "./createOrganization";
import createOrganizationalUnit from "./createOrganizationalUnit";
import createPolicy from "./createPolicy";
import declineHandshake from "./declineHandshake";
import deleteOrganization from "./deleteOrganization";
import deleteOrganizationalUnit from "./deleteOrganizationalUnit";
import deletePolicy from "./deletePolicy";
import deleteResourcePolicy from "./deleteResourcePolicy";
import deregisterDelegatedAdministrator from "./deregisterDelegatedAdministrator";
import describeAccount from "./describeAccount";
import describeCreateAccountStatus from "./describeCreateAccountStatus";
import describeEffectivePolicy from "./describeEffectivePolicy";
import describeHandshake from "./describeHandshake";
import describeOrganization from "./describeOrganization";
import describeOrganizationalUnit from "./describeOrganizationalUnit";
import describePolicy from "./describePolicy";
import describeResourcePolicy from "./describeResourcePolicy";
import detachPolicy from "./detachPolicy";
import disableAWSServiceAccess from "./disableAWSServiceAccess";
import disablePolicyType from "./disablePolicyType";
import enableAWSServiceAccess from "./enableAWSServiceAccess";
import enableAllFeatures from "./enableAllFeatures";
import enablePolicyType from "./enablePolicyType";
import inviteAccountToOrganization from "./inviteAccountToOrganization";
import leaveOrganization from "./leaveOrganization";
import listAWSServiceAccessForOrganization from "./listAWSServiceAccessForOrganization";
import listAccounts from "./listAccounts";
import listAccountsForParent from "./listAccountsForParent";
import listChildren from "./listChildren";
import listCreateAccountStatus from "./listCreateAccountStatus";
import listDelegatedAdministrators from "./listDelegatedAdministrators";
import listDelegatedServicesForAccount from "./listDelegatedServicesForAccount";
import listHandshakesForAccount from "./listHandshakesForAccount";
import listHandshakesForOrganization from "./listHandshakesForOrganization";
import listOrganizationalUnitsForParent from "./listOrganizationalUnitsForParent";
import listParents from "./listParents";
import listPolicies from "./listPolicies";
import listPoliciesForTarget from "./listPoliciesForTarget";
import listRoots from "./listRoots";
import listTagsForResource from "./listTagsForResource";
import listTargetsForPolicy from "./listTargetsForPolicy";
import moveAccount from "./moveAccount";
import putResourcePolicy from "./putResourcePolicy";
import registerDelegatedAdministrator from "./registerDelegatedAdministrator";
import removeAccountFromOrganization from "./removeAccountFromOrganization";
import tagResource from "./tagResource";
import untagResource from "./untagResource";
import updateOrganizationalUnit from "./updateOrganizationalUnit";
import updatePolicy from "./updatePolicy";

export const blocks = {
  acceptHandshake,
  attachPolicy,
  cancelHandshake,
  closeAccount,
  createAccount,
  createGovCloudAccount,
  createOrganization,
  createOrganizationalUnit,
  createPolicy,
  declineHandshake,
  deleteOrganization,
  deleteOrganizationalUnit,
  deletePolicy,
  deleteResourcePolicy,
  deregisterDelegatedAdministrator,
  describeAccount,
  describeCreateAccountStatus,
  describeEffectivePolicy,
  describeHandshake,
  describeOrganization,
  describeOrganizationalUnit,
  describePolicy,
  describeResourcePolicy,
  detachPolicy,
  disableAWSServiceAccess,
  disablePolicyType,
  enableAWSServiceAccess,
  enableAllFeatures,
  enablePolicyType,
  inviteAccountToOrganization,
  leaveOrganization,
  listAWSServiceAccessForOrganization,
  listAccounts,
  listAccountsForParent,
  listChildren,
  listCreateAccountStatus,
  listDelegatedAdministrators,
  listDelegatedServicesForAccount,
  listHandshakesForAccount,
  listHandshakesForOrganization,
  listOrganizationalUnitsForParent,
  listParents,
  listPolicies,
  listPoliciesForTarget,
  listRoots,
  listTagsForResource,
  listTargetsForPolicy,
  moveAccount,
  putResourcePolicy,
  registerDelegatedAdministrator,
  removeAccountFromOrganization,
  tagResource,
  untagResource,
  updateOrganizationalUnit,
  updatePolicy,
};
