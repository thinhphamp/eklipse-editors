// Run `worker` over `items` with up to `max` at once; stop taking new items once `shouldStop()` is true.
export async function runPool(items, max, worker, shouldStop = () => false) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(max, queue.length) }, async () => {
    while (queue.length && !shouldStop()) await worker(queue.shift());
  }));
}
