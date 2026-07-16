import abortMultipartUpload from "./abortMultipartUpload";
import completeMultipartUpload from "./completeMultipartUpload";
import copyObject from "./copyObject";
import createBucket from "./createBucket";
import createBucketMetadataConfiguration from "./createBucketMetadataConfiguration";
import createBucketMetadataTableConfiguration from "./createBucketMetadataTableConfiguration";
import createMultipartUpload from "./createMultipartUpload";
import createSession from "./createSession";
import deleteBucket from "./deleteBucket";
import deleteBucketAnalyticsConfiguration from "./deleteBucketAnalyticsConfiguration";
import deleteBucketCors from "./deleteBucketCors";
import deleteBucketEncryption from "./deleteBucketEncryption";
import deleteBucketIntelligentTieringConfiguration from "./deleteBucketIntelligentTieringConfiguration";
import deleteBucketInventoryConfiguration from "./deleteBucketInventoryConfiguration";
import deleteBucketLifecycle from "./deleteBucketLifecycle";
import deleteBucketMetadataConfiguration from "./deleteBucketMetadataConfiguration";
import deleteBucketMetadataTableConfiguration from "./deleteBucketMetadataTableConfiguration";
import deleteBucketMetricsConfiguration from "./deleteBucketMetricsConfiguration";
import deleteBucketOwnershipControls from "./deleteBucketOwnershipControls";
import deleteBucketPolicy from "./deleteBucketPolicy";
import deleteBucketReplication from "./deleteBucketReplication";
import deleteBucketTagging from "./deleteBucketTagging";
import deleteBucketWebsite from "./deleteBucketWebsite";
import deleteObject from "./deleteObject";
import deleteObjectTagging from "./deleteObjectTagging";
import deleteObjects from "./deleteObjects";
import deletePublicAccessBlock from "./deletePublicAccessBlock";
import getBucketAbac from "./getBucketAbac";
import getBucketAccelerateConfiguration from "./getBucketAccelerateConfiguration";
import getBucketAcl from "./getBucketAcl";
import getBucketAnalyticsConfiguration from "./getBucketAnalyticsConfiguration";
import getBucketCors from "./getBucketCors";
import getBucketEncryption from "./getBucketEncryption";
import getBucketIntelligentTieringConfiguration from "./getBucketIntelligentTieringConfiguration";
import getBucketInventoryConfiguration from "./getBucketInventoryConfiguration";
import getBucketLifecycleConfiguration from "./getBucketLifecycleConfiguration";
import getBucketLocation from "./getBucketLocation";
import getBucketLogging from "./getBucketLogging";
import getBucketMetadataConfiguration from "./getBucketMetadataConfiguration";
import getBucketMetadataTableConfiguration from "./getBucketMetadataTableConfiguration";
import getBucketMetricsConfiguration from "./getBucketMetricsConfiguration";
import getBucketNotificationConfiguration from "./getBucketNotificationConfiguration";
import getBucketOwnershipControls from "./getBucketOwnershipControls";
import getBucketPolicy from "./getBucketPolicy";
import getBucketPolicyStatus from "./getBucketPolicyStatus";
import getBucketReplication from "./getBucketReplication";
import getBucketRequestPayment from "./getBucketRequestPayment";
import getBucketTagging from "./getBucketTagging";
import getBucketVersioning from "./getBucketVersioning";
import getBucketWebsite from "./getBucketWebsite";
import getObject from "./getObject";
import getObjectAcl from "./getObjectAcl";
import getObjectAttributes from "./getObjectAttributes";
import getObjectLegalHold from "./getObjectLegalHold";
import getObjectLockConfiguration from "./getObjectLockConfiguration";
import getObjectRetention from "./getObjectRetention";
import getObjectTagging from "./getObjectTagging";
import getObjectTorrent from "./getObjectTorrent";
import getPublicAccessBlock from "./getPublicAccessBlock";
import headBucket from "./headBucket";
import headObject from "./headObject";
import listBucketAnalyticsConfigurations from "./listBucketAnalyticsConfigurations";
import listBucketIntelligentTieringConfigurations from "./listBucketIntelligentTieringConfigurations";
import listBucketInventoryConfigurations from "./listBucketInventoryConfigurations";
import listBucketMetricsConfigurations from "./listBucketMetricsConfigurations";
import listBuckets from "./listBuckets";
import listDirectoryBuckets from "./listDirectoryBuckets";
import listMultipartUploads from "./listMultipartUploads";
import listObjectVersions from "./listObjectVersions";
import listObjects from "./listObjects";
import listObjectsV2 from "./listObjectsV2";
import listParts from "./listParts";
import putBucketAbac from "./putBucketAbac";
import putBucketAccelerateConfiguration from "./putBucketAccelerateConfiguration";
import putBucketAcl from "./putBucketAcl";
import putBucketAnalyticsConfiguration from "./putBucketAnalyticsConfiguration";
import putBucketCors from "./putBucketCors";
import putBucketEncryption from "./putBucketEncryption";
import putBucketIntelligentTieringConfiguration from "./putBucketIntelligentTieringConfiguration";
import putBucketInventoryConfiguration from "./putBucketInventoryConfiguration";
import putBucketLifecycleConfiguration from "./putBucketLifecycleConfiguration";
import putBucketLogging from "./putBucketLogging";
import putBucketMetricsConfiguration from "./putBucketMetricsConfiguration";
import putBucketNotificationConfiguration from "./putBucketNotificationConfiguration";
import putBucketOwnershipControls from "./putBucketOwnershipControls";
import putBucketPolicy from "./putBucketPolicy";
import putBucketReplication from "./putBucketReplication";
import putBucketRequestPayment from "./putBucketRequestPayment";
import putBucketTagging from "./putBucketTagging";
import putBucketVersioning from "./putBucketVersioning";
import putBucketWebsite from "./putBucketWebsite";
import putObject from "./putObject";
import putObjectAcl from "./putObjectAcl";
import putObjectLegalHold from "./putObjectLegalHold";
import putObjectLockConfiguration from "./putObjectLockConfiguration";
import putObjectRetention from "./putObjectRetention";
import putObjectTagging from "./putObjectTagging";
import putPublicAccessBlock from "./putPublicAccessBlock";
import renameObject from "./renameObject";
import restoreObject from "./restoreObject";
import selectObjectContent from "./selectObjectContent";
import updateBucketMetadataInventoryTableConfiguration from "./updateBucketMetadataInventoryTableConfiguration";
import updateBucketMetadataJournalTableConfiguration from "./updateBucketMetadataJournalTableConfiguration";
import updateObjectEncryption from "./updateObjectEncryption";
import uploadPart from "./uploadPart";
import uploadPartCopy from "./uploadPartCopy";
import writeGetObjectResponse from "./writeGetObjectResponse";

