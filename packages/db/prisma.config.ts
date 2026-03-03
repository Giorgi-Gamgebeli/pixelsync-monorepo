import { defineConfig } from '@prisma/config';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the monorepo root
dotenv.config({ path: path.join(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
});
