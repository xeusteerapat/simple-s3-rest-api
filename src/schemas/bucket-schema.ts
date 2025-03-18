export const getBucketsResponseSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        count: { type: 'integer' },
        buckets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              creationDate: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
};

export const getObjectResponseSchema = {
  params: {
    type: 'object',
    required: ['bucketName'],
    properties: {
      bucketName: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      prefix: { type: 'string' },
      maxKeys: { type: 'string', pattern: '^[0-9]+$' },
      continuationToken: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        bucket: { type: 'string' },
        prefix: { type: 'string', nullable: true },
        isTruncated: { type: 'boolean' },
        nextContinuationToken: { type: 'string', nullable: true },
        count: { type: 'integer' },
        objects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              size: { type: 'integer' },
              lastModified: { type: 'string', format: 'date-time' },
              eTag: { type: 'string' },
              storageClass: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const getObjectByKeySchema = {
  params: {
    type: 'object',
    properties: {
      bucketName: { type: 'string' },
      objectKey: { type: 'string' },
    },
    required: ['bucketName', 'objectKey'],
  },
  querystring: {
    type: 'object',
    properties: {
      download: { type: 'string', enum: ['true', 'false'] },
    },
  },
};
