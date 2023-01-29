import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
// import { GraphQLFloat, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { GraphQLFloat, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString, graphql } from 'graphql';

// buildSchema(тут заранее нам нужно написать всю типи который требует ТЗ)
// rootValue(тут все резолверы типа функций который приносит данные по запросу)
// graphql({schema, source: тут запросы из постмана, rootValue})

// buildSchema()

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {

  const User: GraphQLObjectType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: GraphQLString },
      firstName: { type: GraphQLString },
      lastName: { type: GraphQLString },
      email: { type: GraphQLString },
      subscribedToUserIds: {
        type: new GraphQLList(User),
        args: {},
        resolve(parent, args) {
          return fastify.db.users.findMany({ key: 'subscribedToUserIds', inArray: parent.id })
        }
      }
    }),
  })

  const Profile: GraphQLObjectType = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
      id: { type: GraphQLString },
      avatar: { type: GraphQLString },
      sex: { type: GraphQLString },
      birthday: { type: GraphQLFloat },
      country: { type: GraphQLString },
      street: { type: GraphQLString },
      city: { type: GraphQLString },
      memberTypeId: {
        type: MemberType,
        resolve(parent,) {
          return fastify.db.memberTypes.findOne({ key: 'id', equals: parent.memberTypeId })
        }
      },
      userId: { type: User },

    }),
  })

  const MemberType: GraphQLObjectType = new GraphQLObjectType({
    name: 'MemberTypes',
    fields: () => ({
      id: { type: GraphQLString },
      discount: { type: GraphQLInt },
      monthPostsLimit: { type: GraphQLInt }
    }),
  })

  const Post: GraphQLObjectType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: GraphQLString },
      title: { type: GraphQLString },
      content: { type: GraphQLString },
      userId: { type: User },
    }),
  })

  // const usersQueries = new GraphQLObjectType({
  //   name: 'usersQueries',
  //   description: 'All users queries',
  //   fields: {
  //     getAll: {
  //       type: new GraphQLList(User),
  //       resolve(parent, args) {
  //         return fastify.db.users.findMany()
  //       }
  //     }
  //   }
  // })

  const RootQuery = new GraphQLObjectType(
    {
      name: 'AllQuery',
      description: 'none',
      fields: {
        getUsers: {
          type: new GraphQLList(User),
          args: {},
          resolve(parent, args) {
            return fastify.db.users.findMany()
          }
        },

        getUser: {
          type: User,
          args: { idOne: { type: GraphQLString } },
          resolve(parent, args) {
            return fastify.db.users.findOne({ key: 'id', equals: args.idOne })
          }
        },

        getPosts: {
          type: new GraphQLList(Post),
          args: { id: { type: GraphQLString } },
          resolve(parent, args) {
            return fastify.db.posts.findMany({ key: 'userId', equals: args.id })
          }
        },

        getProfiles: {
          type: new GraphQLList(Profile),
          args: {},
          resolve(parent, args) {
            return fastify.db.profiles.findMany()
          }
        },

        getProfile: {
          type: Profile,
          args: { id: { type: GraphQLString } },
          resolve(parent, args) {
            return fastify.db.profiles.findOne({ key: 'userId', equals: args.id })
          }
        },

        getMemberTypes: {
          type: new GraphQLList(MemberType),
          args: {},
          resolve(parent, args) {
            return fastify.db.memberTypes.findMany()
          }
        },

      }
    }
  );

  const GqlSchema = new GraphQLSchema({
    query: RootQuery,

  });

  // const resolver = {
  //   users: async (props: any) => {
  //     console.log(props);
  //   },
  // };

  fastify.post('/', { schema: { body: graphqlBodySchema, }, },

    async function (request, reply) {
      return await graphql({
        schema: GqlSchema,
        source: String(request.body.query),
        contextValue: fastify,
        // rootValue: resolver,
      });
    }
  );
};

export default plugin;
