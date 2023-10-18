import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql'
import { ApolloServer, gql } from 'apollo-server-express'
import { PubSub } from 'graphql-subscriptions'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { graphqlUploadExpress } from 'graphql-upload';
import typeDefs from './api/lib/typeDefs'
import resolvers from './api/lib/resolvers'
import express from 'express'
import path from 'path'
import morgan from 'morgan'
import cors from 'cors'
import indexRoutes from './api/lib/router'
(async () => {
    // config ports
// config ports
    const GRAPHQL_PORT = process.env.NODE_ENV === 'production' ? 3000 : 4000;

    const pubsub = new PubSub();

    // Initialization apps
    const app = express();
    // Middleware
    app.use(
      cors({
        methods: ['GET', 'POST'],
        origin: [
          process.env.WEB_CLIENT,
          process.env.WEB_ADMIN_STORE,
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://localhost:3004',
          'https://eatsy-client.vercel.app',
          'https://front-back-server.onrender.com' // Add your domain here
        ],
        credentials: true
      })
    )
    app.use(morgan('dev'))
    app.use(express.json({ limit: '50mb' }))
    app.use(graphqlUploadExpress({ maxFileSize: 1000000000, maxFiles: 10 }))
    const httpServer = createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const server = new ApolloServer({
        // schema,
        typeDefs, resolvers,
        introspection: true,
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
        context: ({
          req,
          res,
          connection
        }) => {
            if (connection) {
              const { restaurant } = connection.context || {};
              return { pubsub, restaurant };
            } else {
              const token = (req.headers.authorization);
              if (token !== 'null') {
                try {
                  const User = null;
                  return { User, res, pubsub }
                } catch (err) {
                  console.log(err);
                  console.log('Hola esto es un error del contexto');
                }
              }
              return { pubsub };
            }
          },
    });
    await server.start();
    server.applyMiddleware({ app });
    SubscriptionServer.create(
        {
            schema,
            execute,
            subscribe,
            onConnect: (connectionParams, webSocket, context) => {
              console.log(connectionParams)
              if (connectionParams?.headers?.restaurant || connectionParams?.restaurant) {
                const restaurant = connectionParams?.headers?.restaurant ?? connectionParams.restaurant ;
                console.log("connection", restaurant);
                return { pubsub, restaurant };
              }
              throw new Error("Restaurant not provided in connection params");
            },
        },
        {
            server:
            httpServer,
            path:
            server.graphqlPath
        }
    );

    httpServer.listen(GRAPHQL_PORT, () => {
        console.log(
            `🚀 Query endpoint ready at http://localhost:${GRAPHQL_PORT}${server.graphqlPath}`
        );
        console.log(
            `🚀 Subscription endpoint ready at ws://localhost:${GRAPHQL_PORT}${server.graphqlPath}`
        );
    });
})();
