import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {

  fastify.get('/', async function (request, reply): Promise<MemberTypeEntity[]> {
    return await fastify.db.memberTypes.findMany()
  });

  fastify.get('/:id', { schema: { params: idParamSchema, }, },


    async function (request, reply): Promise<void | null | MemberTypeEntity> {
      if (!['basic', 'business'].includes(request.params.id)) {
        reply.notFound('member type not found')
      }

      const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: request.params.id });
      if (memberType) {
        return memberType;
      }
      reply.notFound(`member type not found`)
    }
  );

  fastify.patch('/:id', { schema: { body: changeMemberTypeBodySchema, params: idParamSchema, }, },

    async function (request, reply): Promise<MemberTypeEntity> {
      if (!['basic', 'business'].includes(request.params.id)) {
        reply.badRequest('member type not found')
      }
      return await fastify.db.memberTypes.change(request.params.id, request.body);

    }
  );
};

export default plugin;
