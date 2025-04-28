import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import fastifyEnv from '@fastify/env';
import fastifySensible from '@fastify/sensible';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { registerBucketRoutes } from './routes/buckets.ts';
import { registerObjectRoutes } from './routes/objects.ts';
import { EnvSchema, envSchema } from './schemas/env-schema.ts';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

	await server.register(cors);
	await server.register(multipart);

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

	server.get('/upload', {}, (_, reply: FastifyReply) => {
		reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="https://matcha.mizu.sh/matcha.css">
          <meta charset="utf-8"><title>Upload APK</title>
        </head>
        <body>
          <h1>Upload APK to S3</h1>
          <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="apk" accept=".apk" required />
            <button type="submit">Upload</button>
          </form>
        </body>
      </html>
    `);
	});

	server.post('/upload', async (request, reply) => {
		const part = await request.file({
			limits: {
				fieldSize: 500 * 1024 * 1024,
			},
		});

		if (!part) {
			return reply.status(400).send({
				error: 'No Such file',
			});
		}

		const key = `uploads/${Date.now()}-${part.filename}`;

		await s3Client.send(
			new PutObjectCommand({
				Bucket: 'NEED_TO_REPLACE',
				Key: key,
				Body: part.file, // Readable stream
				ContentType: 'application/vnd.android.package-archive',
				ACL: 'private',
			})
		);

		const getCmd = new GetObjectCommand({
			Bucket: 'NEED_TO_REPLACE',
			Key: key,
		});

		const url = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });

		reply.send({ downloadUrl: url });
	});

	registerBucketRoutes(server, s3Client);
	registerObjectRoutes(server, s3Client);

	return server;
};
