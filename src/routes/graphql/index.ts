import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { GraphQLFloat, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString, graphql } from 'graphql';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

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
        },
      },

      usersProfile: {
        type: Profile,
        args: {},
        resolve(parent) {
          return fastify.db.profiles.findOne({ key: 'userId', equals: parent.id })
        }
      },

      usersPosts: {
        type: new GraphQLList(Post),
        args: {},
        resolve(parent) {
          return fastify.db.posts.findMany({ key: 'userId', equals: parent.id })
        }
      },
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
      userId: { type: GraphQLString },

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
      userId: { type: GraphQLString },
    }),
  })


  const RootQuery = new GraphQLObjectType({
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

      getUserbyId: {
        type: User,
        args: { id: { type: GraphQLString! } },
        async resolve(parent, args, contextValue) {
          const user = await fastify.db.users.findOne({ key: 'id', equals: args.id });
          if (user) {
            contextValue.response.notFound(`user not found`)
          }
          return fastify.db.users.findOne({ key: 'id', equals: args.id ? args.id : contextValue.vars.userId })
        }
      },

      getPosts: {
        type: new GraphQLList(Post),
        resolve() {
          return fastify.db.posts.findMany()
        }
      },

      getPostById: {
        type: Post,
        args: {
          postId: { type: GraphQLString },
        },
        async resolve(parent, args, contextValue) {
          if (contextValue.vars.postId) {
            args.postId = contextValue.vars.postId;
          }
          return fastify.db.posts.findOne({ key: 'id', equals: args.postId })
        }
      },

      getPostByUserId: {
        type: new GraphQLList(Post),
        args: {
          userId: { type: GraphQLString },
        },
        async resolve(parent, args, contextValue) {
          if (contextValue.vars.id) {
            args.id = contextValue.vars.id;
          }
          const user = await fastify.db.users.findOne({ key: 'id', equals: args.id });
          if (user) {
            contextValue.response.notFound(`user not found`)
          }

          return fastify.db.posts.findMany({ key: 'userId', equals: args.userId ? args.userId : contextValue.vars.userId })
        }
      },

      getProfiles: {
        type: new GraphQLList(Profile),
        args: {},
        resolve(parent, args) {
          return fastify.db.profiles.findMany()
        }
      },

      getProfileById: {
        type: Profile,
        args: {
          id: { type: GraphQLString },
        },
        resolve(parent, args, contextValue) {
          return fastify.db.profiles.findOne({ key: 'id', equals: args.id ? args.id : contextValue.vars.profileId })
        }
      },

      getProfileByUserId: {
        type: Profile,
        args: {
          id: { type: GraphQLString },
        },
        async resolve(parent, args, contextValue) {
          if (contextValue.vars.id) {
            args.id = contextValue.vars.id;
          }
          const user = await fastify.db.users.findOne({ key: 'id', equals: args.id });
          if (user) {
            contextValue.response.notFound(`user not found`)
          }

          return fastify.db.profiles.findOne({ key: 'userId', equals: args.id ? args.userId : contextValue.vars.userId })
        }
      },

      getMemberTypes: {
        type: new GraphQLList(MemberType),
        args: {},
        resolve(parent, args) {
          return fastify.db.memberTypes.findMany()
        }
      },

      // getMemberTypeById: {
      //   type: MemberType,
      //   args: { id: { type: GraphQLString } },
      //   resolve(parent, args, contextValue) {
      //     return fastify.db.memberTypes.findOne({ key: 'id', equals: args.id ? args.id : contextValue.vars.memberTypeId })
      //   }
      // },


    }
  });

  // const inputUserData = new GraphQLInputObjectType({
  //   name: "UserData",
  //   fields: {
  //     firstName: { type: GraphQLString },
  //     lastName: { type: GraphQLString },
  //     email: { type: GraphQLString },
  //   },
  // });

  // const inputProfileData = new GraphQLInputObjectType({
  //   name: "inputProfileData",
  //   fields: {
  //     avatar: { type: GraphQLString },
  //     sex: { type: GraphQLString },
  //     birthday: { type: GraphQLFloat },
  //     country: { type: GraphQLString },
  //     street: { type: GraphQLString },
  //     city: { type: GraphQLString },
  //     userId: { type: GraphQLString },
  //     memberTypeId: { type: GraphQLString, defaultValue: 'basic' },
  //   },
  // });

  const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      addUser: {
        type: User,
        args: {
          firstName: { type: GraphQLString },
          lastName: { type: GraphQLString },
          email: { type: GraphQLString }
        },

        async resolve(parent, args, contextValue) {
          if (!contextValue.vars) {
            return await fastify.db.users.create(args)
          }
          return await fastify.db.users.create(contextValue.vars)
        }
      },

      addProfile: {
        type: Profile,
        args: {
          // avatar: { type: GraphQLString },
          // sex: { type: GraphQLString },
          // birthday: { type: GraphQLFloat },
          // country: { type: GraphQLString },
          // street: { type: GraphQLString },
          // city: { type: GraphQLString },
          userId: { type: GraphQLString },
          // memberTypeId: { type: GraphQLString },
        },
        async resolve(parent, args) {
          return await fastify.db.profiles.create(args)
        }
      },

      addPost: {
        type: Post,
        args: {
          title: { type: GraphQLString },
          content: { type: GraphQLString },
          userId: { type: GraphQLString },
        },
        async resolve(parent, args, contextValue) {
          if (contextValue.vars.userId) {
            args.userId = contextValue.vars.userId;
          }
          return await fastify.db.posts.create(args)
        }
      },

      addSubscribedToUserIds: {

        type: User,
        args: {
          id: { type: GraphQLString },
          userId: { type: GraphQLString }
        },
        async resolve(parent, args, contextValue) {
          if (contextValue.vars.id) {
            args.id = contextValue.vars.id;
          }
          if (contextValue.vars.userId) {
            args.userId = contextValue.vars.userId;
          }

          const userSubscribeTo = await fastify.db.users.findOne({ key: 'id', equals: args.userId });
          const user = await fastify.db.users.findOne({ key: 'id', equals: args.id });
          if (user) {
            contextValue.response.notFound(`user not found`)
          }

          if (user && userSubscribeTo) {
            if (!userSubscribeTo.subscribedToUserIds.includes(user.id)) {
              const newList = userSubscribeTo.subscribedToUserIds;
              const recordIndex = newList.findIndex(item => item === user.id);
              if (recordIndex === -1) {
                newList.push(user.id)
                fastify.db.users.change(userSubscribeTo.id, { subscribedToUserIds: newList });
              }
              return user;

            }
          } else {
            contextValue.response.notFound(`user not found`)
          }


        }
      },

      // NOTE: for test purposes ONLY createUserFullData
      createUserFullData: {
        type: User,
        args: {
          firstName: { type: GraphQLString },
          lastName: { type: GraphQLString },
          email: { type: GraphQLString },
        },
        async resolve(parent, args) {
          const user = await fastify.db.users.create(args);
          const inputProfileData: Omit<ProfileEntity, 'id'> = {
            avatar: `some avatar ${user.firstName}`,
            sex: 'male',
            birthday: 54646546546,
            country: 'USA',
            street: '23 avenue',
            city: 'New-York',
            memberTypeId: 'basic',
            userId: user.id
          }

          await fastify.db.profiles.create(inputProfileData);

          const inputPostData = {
            title: `Post title of user id: ${user.firstName}`,
            content: `Content of user id: ${user.firstName}`,
            userId: user.id
          };

          await fastify.db.posts.create(inputPostData);

          return user
        }
      },


    }
  })

  const GqlSchema = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation

  });


  fastify.post('/', { schema: { body: graphqlBodySchema, }, },

    async function (request, reply) {
      return await graphql({
        schema: GqlSchema,
        source: String(request.body.query),
        contextValue: { response: reply, vars: request.body.variables },

      });
    }
  );
};

export default plugin;
