import batchCheckLayerAvailability from "./batchCheckLayerAvailability";
import batchDeleteImage from "./batchDeleteImage";
import batchGetImage from "./batchGetImage";
import batchGetRepositoryScanningConfiguration from "./batchGetRepositoryScanningConfiguration";
import completeLayerUpload from "./completeLayerUpload";
import createPullThroughCacheRule from "./createPullThroughCacheRule";
import createRepository from "./createRepository";
import createRepositoryCreationTemplate from "./createRepositoryCreationTemplate";
import deleteLifecyclePolicy from "./deleteLifecyclePolicy";
import deletePullThroughCacheRule from "./deletePullThroughCacheRule";
import deleteRegistryPolicy from "./deleteRegistryPolicy";
import deleteRepository from "./deleteRepository";
import deleteRepositoryCreationTemplate from "./deleteRepositoryCreationTemplate";
import deleteRepositoryPolicy from "./deleteRepositoryPolicy";
import deleteSigningConfiguration from "./deleteSigningConfiguration";
import deregisterPullTimeUpdateExclusion from "./deregisterPullTimeUpdateExclusion";
import describeImageReplicationStatus from "./describeImageReplicationStatus";
import describeImageScanFindings from "./describeImageScanFindings";
import describeImageSigningStatus from "./describeImageSigningStatus";
import describeImages from "./describeImages";
import describePullThroughCacheRules from "./describePullThroughCacheRules";
import describeRegistry from "./describeRegistry";
import describeRepositories from "./describeRepositories";
import describeRepositoryCreationTemplates from "./describeRepositoryCreationTemplates";
import getAccountSetting from "./getAccountSetting";
import getAuthorizationToken from "./getAuthorizationToken";
import getDownloadUrlForLayer from "./getDownloadUrlForLayer";
import getLifecyclePolicy from "./getLifecyclePolicy";
import getLifecyclePolicyPreview from "./getLifecyclePolicyPreview";
import getRegistryPolicy from "./getRegistryPolicy";
import getRegistryScanningConfiguration from "./getRegistryScanningConfiguration";
import getRepositoryPolicy from "./getRepositoryPolicy";
import getSigningConfiguration from "./getSigningConfiguration";
import initiateLayerUpload from "./initiateLayerUpload";
import listImageReferrers from "./listImageReferrers";
import listImages from "./listImages";
import listPullTimeUpdateExclusions from "./listPullTimeUpdateExclusions";
import listTagsForResource from "./listTagsForResource";
import putAccountSetting from "./putAccountSetting";
import putImage from "./putImage";
import putImageScanningConfiguration from "./putImageScanningConfiguration";
import putImageTagMutability from "./putImageTagMutability";
import putLifecyclePolicy from "./putLifecyclePolicy";
import putRegistryPolicy from "./putRegistryPolicy";
import putRegistryScanningConfiguration from "./putRegistryScanningConfiguration";
import putReplicationConfiguration from "./putReplicationConfiguration";
import putSigningConfiguration from "./putSigningConfiguration";
import registerPullTimeUpdateExclusion from "./registerPullTimeUpdateExclusion";
import setRepositoryPolicy from "./setRepositoryPolicy";
import startImageScan from "./startImageScan";
import startLifecyclePolicyPreview from "./startLifecyclePolicyPreview";
import tagResource from "./tagResource";
import untagResource from "./untagResource";
import updateImageStorageClass from "./updateImageStorageClass";
import updatePullThroughCacheRule from "./updatePullThroughCacheRule";
import updateRepositoryCreationTemplate from "./updateRepositoryCreationTemplate";
import uploadLayerPart from "./uploadLayerPart";
import validatePullThroughCacheRule from "./validatePullThroughCacheRule";

export const blocks = {
  batchCheckLayerAvailability,
  batchDeleteImage,
  batchGetImage,
  batchGetRepositoryScanningConfiguration,
  completeLayerUpload,
  createPullThroughCacheRule,
  createRepository,
  createRepositoryCreationTemplate,
  deleteLifecyclePolicy,
  deletePullThroughCacheRule,
  deleteRegistryPolicy,
  deleteRepository,
  deleteRepositoryCreationTemplate,
  deleteRepositoryPolicy,
  deleteSigningConfiguration,
  deregisterPullTimeUpdateExclusion,
  describeImageReplicationStatus,
  describeImageScanFindings,
  describeImageSigningStatus,
  describeImages,
  describePullThroughCacheRules,
  describeRegistry,
  describeRepositories,
  describeRepositoryCreationTemplates,
  getAccountSetting,
  getAuthorizationToken,
  getDownloadUrlForLayer,
  getLifecyclePolicy,
  getLifecyclePolicyPreview,
  getRegistryPolicy,
  getRegistryScanningConfiguration,
  getRepositoryPolicy,
  getSigningConfiguration,
  initiateLayerUpload,
  listImageReferrers,
  listImages,
  listPullTimeUpdateExclusions,
  listTagsForResource,
  putAccountSetting,
  putImage,
  putImageScanningConfiguration,
  putImageTagMutability,
  putLifecyclePolicy,
  putRegistryPolicy,
  putRegistryScanningConfiguration,
  putReplicationConfiguration,
  putSigningConfiguration,
  registerPullTimeUpdateExclusion,
  setRepositoryPolicy,
  startImageScan,
  startLifecyclePolicyPreview,
  tagResource,
  untagResource,
  updateImageStorageClass,
  updatePullThroughCacheRule,
  updateRepositoryCreationTemplate,
  uploadLayerPart,
  validatePullThroughCacheRule,
};
