import { PrismaClient } from '@prisma/client';

/**
 * The single shared Prisma client instance. This lives in its own module
 * — separate from index.ts — specifically so that importing `prisma`
 * from anywhere (route handlers, services, tests) does NOT also trigger
 * index.ts's top-level side effects (env validation that can
 * process.exit, app.listen() binding a real port, the market refresh
 * background job's setInterval, etc).
 *
 * Before this split, every unit test that needed `prisma` transitively
 * imported the entire running server, which both bound a real port
 * during `node --test` and kept the process alive forever via
 * setInterval — the test run would hang indefinitely. Importing only
 * what you need (a DB client) instead of an entire app module is also
 * just better separation of concerns regardless of testing.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
