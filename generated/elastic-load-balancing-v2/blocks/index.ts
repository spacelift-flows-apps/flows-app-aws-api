import addListenerCertificates from "./addListenerCertificates";
import addTags from "./addTags";
import addTrustStoreRevocations from "./addTrustStoreRevocations";
import createListener from "./createListener";
import createLoadBalancer from "./createLoadBalancer";
import createRule from "./createRule";
import createTargetGroup from "./createTargetGroup";
import createTrustStore from "./createTrustStore";
import deleteListener from "./deleteListener";
import deleteLoadBalancer from "./deleteLoadBalancer";
import deleteRule from "./deleteRule";
import deleteSharedTrustStoreAssociation from "./deleteSharedTrustStoreAssociation";
import deleteTargetGroup from "./deleteTargetGroup";
import deleteTrustStore from "./deleteTrustStore";
import deregisterTargets from "./deregisterTargets";
import describeAccountLimits from "./describeAccountLimits";
import describeCapacityReservation from "./describeCapacityReservation";
import describeListenerAttributes from "./describeListenerAttributes";
import describeListenerCertificates from "./describeListenerCertificates";
import describeListeners from "./describeListeners";
import describeLoadBalancerAttributes from "./describeLoadBalancerAttributes";
import describeLoadBalancers from "./describeLoadBalancers";
import describeRules from "./describeRules";
import describeSSLPolicies from "./describeSSLPolicies";
import describeTags from "./describeTags";
import describeTargetGroupAttributes from "./describeTargetGroupAttributes";
import describeTargetGroups from "./describeTargetGroups";
import describeTargetHealth from "./describeTargetHealth";
import describeTrustStoreAssociations from "./describeTrustStoreAssociations";
import describeTrustStoreRevocations from "./describeTrustStoreRevocations";
import describeTrustStores from "./describeTrustStores";
import getResourcePolicy from "./getResourcePolicy";
import getTrustStoreCaCertificatesBundle from "./getTrustStoreCaCertificatesBundle";
import getTrustStoreRevocationContent from "./getTrustStoreRevocationContent";
import modifyCapacityReservation from "./modifyCapacityReservation";
import modifyIpPools from "./modifyIpPools";
import modifyListener from "./modifyListener";
import modifyListenerAttributes from "./modifyListenerAttributes";
import modifyLoadBalancerAttributes from "./modifyLoadBalancerAttributes";
import modifyRule from "./modifyRule";
import modifyTargetGroup from "./modifyTargetGroup";
import modifyTargetGroupAttributes from "./modifyTargetGroupAttributes";
import modifyTrustStore from "./modifyTrustStore";
import registerTargets from "./registerTargets";
import removeListenerCertificates from "./removeListenerCertificates";
import removeTags from "./removeTags";
import removeTrustStoreRevocations from "./removeTrustStoreRevocations";
import setIpAddressType from "./setIpAddressType";
import setRulePriorities from "./setRulePriorities";
import setSecurityGroups from "./setSecurityGroups";
import setSubnets from "./setSubnets";

export const blocks = {
  addListenerCertificates,
  addTags,
  addTrustStoreRevocations,
  createListener,
  createLoadBalancer,
  createRule,
  createTargetGroup,
  createTrustStore,
  deleteListener,
  deleteLoadBalancer,
  deleteRule,
  deleteSharedTrustStoreAssociation,
  deleteTargetGroup,
  deleteTrustStore,
  deregisterTargets,
  describeAccountLimits,
  describeCapacityReservation,
  describeListenerAttributes,
  describeListenerCertificates,
  describeListeners,
  describeLoadBalancerAttributes,
  describeLoadBalancers,
  describeRules,
  describeSSLPolicies,
  describeTags,
  describeTargetGroupAttributes,
  describeTargetGroups,
  describeTargetHealth,
  describeTrustStoreAssociations,
  describeTrustStoreRevocations,
  describeTrustStores,
  getResourcePolicy,
  getTrustStoreCaCertificatesBundle,
  getTrustStoreRevocationContent,
  modifyCapacityReservation,
  modifyIpPools,
  modifyListener,
  modifyListenerAttributes,
  modifyLoadBalancerAttributes,
  modifyRule,
  modifyTargetGroup,
  modifyTargetGroupAttributes,
  modifyTrustStore,
  registerTargets,
  removeListenerCertificates,
  removeTags,
  removeTrustStoreRevocations,
  setIpAddressType,
  setRulePriorities,
  setSecurityGroups,
  setSubnets,
};
