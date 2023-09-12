"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setALogoStore = exports.pushNotificationOrder = exports.default = void 0;
var _graphqlSubscriptions = require("graphql-subscriptions");
const pubsub = new _graphqlSubscriptions.PubSub(); //create a PubSub instance

const setALogoStore = async (_root, {
  logo,
  idStore
}, ctx) => {
  try {
    const fileUpload = await logo;
    const {
      createReadStream,
      filename,
      mimetype
    } = fileUpload;
    // saveImages()
    const fileStream = createReadStream();
    return {
      success: true,
      message: 'Logo subido con éxito'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Lo sentimos ha ocurrido un error vuelve a intentarlo'
    };
  }
};
exports.setALogoStore = setALogoStore;
const NEW_STORE_ORDER = 'NEW_STORE_ORDER';
let token = '';
const resolvers = {
  Subscription: {
    newStoreOrder: {
      subscribe: (0, _graphqlSubscriptions.withFilter)((_, __, ctx) => {
        token = ctx.restaurant;
        return pubsub.asyncIterator(`${NEW_STORE_ORDER}`);
      }, (payload, ctx) => {
        const restaurant = token;
        return payload.newStoreOrder.idStore === restaurant;
      })
    }
  }
};
const pushNotificationOrder = async (_root, {
  pCodeRef,
  idStore
}, ctx) => {
  // hacer la query para obtener la orden
  const order = {
    pdpId: 'sample-pdpId',
    id: 'sample-id',
    idStore: idStore,
    pId: 'sample-pId',
    ppState: 'sample-ppState',
    pCodeRef: pCodeRef,
    pPDate: 'sample-pPDate',
    pSState: 'sample-pSState',
    pPStateP: 'sample-pPStateP',
    payMethodPState: 'sample-payMethodPState',
    pPRecoger: false,
    totalProductsPrice: 13423,
    unidProducts: 13423,
    pDatCre: 'sample-pDatCre',
    pDatMod: 'sample-pDatMod'
  };
  // publicar el evento de nueva orden de tienda
  pubsub.publish(`${NEW_STORE_ORDER}`, {
    newStoreOrder: order,
    ctx
  });
  return order;
};
exports.pushNotificationOrder = pushNotificationOrder;
var _default = {
  TYPES: {},
  QUERIES: {
    pushNotificationOrder
  },
  MUTATIONS: {
    setALogoStore
  },
  SUBSCRIPTIONS: {
    ...resolvers.Subscription
  }
};
exports.default = _default;