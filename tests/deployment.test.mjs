import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/index.mjs';

test('Readiness rejects missing configuration and malformed MongoDB URIs without leaking secrets', async () => {
  const previous = {...process.env};
  async function request(url) {
    const res = {statusCode: 200, setHeader() {}, end(value) {this.data = JSON.parse(value)}};
    await handler({url, method: 'GET', headers: {}}, res);
    return res;
  }
  try {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    assert.equal((await request('/api/health')).data.databaseConfigured, false);
    assert.equal((await request('/api/ready')).statusCode, 503);
    process.env.JWT_SECRET = 'x'.repeat(48);
    assert.equal((await request('/api/ready')).statusCode, 503);
    process.env.MONGODB_URI = 'invalid-uri-secret-password';
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await request('/api/ready');
      assert.equal(res.statusCode, 503);
      assert.match(res.data.error, /Database unavailable/);
      assert.ok(!res.data.error.includes(process.env.MONGODB_URI));
    }
  } finally {
    for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
