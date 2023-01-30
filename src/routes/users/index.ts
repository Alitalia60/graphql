import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

import { isUUID } from '../../utils/validators';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {

  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await this.db.users.findMany()
  });


  fastify.get('/:id', { schema: { params: idParamSchema, } },
    async function (request, reply): Promise<void | null | UserEntity> {

      if (!isUUID(request.params.id)) {
        reply.notFound('requests id isn`t UUID')
      }

      const user = await this.db.users.findOne({ key: 'id', equals: request.params.id });
      if (user) {
        return user;
      }

      reply.notFound(`user not found`)
    }
  );

  fastify.post('/', { schema: { body: createUserBodySchema, }, },

    async function (request, reply): Promise<UserEntity> {
      return this.db.users.create(request.body)
    }
  );

  fastify.delete('/:id', { schema: { params: idParamSchema, }, },

    async function (request, reply): Promise<void | null | UserEntity> {
      if (!isUUID(request.params.id)) {
        reply.badRequest('requests id isn`t UUID')
      }

      const user = await this.db.users.findOne({ key: 'id', equals: request.params.id });
      if (user) {

        await deleteUserProfile(user.id);
        await deleteUserPosts(user.id);
        await deleteSuscribedTo(user.id);
        return await this.db.users.delete(request.params.id);
      }
      reply.notFound(`user not found`)
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },

    async function (request, reply): Promise<void | null | UserEntity> {
      if (!isUUID(request.body.userId)) {
        reply.notFound('body`s id isn`t UUID')
      }

      if (!isUUID(request.params.id)) {
        reply.notFound('requests id isn`t UUID')
      }
      const userSubscribeTo = await this.db.users.findOne({ key: 'id', equals: request.body.userId });
      const user = await this.db.users.findOne({ key: 'id', equals: request.params.id });
      if (user && userSubscribeTo) {
        if (!userSubscribeTo.subscribedToUserIds.includes(user.id)) {
          const newList = userSubscribeTo.subscribedToUserIds;
          const recordIndex = newList.findIndex(item => item === user.id);
          if (recordIndex === -1) {
            newList.push(user.id)
            this.db.users.change(userSubscribeTo.id, { subscribedToUserIds: newList });
          }
          return userSubscribeTo;
        }
      } else {
        reply.notFound(`user not found`)
      }
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<void | null | UserEntity> {
      if (!isUUID(request.body.userId)) {
        reply.notFound('body`s id isn`t UUID')
      }

      if (!isUUID(request.params.id)) {
        reply.notFound('requests id isn`t UUID')
      }
      const userSubscribeFrom = await this.db.users.findOne({ key: 'id', equals: request.body.userId });
      const user = await this.db.users.findOne({ key: 'id', equals: request.params.id });
      if (user && userSubscribeFrom) {

        const newList = userSubscribeFrom.subscribedToUserIds;

        if (!newList.includes(user.id)) {
          reply.badRequest(`user is not folower`)
        }
        return await this.db.users.change(userSubscribeFrom.id, { subscribedToUserIds: newList.filter(item => item !== user.id) });

      } else {
        reply.notFound(`user not found`)
      }
    }
  );

  fastify.patch('/:id', { schema: { body: changeUserBodySchema, params: idParamSchema, }, },

    async function (request, reply): Promise<void | null | UserEntity> {
      if (!isUUID(request.params.id)) {
        reply.badRequest('requests id isn`t UUID')
      }

      const user = await this.db.users.findOne({ key: 'id', equals: request.params.id });
      if (user) {
        return await this.db.users.change(request.params.id, request.body);
      }
      reply.notFound(`user not found`)
    }
  );

  async function deleteUserProfile(userId: string) {
    const profile = await fastify.db.profiles.findOne({ key: 'userId', equals: userId });
    if (profile) {
      await fastify.db.profiles.delete(profile.id);
    }
  };

  async function deleteUserPosts(userId: string) {
    const posts = await fastify.db.posts.findMany({ key: 'userId', equals: userId });
    if (posts.length) {
      posts.forEach(async (post) => {
        await fastify.db.posts.delete(post.id);//=> item.userId !== userId);
      });
    }
  };

  async function deleteSuscribedTo(userId: string) {
    const followerList = await fastify.db.users.findMany({ key: 'subscribedToUserIds', inArray: userId });
    if (followerList.length) {
      followerList.forEach(async (follower) => {
        const newList = follower.subscribedToUserIds.filter(item => item !== userId);
        await fastify.db.users.change(follower.id, { subscribedToUserIds: newList })
      })
    }
  };


};




export default plugin;
