import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  getObjectResponseSchema,
  getObjectByKeySchema,
} from '../schemas/bucket-schema.ts';
import {
  BucketParams,
  ObjectParams,
  ListObjectsQuery,
  GetObjectQuery,
} from '../types/aws.ts';
import { ObjectResponse, ListObjectsResponse } from '../types/aws.ts';
import { Readable } from 'stream';

export const registerObjectRoutes = (
  server: FastifyInstance,
  s3Client: S3Client
): void => {
  server.get<{
    Params: BucketParams;
    Querystring: ListObjectsQuery;
  }>(
    '/api/buckets/:bucketName/objects',
    {
      schema: getObjectResponseSchema,
    },
    async (request, reply): Promise<void> => {
      try {
        const { bucketName } = request.params;
        const { prefix, maxKeys = '1000', continuationToken } = request.query;

        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          MaxKeys: parseInt(maxKeys, 10),
          ContinuationToken: continuationToken,
        });

        const response = await s3Client.send(command);

        const objects: ObjectResponse[] = (response.Contents || []).map(
          (object) => ({
            key: object.Key,
            size: object.Size,
            lastModified: object.LastModified,
            eTag: object.ETag,
            storageClass: object.StorageClass,
          })
        );

        const result: ListObjectsResponse = {
          success: true,
          bucket: bucketName,
          prefix: prefix || null,
          isTruncated: response.IsTruncated,
          nextContinuationToken: response.NextContinuationToken,
          count: objects.length,
          objects: objects,
        };

        reply.send(result);
      } catch (error) {
        request.log.error(error);
        throw error;
      }
    }
  );

  server.get<{
    Params: ObjectParams;
    Querystring: GetObjectQuery;
  }>(
    '/api/buckets/:bucketName/objects/:objectKey(.*)',
    {
      schema: getObjectByKeySchema,
    },
    async (request, reply): Promise<void> => {
      try {
        const { bucketName } = request.params;
        let { objectKey } = request.params;
        const { download } = request.query;

        objectKey = decodeURIComponent(objectKey);

        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });

        const response = await s3Client.send(command);

        if (response.ContentType) {
          reply.header('Content-Type', response.ContentType);
        }

        if (response.ContentLength) {
          reply.header('Content-Length', response.ContentLength);
        }

        if (download === 'true') {
          const filename = objectKey.split('/').pop() || 'download';
          reply.header(
            'Content-Disposition',
            `attachment; filename="${filename}"`
          );
        }

        if (response.Body instanceof Readable) {
          return reply.send(response.Body);
        } else {
          const buffer = await response.Body?.transformToByteArray();
          if (buffer) {
            return reply.send(Buffer.from(buffer));
          }
        }

        reply.code(204).send();
      } catch (error) {
        request.log.error(error);
        throw error;
      }
    }
  );
};
