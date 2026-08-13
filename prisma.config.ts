import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://tatovacesta:secure_password_dev3@postgres_dev3:5432/tatovacesta_dev3?schema=public',
  },
});
