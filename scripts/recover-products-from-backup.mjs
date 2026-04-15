#!/usr/bin/env node
import { readFile, writeFile, copyFile, mkdir } from "fs/promises"
import { resolve, join } from "path"
import { existsSync } from "fs"

function parseArgs(argv) {
  const args = {
    file: "",
    apply: false,
    allowCoreOverwrite: false,
    restoreUploads: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const cur = argv[i]
    if (cur === "--file") args.file = argv[i + 1] || ""
    if (cur === "--apply") args.apply = true
    if (cur === "--allow-core-overwrite") args.allowCoreOverwrite = true
    if (cur === "--restore-uploads") args.restoreUploads = true
  }

  return args
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function mergeProducts(currentProducts, backupProducts, allowCoreOverwrite) {
  const backupById = new Map(
    backupProducts
      .filter((p) => p && typeof p === "object" && typeof p.id === "string")
      .map((p) => [p.id, p])
  )

  let changedCount = 0
  let detailLayoutRecovered = 0
  let detailHtmlRecovered = 0

  const merged = currentProducts.map((current) => {
    const fromBackup = backupById.get(current.id)
    if (!fromBackup) return current

    const next = clone(current)
    let changed = false

    if (fromBackup.detailLayout && !next.detailLayout) {
      next.detailLayout = fromBackup.detailLayout
      detailLayoutRecovered += 1
      changed = true
    }

    if (typeof fromBackup.detailContentHtml === "string" && !next.detailContentHtml) {
      next.detailContentHtml = fromBackup.detailContentHtml
      detailHtmlRecovered += 1
      changed = true
    }

    if (allowCoreOverwrite) {
      const coreKeys = ["name", "brand", "description", "images"]
      for (const key of coreKeys) {
        if (fromBackup[key] !== undefined) {
          next[key] = fromBackup[key]
          changed = true
        }
      }
    }

    if (changed) changedCount += 1
    return next
  })

  return { merged, changedCount, detailLayoutRecovered, detailHtmlRecovered }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.file) {
    console.error("使用方式:")
    console.error("  node scripts/recover-products-from-backup.mjs --file <備份路徑>")
    console.error("")
    console.error("選項:")
    console.error("  --file <path>            備份檔路徑（.json 或備份目錄）")
    console.error("  --apply                  執行寫入（預設為 dry-run）")
    console.error("  --allow-core-overwrite   允許覆蓋名稱、品牌等核心欄位")
    console.error("  --restore-uploads        同時還原 uploads 目錄")
    process.exit(1)
  }

  const dataDir = process.env.DATA_DIR || join(process.cwd(), "data")
  const jsonDir = join(dataDir, "json")
  const uploadsDir = join(dataDir, "uploads")

  const backupInput = resolve(process.cwd(), args.file)

  let backupProductsPath
  let backupUploadsDir

  if (backupInput.endsWith(".json")) {
    backupProductsPath = backupInput
  } else if (existsSync(join(backupInput, "json", "products.json"))) {
    backupProductsPath = join(backupInput, "json", "products.json")
    backupUploadsDir = join(backupInput, "uploads")
  } else {
    backupProductsPath = backupInput
  }

  const productsPath = join(jsonDir, "products.json")

  const fallbackLibPath = join(process.cwd(), "lib", "products.json")
  const currentPath = existsSync(productsPath) ? productsPath : fallbackLibPath

  const backupRaw = await readFile(backupProductsPath, "utf-8")
  const currentRaw = await readFile(currentPath, "utf-8")
  const backupProducts = JSON.parse(backupRaw)
  const currentProducts = JSON.parse(currentRaw)

  if (!Array.isArray(backupProducts) || !Array.isArray(currentProducts)) {
    throw new Error("備份檔或目前 products.json 格式錯誤（應為陣列）")
  }

  const result = mergeProducts(currentProducts, backupProducts, args.allowCoreOverwrite)

  console.log("=== 回補預覽 ===")
  console.log(`來源備份: ${backupProductsPath}`)
  console.log(`目標檔案: ${productsPath}`)
  console.log(`受影響產品數: ${result.changedCount}`)
  console.log(`恢復 detailLayout（畫布）數: ${result.detailLayoutRecovered}`)
  console.log(`恢復 detailContentHtml 數: ${result.detailHtmlRecovered}`)
  console.log(`模式: ${args.apply ? "APPLY" : "DRY-RUN"}`)

  if (!args.apply) return

  await mkdir(jsonDir, { recursive: true })
  await writeFile(productsPath, JSON.stringify(result.merged, null, 2), "utf-8")
  console.log(`已寫回 ${productsPath}`)

  if (args.restoreUploads && backupUploadsDir && existsSync(backupUploadsDir)) {
    console.log(`還原 uploads 目錄: ${backupUploadsDir} -> ${uploadsDir}`)
    await mkdir(uploadsDir, { recursive: true })

    const { execSync } = await import("child_process")
    try {
      execSync(`rsync -a "${backupUploadsDir}/" "${uploadsDir}/"`, { stdio: "inherit" })
    } catch {
      execSync(`cp -r "${backupUploadsDir}/." "${uploadsDir}/"`, { stdio: "inherit" })
    }
    console.log("uploads 目錄已還原")
  }
}

main().catch((error) => {
  console.error("recover:products 失敗:", error)
  process.exit(1)
})
