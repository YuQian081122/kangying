/**
 * 本地檔案系統儲存模組
 * 所有資料（JSON、圖片、備份）統一存放在 DATA_DIR 下
 * 讀取失敗時回傳靜態備援資料，避免頁面崩潰
 */
import { cache } from "react"
import { mkdir, readFile, writeFile, copyFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { BRANDS, PRODUCTS } from "@/lib/products"

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data")
const JSON_DIR = join(DATA_DIR, "json")
const BACKUP_DIR = join(DATA_DIR, "backups")

const BRANDS_PATH = join(JSON_DIR, "brands.json")
const PRODUCTS_PATH = join(JSON_DIR, "products.json")
const PAGE_LAYOUTS_PATH = join(JSON_DIR, "page-layouts.json")

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf-8")
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const dir = filePath.replace(/[/\\][^/\\]+$/, "")
  await ensureDir(dir)
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
}

function getBackupTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-")
}

/**
 * 初始化資料目錄：若 JSON 不存在，從 lib/*.json 複製過來
 */
async function initDataDir(): Promise<void> {
  await ensureDir(JSON_DIR)
  await ensureDir(BACKUP_DIR)
  await ensureDir(join(DATA_DIR, "uploads"))

  if (!existsSync(BRANDS_PATH)) {
    const libBrands = join(process.cwd(), "lib", "brands.json")
    if (existsSync(libBrands)) {
      await copyFile(libBrands, BRANDS_PATH)
    } else {
      await writeJsonFile(BRANDS_PATH, BRANDS)
    }
  }

  if (!existsSync(PRODUCTS_PATH)) {
    const libProducts = join(process.cwd(), "lib", "products.json")
    if (existsSync(libProducts)) {
      await copyFile(libProducts, PRODUCTS_PATH)
    } else {
      await writeJsonFile(PRODUCTS_PATH, PRODUCTS)
    }
  }

  if (!existsSync(PAGE_LAYOUTS_PATH)) {
    await writeJsonFile(PAGE_LAYOUTS_PATH, {})
  }
}

let initialized = false
async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await initDataDir()
    initialized = true
  }
}

export async function backupProductsData(data: unknown[]): Promise<void> {
  await ensureInitialized()
  const stamp = getBackupTimestamp()
  const fileName = `products-${stamp}.json`
  const backupPath = join(BACKUP_DIR, fileName)

  try {
    await writeJsonFile(backupPath, data)
  } catch (error) {
    console.warn("Products backup failed (non-blocking):", error)
  }
}

export async function backupBrandsData(data: unknown[]): Promise<void> {
  await ensureInitialized()
  const stamp = getBackupTimestamp()
  const fileName = `brands-${stamp}.json`
  const backupPath = join(BACKUP_DIR, fileName)

  try {
    await writeJsonFile(backupPath, data)
  } catch (error) {
    console.warn("Brands backup failed (non-blocking):", error)
  }
}

export const getBrandsData = cache(async (): Promise<unknown[]> => {
  await ensureInitialized()
  try {
    const data = await readJsonFile<unknown[]>(BRANDS_PATH)
    if (data && Array.isArray(data)) return data
    return Array.isArray(BRANDS) ? BRANDS : []
  } catch {
    return Array.isArray(BRANDS) ? BRANDS : []
  }
})

export async function saveBrandsData(data: unknown[]): Promise<void> {
  await ensureInitialized()
  await backupBrandsData(data)
  await writeJsonFile(BRANDS_PATH, data)
}

export const getProductsData = cache(async (): Promise<unknown[]> => {
  await ensureInitialized()
  try {
    const data = await readJsonFile<unknown[]>(PRODUCTS_PATH)
    if (data && Array.isArray(data)) return data
    return Array.isArray(PRODUCTS) ? PRODUCTS : []
  } catch {
    return Array.isArray(PRODUCTS) ? PRODUCTS : []
  }
})

export async function saveProductsData(data: unknown[]): Promise<void> {
  await ensureInitialized()
  await backupProductsData(data)
  await writeJsonFile(PRODUCTS_PATH, data)
}

export async function getPageLayouts(): Promise<Record<string, unknown>> {
  await ensureInitialized()
  try {
    const data = await readJsonFile<Record<string, unknown>>(PAGE_LAYOUTS_PATH)
    return data && typeof data === "object" ? data : {}
  } catch {
    return {}
  }
}

export async function getPageLayout(key: string): Promise<unknown | null> {
  const layouts = await getPageLayouts()
  return layouts[key] ?? null
}

export async function savePageLayout(key: string, layout: unknown): Promise<void> {
  await ensureInitialized()
  const layouts = await getPageLayouts()
  layouts[key] = layout
  await writeJsonFile(PAGE_LAYOUTS_PATH, layouts)
}

export async function deletePageLayout(key: string): Promise<void> {
  await ensureInitialized()
  const layouts = await getPageLayouts()
  delete layouts[key]
  await writeJsonFile(PAGE_LAYOUTS_PATH, layouts)
}

export function getDataDir(): string {
  return DATA_DIR
}

export function getUploadsDir(): string {
  return join(DATA_DIR, "uploads")
}
