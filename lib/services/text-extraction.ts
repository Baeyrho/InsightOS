function logExtractionError(method: string, url: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  import("@/lib/logger").then(({ logger }) => {
    logger.error({ err: message, url, method }, `Text extraction failed: ${method}`)
  }).catch(() => {
    console.error(`[extractText] ${method} failed for ${url}: ${message}`)
  })
}

export async function extractTextFromTxt(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      logExtractionError("extractTextFromTxt", url, new Error(`HTTP ${res.status}`))
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    return buffer.toString("utf-8")
  } catch (err) {
    logExtractionError("extractTextFromTxt", url, err)
    return null
  }
}

export async function extractTextFromPdf(url: string, buffer?: Buffer): Promise<string | null> {
  try {
    if (!buffer) {
      const res = await fetch(url)
      if (!res.ok) {
        logExtractionError("extractTextFromPdf", url, new Error(`HTTP ${res.status}`))
        return null
      }
      buffer = Buffer.from(await res.arrayBuffer())
    }
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    return result.text
  } catch (err) {
    logExtractionError("extractTextFromPdf", url, err)
    return null
  }
}

function imageDataToPngBuffer(
  width: number,
  height: number,
  data: Uint8ClampedArray,
  PNGClass: typeof import("pngjs").PNG
): Buffer {
  const pixelCount = width * height
  const bpp = data.length / pixelCount
  const png = new PNGClass({ width, height })

  if (Math.abs(bpp - 4) < 0.01) {
    Buffer.from(data.buffer, data.byteOffset, data.length).copy(png.data)
  } else if (Math.abs(bpp - 3) < 0.01) {
    for (let i = 0; i < pixelCount; i++) {
      const si = i * 3
      const di = i * 4
      png.data[di] = data[si]
      png.data[di + 1] = data[si + 1]
      png.data[di + 2] = data[si + 2]
      png.data[di + 3] = 255
    }
  } else {
    for (let i = 0; i < pixelCount; i++) {
      const di = i * 4
      png.data[di] = data[i]
      png.data[di + 1] = data[i]
      png.data[di + 2] = data[i]
      png.data[di + 3] = 255
    }
  }

  return PNGClass.sync.write(png)
}

export async function ocrPdfText(url: string, existingBuf?: Buffer): Promise<string | null> {
  let buf: Uint8Array
  if (existingBuf) {
    buf = new Uint8Array(existingBuf)
  } else {
    const res = await fetch(url)
    if (!res.ok) return null
    buf = new Uint8Array(await res.arrayBuffer())
  }

  let pdfjsLib: any
  try {
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js")
    const { createRequire } = await import("module")
    const { join } = await import("path")
    const _require = createRequire(join(process.cwd(), "noop.js"))
    pdfjsLib.GlobalWorkerOptions.workerSrc = _require.resolve("pdfjs-dist/legacy/build/pdf.worker.js")
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    logExtractionError("ocrPdfText/import-pdfjs", url, e)
    throw new Error(`OCR failed to load pdfjs-dist: ${msg}`)
  }

  let PNG: any, recognize: any
  try {
    PNG = (await import("pngjs")).PNG
    recognize = (await import("tesseract.js")).recognize
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    logExtractionError("ocrPdfText/import-deps", url, e)
    throw new Error(`OCR failed to load dependencies: ${msg}`)
  }

  const loadingTask = pdfjsLib.getDocument({ data: buf })
  const pdf = await loadingTask.promise
  const allText: string[] = []
  const ocrPromises: Promise<void>[] = []
  const OPS = pdfjsLib.OPS as unknown as Record<string, number>

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)

    const textContent = await page.getTextContent()
    const pageText = (textContent.items as Array<{ str: string }>)
      .map((i) => i.str).join(" ").trim()
    if (pageText.length >= 50) {
      allText.push(pageText)
      continue
    }

    // Defer image extraction until we know the page needs OCR
    ocrPromises.push((async () => {
      const opList = await page.getOperatorList()
      const imageNames: string[] = []
      for (let j = 0; j < opList.fnArray.length; j++) {
        if (opList.fnArray[j] === OPS.paintImageXObject) {
          imageNames.push(opList.argsArray[j][0] as string)
        }
      }

      const pageResults = await Promise.all(imageNames.map(async (name) => {
        if (!page.objs.has(name)) {
          await new Promise<void>((resolve) => {
            page.objs.get(name, () => resolve())
          })
        }

        const imgData = page.objs.get(name) as { width: number; height: number; data: Uint8ClampedArray } | null
        if (!imgData?.data?.length) return null

        const pngBuf = imageDataToPngBuffer(imgData.width, imgData.height, imgData.data, PNG)
        try {
          const result = await recognize(pngBuf, "eng")
          return result.data.text?.trim() || null
        } catch (ocrErr) {
          logExtractionError("ocrPdfText/tesseract", url, ocrErr)
          return null
        }
      }))

      for (const text of pageResults) {
        if (text) allText.push(text)
      }
    })())
  }

  // Wait for all OCR tasks to complete in parallel
  await Promise.all(ocrPromises)

  const combined = allText.join("\n\n")
  return combined || null
}

export async function extractTextFromDocx(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      logExtractionError("extractTextFromDocx", url, new Error(`HTTP ${res.status}`))
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (err) {
    logExtractionError("extractTextFromDocx", url, err)
    return null
  }
}

export async function extractText(url: string, fileName: string): Promise<string | null> {
  const ext = fileName.toLowerCase().split(".").pop()
  if (ext === "txt" || ext === "csv" || ext === "md") return extractTextFromTxt(url)
  if (ext === "pdf") return extractTextFromPdf(url)
  if (ext === "docx") return extractTextFromDocx(url)
  return null
}
