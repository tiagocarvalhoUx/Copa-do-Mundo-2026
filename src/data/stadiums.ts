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
      'https://images.unsplash.com/photo-1540379708242-14a809bef941?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1556816723-1ce827b9cfbd?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1540470050740-b3df607d92f9?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=70',
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
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=70',
    matchIds: [14],
  },
]

export const stadiumById = new Map(stadiums.map((s) => [s.id, s]))
