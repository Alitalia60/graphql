import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { graphql, buildSchema } from 'graphql';

// buildSchema(тут заранее нам нужно написать всю типи который требует ТЗ)
// rootValue(тут все резолверы типа функций который приносит данные по запросу)
// graphql({schema, source: тут запросы из постмана, rootValue})

// buildSchema()

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {

  fastify.post('/', { schema: { body: graphqlBodySchema, }, },

    async function (request, reply) {
      const q = request.body.query;
      reply.header("content-type", "application/json");

      reply.send(graphql())
    }
  );
};

export default plugin;
