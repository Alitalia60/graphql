import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

import { isUUID } from '../../utils/validators';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {

  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return await this.db.profiles.findMany()
  });

  fastify.get('/:id', { schema: { params: idParamSchema, }, },

    async function (request, reply): Promise<void | ProfileEntity | null> {

      if (!isUUID(request.params.id)) {
        reply.notFound(`profile id not found`)
      }

      const profile = await this.db.profiles.findOne({ key: 'id', equals: request.params.id });
      if (profile) {
        return profile
      }
      reply.notFound(`profile id not found`)
    }
  );

  fastify.post('/', { schema: { body: createProfileBodySchema, }, },

    async function (request, reply): Promise<void | null | ProfileEntity> {

      if (!isUUID(request.body.userId)) {
        reply.badRequest('requests id isn`t UUID')
      }

      if (!['basic', 'biseness'].includes(request.body.memberTypeId)) {
        reply.badRequest('bad memberType')
      }

      const user = await this.db.users.findOne({ key: 'id', equals: request.body.userId });
      if (!user) {
        reply.badRequest('user id not found');
      }

      const profile = await this.db.profiles.findOne({ key: 'userId', equals: request.body.userId });
      if (!profile) {
        return await this.db.profiles.create(request.body)
      } else {
        reply.badRequest('profile already exists');
      }


    }
  );

  fastify.delete('/:id', { schema: { params: idParamSchema, }, },

    async function (request, reply): Promise<void | null | ProfileEntity> {
      if (!isUUID(request.params.id)) {
        reply.badRequest('requests id isn`t UUID')
      }

      const profile = await this.db.profiles.findOne({ key: 'id', equals: request.params.id });
      if (profile) {
        return await this.db.profiles.delete(request.params.id)
      }
      reply.notFound(`profile id not found`)
    }
  );

  fastify.patch('/:id', { schema: { body: changeProfileBodySchema, params: idParamSchema, }, },

    async function (request, reply): Promise<void | null | ProfileEntity> {
      if (!isUUID(request.params.id)) {
        reply.badRequest('requests id isn`t UUID')
      }

      const profile = await this.db.profiles.findOne({ key: 'id', equals: request.params.id });
      if (profile) {
        return this.db.profiles.change(request.params.id, request.body)
      }
      reply.notFound(`profile id not found`)
    }
  );
};

export default plugin;
