import {MongoClient} from 'mongodb';

// Read-only: never seeds data or prints the connection string/password.
const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error('MONGODB_URI is missing. Set it in .env.local or the deployment environment.');
  process.exitCode = 1;
} else {
  let client;
  try {
    client = new MongoClient(uri, {serverSelectionTimeoutMS: 7000, connectTimeoutMS: 7000, maxPoolSize: 1});
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'khushi_shop');
    await db.command({ping: 1});
    const topology = await db.command({hello: 1});
    if (!topology.setName && topology.msg !== 'isdbgrid') {
      throw Object.assign(new Error(), {code: 'REPLICA_SET_REQUIRED'});
    }
    console.log('MongoDB connected. Replica set/sharded topology supports checkout transactions.');
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error('JWT_SECRET must contain at least 32 characters before accounts can work.');
      process.exitCode = 1;
    }
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 10 || process.env.ADMIN_PASSWORD.length > 128) {
      console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (10–128 characters) to enable administrator login.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.code === 'REPLICA_SET_REQUIRED'
      ? 'Checkout requires a replica set. Use Atlas or configure a local replica set.'
      : 'MongoDB check failed. Verify the Atlas URI, percent-encoded password, database user permissions, cluster status, DNS and network access list.');
    process.exitCode = 1;
  } finally {
    await client?.close();
  }
}
