import { createClient } from "@libsql/client"
import path from "path"
import { randomUUID } from "crypto"

const DB_URL =
  process.env.NODE_ENV === "production"
    ? "file:/opt/foundry/foundry.db"
    : `file:${path.join(process.cwd(), "foundry-dev.db")}`

let _db: ReturnType<typeof createClient> | null = null
export function getDbClient() {
  if (!_db) _db = createClient({ url: DB_URL })
  return _db
}

export async function initDb() {
  await getDbClient().execute(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      openai_key    TEXT,
      anthropic_key TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

export type DbUser = {
  id:            string
  email:         string
  name:          string
  password_hash: string
  role:          string
  openai_key:    string | null
  anthropic_key: string | null
  created_at:    string
}

export const userDb = {
  count: async (): Promise<number> => {
    await initDb()
    const r = await getDbClient().execute("SELECT COUNT(*) as c FROM users")
    return Number(r.rows[0]?.c ?? 0)
  },

  findByEmail: async (email: string): Promise<DbUser | null> => {
    await initDb()
    const r = await getDbClient().execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] })
    return (r.rows[0] as unknown as DbUser) ?? null
  },

  findById: async (id: string): Promise<DbUser | null> => {
    await initDb()
    const r = await getDbClient().execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] })
    return (r.rows[0] as unknown as DbUser) ?? null
  },

  all: async (): Promise<DbUser[]> => {
    await initDb()
    const r = await getDbClient().execute("SELECT * FROM users ORDER BY created_at")
    return r.rows as unknown as DbUser[]
  },

  create: async (data: {
    email: string; name: string; passwordHash: string; role?: string
  }): Promise<DbUser> => {
    await initDb()
    const id = randomUUID()
    await getDbClient().execute({
      sql:  "INSERT INTO users (id, email, name, password_hash, role) VALUES (?,?,?,?,?)",
      args: [id, data.email, data.name, data.passwordHash, data.role ?? "user"],
    })
    return (await userDb.findById(id))!
  },

  updateKeys: async (id: string, keys: { openaiKey?: string; anthropicKey?: string }) => {
    await initDb()
    if (keys.openaiKey !== undefined) {
      await getDbClient().execute({ sql: "UPDATE users SET openai_key = ? WHERE id = ?", args: [keys.openaiKey || null, id] })
    }
    if (keys.anthropicKey !== undefined) {
      await getDbClient().execute({ sql: "UPDATE users SET anthropic_key = ? WHERE id = ?", args: [keys.anthropicKey || null, id] })
    }
  },

  delete: async (id: string) => {
    await initDb()
    await getDbClient().execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] })
  },
}
