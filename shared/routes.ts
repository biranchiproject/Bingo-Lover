import { z } from 'zod';
import { insertUserSchema, insertRoomSchema, users, rooms } from './schema';

export const errorSchemas = {
  notFound: z.object({ message: z.string() }),
  conflict: z.object({ message: z.string() }),
};

export const api = {
  users: {
    createOrUpdate: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        201: z.custom<typeof users.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:uid',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  rooms: {
    create: {
      method: 'POST' as const,
      path: '/api/rooms',
      input: z.object({ hostId: z.string() }),
      responses: {
        201: z.object({ code: z.string() }),
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/rooms/join',
      input: z.object({ code: z.string(), uid: z.string() }),
      responses: {
        200: z.object({ code: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
