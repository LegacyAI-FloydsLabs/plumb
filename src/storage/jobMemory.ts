// ==========================================================================
// IndexedDB Job Memory — persists plumbing tool calculations as named jobs.
// Uses raw IndexedDB (no external dependency) for zero new deps.
// ==========================================================================

export interface JobRecord {
  id: string;
  name: string;
  tool: string;
  inputs: Record<string, unknown>;
  output: unknown;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  notes: string;
}

const DB_NAME = "plumb-jobs";
const DB_VERSION = 1;
const STORE = "jobs";

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("tool", "tool", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => {
    const t = db.transaction(STORE, mode);
    return t.objectStore(STORE);
  });
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveJob(
  job: Omit<JobRecord, "id" | "createdAt" | "updatedAt">,
): Promise<JobRecord> {
  const store = await tx("readwrite");
  const now = Date.now();
  const record: JobRecord = {
    ...job,
    id: uid(),
    createdAt: now,
    updatedAt: now,
    tags: job.tags ?? [],
    notes: job.notes ?? "",
  };
  await promisifyRequest(store.put(record));
  return record;
}

export async function getJob(id: string): Promise<JobRecord | null> {
  const store = await tx("readonly");
    const result = await promisifyRequest(store.get(id)) as unknown as JobRecord | undefined;
  return result ?? null;
}

export async function listJobs(options?: {
  tool?: string;
  limit?: number;
  offset?: number;
}): Promise<JobRecord[]> {
  const store = await tx("readonly");
  const all = await promisifyRequest(store.getAll());

  let jobs: JobRecord[] = all ?? [];
  if (options?.tool) {
    jobs = jobs.filter((j) => j.tool === options.tool);
  }
  jobs.sort((a, b) => b.createdAt - a.createdAt);

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? jobs.length;
  return jobs.slice(offset, offset + limit);
}

export async function deleteJob(id: string): Promise<void> {
  const store = await tx("readwrite");
  await promisifyRequest(store.delete(id));
}

export async function updateJob(
  id: string,
  patch: Partial<Pick<JobRecord, "name" | "tags" | "notes" | "output">>,
): Promise<JobRecord> {
  const store = await tx("readwrite");
    const existing = (await promisifyRequest(store.get(id))) as JobRecord | undefined;
  if (!existing) throw new Error(`Job ${id} not found`);
  const updated: JobRecord = { ...existing, ...patch, updatedAt: Date.now() };
  await promisifyRequest(store.put(updated));
  return updated;
}

export async function exportAll(): Promise<string> {
  const store = await tx("readonly");
  const all = await promisifyRequest(store.getAll());
  return JSON.stringify(all ?? [], null, 2);
}

export async function clearAll(): Promise<void> {
  const store = await tx("readwrite");
  await promisifyRequest(store.clear());
}
