"use strict";

var _apolloServerCore = require("apollo-server-core");
var _http = require("http");
var _graphql = require("graphql");
var _apolloServerExpress = require("apollo-server-express");
var _graphqlSubscriptions = require("graphql-subscriptions");
var _subscriptionsTransportWs = require("subscriptions-transport-ws");
var _schema = require("@graphql-tools/schema");
var _graphqlUpload = require("graphql-upload");
var _typeDefs = _interopRequireDefault(require("./api/lib/typeDefs"));
var _resolvers = _interopRequireDefault(require("./api/lib/resolvers"));
var _express = _interopRequireDefault(require("express"));
var _path = _interopRequireDefault(require("path"));
var _morgan = _interopRequireDefault(require("morgan"));
var _cors = _interopRequireDefault(require("cors"));
var _router = _interopRequireDefault(require("./api/lib/router"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
(async () => {
  // config ports
  // config ports
  const GRAPHQL_PORT = process.env.NODE_ENV === 'production' ? 3000 : 4000;
  const pubsub = new _graphqlSubscriptions.PubSub();

  // Initialization apps
  const app = (0, _express.default)();
  // Middleware
  app.use((0, _morgan.default)('dev'));
  app.use(_express.default.json({
    limit: '50mb'
  }));
  app.use((0, _graphqlUpload.graphqlUploadExpress)({
    maxFileSize: 1000000000,
    maxFiles: 10
  }));
  const httpServer = (0, _http.createServer)(app);
  const schema = (0, _schema.makeExecutableSchema)({
    typeDefs: _typeDefs.default,
    resolvers: _resolvers.default
  });
  const server = new _apolloServerExpress.ApolloServer({
    // schema,
    typeDefs: _typeDefs.default,
    resolvers: _resolvers.default,
    introspection: true,
    plugins: [(0, _apolloServerCore.ApolloServerPluginLandingPageGraphQLPlayground)()],
    context: ({
      req,
      res,
      connection
    }) => {
      if (connection) {
        const {
          restaurant
        } = connection.context || {};
        return {
          pubsub,
          restaurant
        };
      } else {
        const token = req.headers.authorization;
        if (token !== 'null') {
          try {
            const User = null;
            return {
              User,
              res,
              pubsub
            };
          } catch (err) {
            console.log(err);
            console.log('Hola esto es un error del contexto');
          }
        }
        return {
          pubsub
        };
      }
    }
  });
  await server.start();
  server.applyMiddleware({
    app
  });
  _subscriptionsTransportWs.SubscriptionServer.create({
    schema,
    execute: _graphql.execute,
    subscribe: _graphql.subscribe,
    onConnect: (connectionParams, webSocket, context) => {
      console.log(connectionParams);
      if (connectionParams?.headers?.restaurant || connectionParams?.restaurant) {
        const restaurant = connectionParams?.headers?.restaurant ?? connectionParams.restaurant;
        console.log("connection", restaurant);
        return {
          pubsub,
          restaurant
        };
      }
      throw new Error("Restaurant not provided in connection params");
    }
  }, {
    server: httpServer,
    path: server.graphqlPath
  });
  httpServer.listen(GRAPHQL_PORT, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${GRAPHQL_PORT}${server.graphqlPath}`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${GRAPHQL_PORT}${server.graphqlPath}`);
  });
})();