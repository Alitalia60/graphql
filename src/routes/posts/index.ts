import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { isUUID } from '../../utils/validators';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {

  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await this.db.posts.findMany()
  });

  fastify.get('/:id', { schema: { params: idParamSchema, }, },

    async function (request, reply): Promise<void | null | PostEntity> {

      if (!isUUID(request.params.id)) {
        reply.notFound('requests id isn`t UUID')
      }

      const post = await this.db.posts.findOne({ key: 'id', equals: request.params.id });
      if (post) {
        return post;
      }
      reply.notFound(`id: ${request.params.id} not found`)
    }
  );

  fastify.post('/', { schema: { body: createPostBodySchema, }, },

    async function (request, reply): Promise<void | null | PostEntity> {

      const user = await this.db.users.findOne({ key: 'id', equals: request.body.userId });

      if (user) {
        return await this.db.posts.create(request.body)
      }
      reply.notFound('user id not found');
    }
  );

  fastify.delete('/:id', { schema: { params: idParamSchema, }, },

    async function (request, reply): Promise<void | null | PostEntity> {

      if (!isUUID(request.params.id)) {
        reply.badRequest('requests id isn`t UUID')
      }

      const post = await this.db.posts.findOne({ key: 'id', equals: request.params.id });
      if (post) {
        return await this.db.posts.delete(request.params.id);
      }
      reply.notFound(`post id not found`)
    }
  );

  fastify.patch('/:id', { schema: { body: changePostBodySchema, params: idParamSchema, }, },

    async function (request, reply): Promise<void | null | PostEntity> {
      if (!isUUID(request.params.id)) {
        reply.badRequest('requests id isn`t UUID')
      }

      const post = await this.db.posts.findOne({ key: 'id', equals: request.params.id });
      if (post) {
        return await this.db.posts.change(request.params.id, request.body);
      }
      reply.notFound(`post id not found`)

    }
  );
};

export default plugin;
