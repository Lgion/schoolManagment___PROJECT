import mongoose from 'mongoose';
import { headers } from 'next/headers';
import { AsyncLocalStorage } from 'node:async_hooks';

// Stockage local asynchrone pour suivre le tenant (base de données) de la requête en cours
const tenantStorage = new AsyncLocalStorage();

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = {
    prodConn: null,
    prodPromise: null,
    sandboxConn: null,
    sandboxPromise: null,
    registeredSchemas: {}
  };
}

// Surcharge globale et sécurisée de mongoose.model
if (!global.mongooseModelPatched) {
  global.mongooseModelPatched = true;

  const originalModel = mongoose.model.bind(mongoose);

  mongoose.model = function (name, schema, collection) {
    if (schema) {
      cached.registeredSchemas[name] = schema;
    }

    const originalModelInstance = originalModel(name, schema, collection);

    return new Proxy(originalModelInstance, {
      get(target, prop) {
        let conn = null;
        
        // Récupérer le tenant de manière synchrone et thread-safe sans appeler headers()
        const store = tenantStorage.getStore();
        if (store?.useSandbox) {
          conn = cached.sandboxConn;
        }

        if (conn) {
          let sandboxModel = conn.models[name];
          if (!sandboxModel) {
            const schemaToUse = cached.registeredSchemas[name] || originalModelInstance.schema;
            sandboxModel = conn.model(name, schemaToUse);
          }
          
          const value = sandboxModel[prop];
          if (typeof value === 'function') {
            return value.bind(sandboxModel);
          }
          return value;
        }

        const value = target[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      },

      set(target, prop, value) {
        let conn = null;
        
        const store = tenantStorage.getStore();
        if (store?.useSandbox) {
          conn = cached.sandboxConn;
        }

        if (conn) {
          let sandboxModel = conn.models[name];
          if (!sandboxModel) {
            const schemaToUse = cached.registeredSchemas[name] || originalModelInstance.schema;
            sandboxModel = conn.model(name, schemaToUse);
          }
          sandboxModel[prop] = value;
          return true;
        }

        target[prop] = value;
        return true;
      }
    });
  };
}

async function dbConnect() {
  const URI_PROD = process.env.MONGODB_URI || process.env.MONGODB_sample_URI;
  const URI_SANDBOX = process.env.MONGODB_SANDBOX_URI;

  if (!URI_PROD) {
    throw new Error("CRITICAL CONFIGURATION ERROR: MONGODB_URI is not defined.");
  }
  if (!URI_SANDBOX) {
    throw new Error("CRITICAL CONFIGURATION ERROR: MONGODB_SANDBOX_URI is not defined.");
  }

  const options = {
    bufferCommands: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  };

  // 1. Connexion Production (Default Mongoose Connection)
  if (!cached.prodPromise) {
    console.log("[MONGODB_CONN] Connecting to Production Database...");
    cached.prodPromise = mongoose.connect(URI_PROD, options).then((mongooseInstance) => {
      console.log("✅ Connected to MongoDB Production (Default)");
      cached.prodConn = mongooseInstance.connection;
      return mongooseInstance.connection;
    }).catch(err => {
      console.error('❌ MongoDB Production Connection Error:', err.message);
      cached.prodPromise = null;
      throw err;
    });
  }

  // 2. Connexion Sandbox (Dedicated Connection Pool)
  if (!cached.sandboxPromise) {
    console.log("[MONGODB_CONN] Connecting to Sandbox Database...");
    cached.sandboxPromise = mongoose.createConnection(URI_SANDBOX, options).asPromise().then((conn) => {
      console.log("✅ Connected to MongoDB Sandbox (Pool)");
      cached.sandboxConn = conn;
      return conn;
    }).catch(err => {
      console.error('❌ MongoDB Sandbox Connection Error:', err.message);
      cached.sandboxPromise = null;
      throw err;
    });
  }

  // Attendre que les connexions soient établies
  await Promise.all([cached.prodPromise, cached.sandboxPromise]);

  // Déterminer le tenant de manière asynchrone et sécurisée en attendant headers()
  let useSandbox = false;
  try {
    const headersList = await headers(); // Awaiting headers() correctly!
    const tenantDb = headersList.get('x-tenant-db');
    useSandbox = (tenantDb === 'sandbox');
  } catch (e) {
    useSandbox = false;
  }

  // Enregistrer le tenant dans le stockage local asynchrone pour toutes les requêtes de ce contexte
  tenantStorage.enterWith({ useSandbox });

  return useSandbox ? cached.sandboxConn : cached.prodConn;
}

export default dbConnect;
