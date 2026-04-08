/**
 * PWA 아이콘 생성 스크립트 (외부 의존성 없음)
 * 실행: node scripts/generate-icons.js
 * 결과: client/public/icons/icon-192.png, icon-512.png
 */
import { createWriteStream } from 'fs'
import { deflateSync } from 'zlib'

function createPNG(size, bgColor, fgColor) {
  const r = parseInt(bgColor.slice(1, 3), 16)
  const g = parseInt(bgColor.slice(3, 5), 16)
  const b = parseInt(bgColor.slice(5, 7), 16)

  // 이미지 데이터 생성 (RGB, 필터바이트 0x00)
  const rowSize = 1 + size * 3
  const imgData = Buffer.alloc(rowSize * size, 0)
  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize
    imgData[rowOffset] = 0x00 // None filter
    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 3
      const cx = x - size / 2, cy = y - size / 2
      const radius = size * 0.22
      const isRounded =
        Math.abs(cx) > size / 2 - radius && Math.abs(cy) > size / 2 - radius
          ? Math.hypot(Math.abs(cx) - (size / 2 - radius), Math.abs(cy) - (size / 2 - radius)) > radius
          : false
      if (isRounded) {
        imgData[px] = 249; imgData[px + 1] = 250; imgData[px + 2] = 251
      } else {
        imgData[px] = r; imgData[px + 1] = g; imgData[px + 2] = b
      }
    }
  }

  // 가운데 ₩ 텍스트 영역 (단순 사각형으로 표현)
  const cx = Math.floor(size / 2), cy = Math.floor(size / 2)
  const tw = Math.floor(size * 0.35), th = Math.floor(size * 0.40)
  const [fr, fg, fb] = [255, 255, 255]
  for (let y = cy - th; y < cy + th; y++) {
    for (let x = cx - tw; x < cx + tw; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue
      const px = y * rowSize + 1 + x * 3
      imgData[px] = fr; imgData[px + 1] = fg; imgData[px + 2] = fb
    }
  }
  // 내부 인디고 사각형 (카드 효과)
  const [ir, ig, ib] = [99, 102, 241]
  for (let y = cy - th + 6; y < cy + th - 6; y++) {
    for (let x = cx - tw + 6; x < cx + tw - 6; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue
      const px = y * rowSize + 1 + x * 3
      imgData[px] = ir; imgData[px + 1] = ig; imgData[px + 2] = ib
    }
  }

  const compressed = deflateSync(imgData)

  function crc32(buf) {
    let c = 0xFFFFFFFF
    const table = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let k = n
      for (let j = 0; j < 8; j++) k = k & 1 ? 0xEDB88320 ^ (k >>> 1) : k >>> 1
      table[n] = k
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
    return (c ^ 0xFFFFFFFF) >>> 0
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const typeData = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(typeData))
    return Buffer.concat([len, typeData, crc])
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  // IDAT: zlib header(0x78 0x9C) + deflate data + adler32
  function adler32(buf) {
    let a = 1, b = 0
    for (const byte of buf) { a = (a + byte) % 65521; b = (b + a) % 65521 }
    return (b << 16) | a
  }
  const deflateRaw = deflateSync(imgData, { level: 6 })
  const zlibHeader = Buffer.from([0x78, 0x9C])
  const adler = Buffer.alloc(4); adler.writeUInt32BE(adler32(imgData))
  const idat = Buffer.concat([zlibHeader, deflateRaw.slice(2, -4), adler])

  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const sizes = [192, 512]
for (const size of sizes) {
  const buf = createPNG(size, '#6366F1', '#ffffff')
  const path = `client/public/icons/icon-${size}.png`
  const ws = createWriteStream(path)
  ws.write(buf)
  ws.end()
  console.log(`생성 완료: ${path} (${size}x${size})`)
}