export const blocks = {
  abortMultipartUpload,
  completeMultipartUpload,
  copyObject,
  createBucket,
  createBucketMetadataConfiguration,
  createBucketMetadataTableConfiguration,
  createMultipartUpload,
  createSession,
  deleteBucket,
  deleteBucketAnalyticsConfiguration,
  deleteBucketCors,
  deleteBucketEncryption,
  deleteBucketIntelligentTieringConfiguration,
  deleteBucketInventoryConfiguration,
  deleteBucketLifecycle,
  deleteBucketMetadataConfiguration,
  deleteBucketMetadataTableConfiguration,
  deleteBucketMetricsConfiguration,
  deleteBucketOwnershipControls,
  deleteBucketPolicy,
  deleteBucketReplication,
  deleteBucketTagging,
  deleteBucketWebsite,
  deleteObject,
  deleteObjectTagging,
  deleteObjects,
  deletePublicAccessBlock,
  getBucketAbac,
  getBucketAccelerateConfiguration,
  getBucketAcl,
  getBucketAnalyticsConfiguration,
  getBucketCors,
  getBucketEncryption,
  getBucketIntelligentTieringConfiguration,
  getBucketInventoryConfiguration,
  getBucketLifecycleConfiguration,
  getBucketLocation,
  getBucketLogging,
  getBucketMetadataConfiguration,
  getBucketMetadataTableConfiguration,
  getBucketMetricsConfiguration,
  getBucketNotificationConfiguration,
  getBucketOwnershipControls,
  getBucketPolicy,
  getBucketPolicyStatus,
  getBucketReplication,
  getBucketRequestPayment,
  getBucketTagging,
  getBucketVersioning,
  getBucketWebsite,
  getObject,
  getObjectAcl,
  getObjectAttributes,
  getObjectLegalHold,
  getObjectLockConfiguration,
  getObjectRetention,
  getObjectTagging,
  getObjectTorrent,
  getPublicAccessBlock,
  headBucket,
  headObject,
  listBucketAnalyticsConfigurations,
  listBucketIntelligentTieringConfigurations,
  listBucketInventoryConfigurations,
  listBucketMetricsConfigurations,
  listBuckets,
  listDirectoryBuckets,
  listMultipartUploads,
  listObjectVersions,
  listObjects,
  listObjectsV2,
  listParts,
  putBucketAbac,
  putBucketAccelerateConfiguration,
  putBucketAcl,
  putBucketAnalyticsConfiguration,
  putBucketCors,
  putBucketEncryption,
  putBucketIntelligentTieringConfiguration,
  putBucketInventoryConfiguration,
  putBucketLifecycleConfiguration,
  putBucketLogging,
  putBucketMetricsConfiguration,
  putBucketNotificationConfiguration,
  putBucketOwnershipControls,
  putBucketPolicy,
  putBucketReplication,
  putBucketRequestPayment,
  putBucketTagging,
  putBucketVersioning,
  putBucketWebsite,
  putObject,
  putObjectAcl,
  putObjectLegalHold,
  putObjectLockConfiguration,
  putObjectRetention,
  putObjectTagging,
  putPublicAccessBlock,
  renameObject,
  restoreObject,
  selectObjectContent,
  updateBucketMetadataInventoryTableConfiguration,
  updateBucketMetadataJournalTableConfiguration,
  updateObjectEncryption,
  uploadPart,
  uploadPartCopy,
  writeGetObjectResponse,
};
