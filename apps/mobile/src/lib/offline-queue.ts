import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "sanson_offline_queue";

export interface QueuedRequest {
  id: string;
  path: string;
  method: string;
  body?: string;
  createdAt: string;
}

export async function enqueue(item: Omit<QueuedRequest, "id" | "createdAt">) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedRequest[] = raw ? JSON.parse(raw) : [];
  queue.push({
    ...item,
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushQueue(
  executor: (item: QueuedRequest) => Promise<boolean>
): Promise<number> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedRequest[] = raw ? JSON.parse(raw) : [];
  const remaining: QueuedRequest[] = [];
  let done = 0;
  for (const item of queue) {
    const ok = await executor(item);
    if (ok) done += 1;
    else remaining.push(item);
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return done;
}

export async function cacheSet(key: string, value: unknown) {
  await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(value));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`cache:${key}`);
  return raw ? (JSON.parse(raw) as T) : null;
}
