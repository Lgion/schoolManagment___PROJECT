import mongoose from 'mongoose';
import { auth } from '@clerk/nextjs/server';

const URI_MAIN = process.env.MONGODB_URI;
const URI_SAMPLE = process.env.MONGODB_sample_URI;

let cachedMain = global.mongooseMainUtils;
let cachedSample = global.mongooseSampleUtils;

if (!cachedMain) {
  cachedMain = global.mongooseMainUtils = { conn: null, promise: null };
}
if (!cachedSample) {
  cachedSample = global.mongooseSampleUtils = { conn: null, promise: null };
}

async function dbConnect() {
  let useSample = false;
  try {
    const authObj = await auth();
    if (!authObj || !authObj.userId) {
      useSample = true;
    }
  } catch (error) {}

  const MONGODB_URI = useSample && URI_SAMPLE ? URI_SAMPLE : (URI_MAIN || 'mongodb://localhost:27017/lpd');
  const cacheToUse = useSample && URI_SAMPLE ? cachedSample : cachedMain;

  if (cacheToUse.conn) {
    return cacheToUse.conn;
  }

  if (!cacheToUse.promise) {
    console.log('[UTILS DB] Connect -> ' + (useSample ? 'SAMPLE DB' : 'MAIN DB'));
    cacheToUse.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongooseInst) => {
      return mongooseInst;
    });
  }
  
  cacheToUse.conn = await cacheToUse.promise;
  return cacheToUse.conn;
}

export default dbConnect;
