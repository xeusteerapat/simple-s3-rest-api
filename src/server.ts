import { S3Client } from '@aws-sdk/client-s3';
import fastifyEnv from '@fastify/env';
import fastifySensible from '@fastify/sensible';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { registerBucketRoutes } from './routes/buckets.ts';
import { registerObjectRoutes } from './routes/objects.ts';
import { EnvSchema, envSchema } from './schemas/env-schema.ts';

declare module 'fastify' {
  export interface FastifyInstance {
    config: EnvSchema;
  }
}

export const buildServer = async () => {
  const server = fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
      },
    },
  });

  await server.register(fastify, {
    prefix: '/api',
  });

  await server.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
    confKey: 'config',
  });

  await server.register(fastifySensible);

  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Simple S3 API',
        description: 'Rest API for interacting with AWS S3',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
          },
        },
      },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
  });

  const s3Client = new S3Client({
    region: server.config.AWS_REGION,
    credentials: {
      accessKeyId: server.config.AWS_ACCESS_KEY_ID,
      secretAccessKey: server.config.AWS_SECRET_ACCESS_KEY,
    },
  });

  server.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      request.log.error(error);

      reply.status(error.statusCode || 500).send({
        success: false,
        message: error.message || 'An internal server error occurred',
        code: error.code || 'INTERNAL_SERVER_ERROR',
      });
    }
  );

  server.get('/hello', {}, (_, reply: FastifyReply) => {
    reply.send({
      message: 'hi',
    });
  });

  registerBucketRoutes(server, s3Client);
  registerObjectRoutes(server, s3Client);

  return server;
};
