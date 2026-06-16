import sharp from 'sharp'
import { existsSync } from 'node:fs'

// Mapa: id do estádio (stadiums.ts) → arquivo real em src/assets/stadium/
const SRC = 'src/assets/stadium'
const map = {
  1: 'Estádio Azteca.avif',
  2: 'Estadio Akron.jpg',
  3: 'BMO Field.jpg',
  4: "Levi's Stadium.jpg",
  5: 'MetLife Stadium.jpg',
  6: 'Gillette Stadium.jpg',
  7: 'sofi-stadium-photo.webp',
  8: 'AT&T Stadium.jpg',
  9: 'BC Place.jpg',
  10: 'NRG Stadium.webp',
  11: 'Lincoln Financial Field.jpg',
  12: 'Lumen Field.webp',
  13: 'Mercedes-Benz Stadium.jpg',
  14: 'Hard Rock Stadium.webp',
}

for (const [id, file] of Object.entries(map)) {
  const input = `${SRC}/${file}`
  if (!existsSync(input)) {
    console.log(`FALTANDO id=${id}: ${input}`)
    continue
  }
  const out = `public/stadiums/stadium-${id}.jpg`
  await sharp(input)
    .resize({ width: 900, height: 600, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(out)
  console.log(`ok id=${id}: ${file} -> ${out}`)
}
