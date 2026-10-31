import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {fetchAssetBytes} from './download.mjs';

async function server(t, handler) {
  const instance = createServer(handler);
  await new Promise(resolve => instance.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    instance.closeAllConnections();
    await new Promise(resolve => instance.close(resolve));
  });
  return `http://127.0.0.1:${instance.address().port}`;
}

test('a body that stalls after headers is aborted, with bounded retry', {timeout: 2000}, async t => {
  let requests = 0;
  const url = await server(t, (_request, response) => {
    requests++;
    response.writeHead(200, {'Content-Type': 'application/octet-stream'});
    response.flushHeaders();
    response.write('partial');
  });
  await assert.rejects(fetchAssetBytes(url, {timeoutMs: 60, attempts: 2, retryDelayMs: 1}), /Failed to download/);
  assert.equal(requests, 2);
});

test('complete bytes survive chunked responses and failed attempts', async t => {
  let requests = 0;
  const url = await server(t, (_request, response) => {
    if (++requests === 1) {response.writeHead(503); response.end(); return;}
    response.writeHead(200);
    response.write(Buffer.from([0, 1, 255]));
    response.end(Buffer.from([42, 0]));
  });
  const bytes = await fetchAssetBytes(url, {timeoutMs: 1000, attempts: 2, retryDelayMs: 1});
  assert.deepEqual(bytes, Buffer.from([0, 1, 255, 42, 0]));
  assert.equal(requests, 2);
});
