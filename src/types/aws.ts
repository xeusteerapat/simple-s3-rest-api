export type BucketParams = {
  bucketName: string;
};

export type ObjectParams = BucketParams & {
  objectKey: string;
};

export type ListObjectsQuery = {
  prefix?: string;
  maxKeys?: string;
  continuationToken?: string;
};

export type GetObjectQuery = {
  download?: string;
};

export type BucketResponse = {
  name: string;
  creationDate?: Date;
};

export type ListBucketsResponse = {
  success: boolean;
  count: number;
  buckets: BucketResponse[];
};

export type ObjectResponse = {
  key?: string;
  size?: number;
  lastModified?: Date;
  eTag?: string;
  storageClass?: string;
};

export type ListObjectsResponse = {
  success: boolean;
  bucket: string;
  prefix: string | null;
  isTruncated?: boolean;
  nextContinuationToken?: string;
  count: number;
  objects: ObjectResponse[];
};
