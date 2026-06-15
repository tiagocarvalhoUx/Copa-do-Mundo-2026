import type { Stadium } from '@/types'

/**
 * Estádios-sede da Copa do Mundo 2026 (EUA, Canadá e México) que já receberam
 * jogos na 1ª rodada. `matchIds` referencia os jogos em `matches.ts`.
 * Imagens via Unsplash (otimizadas, com lazy loading nos componentes).
 */
export const stadiums: Stadium[] = [
  {
    id: 1,
    name: 'Estádio Azteca',
    city: 'Cidade do México',
    country: 'México',
    capacity: 87523,
    opened: 1966,
    image:
      '/stadiums/stadium-1.jpg',
    matchIds: [1],
  },
  {
    id: 2,
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'México',
    capacity: 48071,
    opened: 2010,
    image:
      '/stadiums/stadium-2.jpg',
    matchIds: [2],
  },
  {
    id: 3,
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canadá',
    capacity: 45736,
    opened: 2007,
    image:
      '/stadiums/stadium-3.jpg',
    matchIds: [3],
  },
  {
    id: 4,
    name: "Levi's Stadium",
    city: 'São Francisco / Santa Clara',
    country: 'Estados Unidos',
    capacity: 68500,
    opened: 2014,
    image:
      '/stadiums/stadium-4.jpg',
    matchIds: [5],
  },
  {
    id: 5,
    name: 'MetLife Stadium',
    city: 'Nova York / Nova Jersey',
    country: 'Estados Unidos',
    capacity: 82500,
    opened: 2010,
    image:
      '/stadiums/stadium-5.jpg',
    matchIds: [6, 16],
  },
  {
    id: 6,
    name: 'Gillette Stadium',
    city: 'Boston / Foxborough',
    country: 'Estados Unidos',
    capacity: 65878,
    opened: 2002,
    image:
      '/stadiums/stadium-6.jpg',
    matchIds: [7, 17],
  },
  {
    id: 7,
    name: 'SoFi Stadium',
    city: 'Los Angeles / Inglewood',
    country: 'Estados Unidos',
    capacity: 70240,
    opened: 2020,
    image:
      '/stadiums/stadium-7.jpg',
    matchIds: [4, 15],
  },
  {
    id: 8,
    name: 'AT&T Stadium',
    city: 'Dallas / Arlington',
    country: 'Estados Unidos',
    capacity: 80000,
    opened: 2009,
    image:
      '/stadiums/stadium-8.jpg',
    matchIds: [11],
  },
  {
    id: 9,
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canadá',
    capacity: 54500,
    opened: 1983,
    image:
      '/stadiums/stadium-9.jpg',
    matchIds: [8],
  },
  {
    id: 10,
    name: 'NRG Stadium',
    city: 'Houston',
    country: 'Estados Unidos',
    capacity: 72220,
    opened: 2002,
    image:
      '/stadiums/stadium-10.jpg',
    matchIds: [9],
  },
  {
    id: 11,
    name: 'Lincoln Financial Field',
    city: 'Filadélfia',
    country: 'Estados Unidos',
    capacity: 69596,
    opened: 2003,
    image:
      '/stadiums/stadium-11.jpg',
    matchIds: [10],
  },
  {
    id: 12,
    name: 'Lumen Field',
    city: 'Seattle',
    country: 'Estados Unidos',
    capacity: 68740,
    opened: 2002,
    image:
      '/stadiums/stadium-12.jpg',
    matchIds: [13],
  },
  {
    id: 13,
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'Estados Unidos',
    capacity: 71000,
    opened: 2017,
    image:
      '/stadiums/stadium-13.jpg',
    matchIds: [12],
  },
  {
    id: 14,
    name: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'Estados Unidos',
    capacity: 65326,
    opened: 1987,
    image:
      '/stadiums/stadium-14.jpg',
    matchIds: [14],
  },
]

export const stadiumById = new Map(stadiums.map((s) => [s.id, s]))
