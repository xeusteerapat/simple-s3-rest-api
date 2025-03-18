import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { getBucketsResponseSchema } from '../schemas/bucket-schema.ts';
import { BucketResponse, ListBucketsResponse } from '../types/aws.ts';

export const registerBucketRoutes = (
  server: FastifyInstance,
  s3Client: S3Client
): void => {
  server.get(
    '/api/buckets',
    {
      schema: getBucketsResponseSchema,
    },
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);

        const bucketList: BucketResponse[] = (response.Buckets || []).map(
          (bucket) => ({
            name: bucket.Name || '',
            creationDate: bucket.CreationDate,
          })
        );

        const result: ListBucketsResponse = {
          success: true,
          count: bucketList.length,
          buckets: bucketList,
        };

        reply.send(result);
      } catch (error) {
        request.log.error(error);
        throw error;
      }
    }
  );
};
