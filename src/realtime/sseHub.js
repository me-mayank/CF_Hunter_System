const clients = new Map();

/**
 * Register a new SSE connection for a handle
 */
export function addClient(handle, res) {
  const normalized = handle.toLowerCase();
  if (!clients.has(normalized)) {
    clients.set(normalized, new Set());
  }
  clients.get(normalized).add(res);
}

/**
 * Remove an SSE connection
 */
export function removeClient(handle, res) {
  const normalized = handle.toLowerCase();
  const set = clients.get(normalized);
  if (set) {
    set.delete(res);
    if (set.size === 0) {
      clients.delete(normalized);
    }
  }
}

/**
 * Emit an event to all clients listening to a specific handle
 */
export function emitEvent(handle, stage, payload = null) {
  const normalized = handle.toLowerCase();
  const set = clients.get(normalized);
  
  if (set) {
    const data = JSON.stringify({ stage, payload });
    for (const res of set) {
      res.write(`data: ${data}\n\n`);
    }
  }
}
