/* eslint-disable no-console */

const API_URL = 'http://localhost:4000/api/products';
const TOTAL_REQUESTS = 100;
const CONCURRENCY = 10;

async function makeRequest(id: number) {
  const start = Date.now();
  try {
    const res = await fetch(API_URL);
    const duration = Date.now() - start;
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return { id, duration, success: true };
  } catch (error) {
    return { id, duration: Date.now() - start, success: false, error: (error as Error).message };
  }
}

async function runLoadTest() {
  console.log(`Starting load test: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrent...`);

  const results = [];
  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);

  for (let i = 0; i < batches; i++) {
    const promises = [];
    for (let j = 0; j < CONCURRENCY; j++) {
      const id = i * CONCURRENCY + j;
      if (id < TOTAL_REQUESTS) {
        promises.push(makeRequest(id));
      }
    }
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    process.stdout.write('.');
  }

  console.log('\n\nTest Completed.');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const durations = successful.map((r) => r.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const max = Math.max(...durations);
  const min = Math.min(...durations);

  console.log('--- Results ---');
  if (failed.length > 0) {
    console.log('Last Error:', failed[failed.length - 1].error);
  }
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Avg Duration: ${avg.toFixed(2)}ms`);
  console.log(`Min Duration: ${min}ms`);
  console.log(`Max Duration: ${max}ms`);
}

runLoadTest().catch(console.error);
