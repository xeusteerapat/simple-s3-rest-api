import { FromSchema } from 'json-schema-to-ts';
import { type JSONSchema } from 'json-schema-to-ts';

export const envSchema = {
  type: 'object',
  required: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
  properties: {
    PORT: {
      type: 'string',
      default: '3000',
    },
    AWS_REGION: {
      type: 'string',
      default: 'us-east-1',
    },
    AWS_ACCESS_KEY_ID: {
      type: 'string',
    },
    AWS_SECRET_ACCESS_KEY: {
      type: 'string',
    },
  },
} as const satisfies JSONSchema;

export type EnvSchema = FromSchema<typeof envSchema>;
