import type { Country } from '@/types'

/**
 * As 48 seleções da Copa do Mundo 2026, conforme o sorteio oficial
 * (Washington, D.C. · 05/12/2025), divididas nos 12 grupos (A a L).
 *
 * `flagCode` é o código usado para carregar a imagem da bandeira (flagcdn.com).
 * Dados de apoio (ranking, técnico, apelido) são aproximados para a versão mock.
 */
export const countries: Country[] = [
  // ───────── Grupo A ─────────
  { id: 1, name: 'México', code: 'MEX', flag: '🇲🇽', flagCode: 'mx', confederation: 'CONCACAF', group: 'A', titles: 0, fifaRanking: 14, nickname: 'El Tri', coach: 'Javier Aguirre' },
  { id: 2, name: 'África do Sul', code: 'RSA', flag: '🇿🇦', flagCode: 'za', confederation: 'CAF', group: 'A', titles: 0, fifaRanking: 61, nickname: 'Bafana Bafana', coach: 'Hugo Broos' },
  { id: 3, name: 'Coreia do Sul', code: 'KOR', flag: '🇰🇷', flagCode: 'kr', confederation: 'AFC', group: 'A', titles: 0, fifaRanking: 23, nickname: 'Guerreiros Taeguk', coach: 'Hong Myung-bo' },
  { id: 4, name: 'República Tcheca', code: 'CZE', flag: '🇨🇿', flagCode: 'cz', confederation: 'UEFA', group: 'A', titles: 0, fifaRanking: 42 },

  // ───────── Grupo B ─────────
  { id: 5, name: 'Canadá', code: 'CAN', flag: '🇨🇦', flagCode: 'ca', confederation: 'CONCACAF', group: 'B', titles: 0, fifaRanking: 27, coach: 'Jesse Marsch' },
  { id: 6, name: 'Bósnia e Herzegovina', code: 'BIH', flag: '🇧🇦', flagCode: 'ba', confederation: 'UEFA', group: 'B', titles: 0, fifaRanking: 74 },
  { id: 7, name: 'Catar', code: 'QAT', flag: '🇶🇦', flagCode: 'qa', confederation: 'AFC', group: 'B', titles: 0, fifaRanking: 36 },
  { id: 8, name: 'Suíça', code: 'SUI', flag: '🇨🇭', flagCode: 'ch', confederation: 'UEFA', group: 'B', titles: 0, fifaRanking: 19, coach: 'Murat Yakin' },

  // ───────── Grupo C ─────────
  { id: 9, name: 'Brasil', code: 'BRA', flag: '🇧🇷', flagCode: 'br', confederation: 'CONMEBOL', group: 'C', titles: 5, fifaRanking: 5, nickname: 'Seleção Canarinho', coach: 'Carlo Ancelotti' },
  { id: 10, name: 'Marrocos', code: 'MAR', flag: '🇲🇦', flagCode: 'ma', confederation: 'CAF', group: 'C', titles: 0, fifaRanking: 12, nickname: 'Leões do Atlas', coach: 'Walid Regragui' },
  { id: 11, name: 'Haiti', code: 'HAI', flag: '🇭🇹', flagCode: 'ht', confederation: 'CONCACAF', group: 'C', titles: 0, fifaRanking: 84 },
  { id: 12, name: 'Escócia', code: 'SCO', flag: '🏴', flagCode: 'gb-sct', confederation: 'UEFA', group: 'C', titles: 0, fifaRanking: 39, coach: 'Steve Clarke' },

  // ───────── Grupo D ─────────
  { id: 13, name: 'Estados Unidos', code: 'USA', flag: '🇺🇸', flagCode: 'us', confederation: 'CONCACAF', group: 'D', titles: 0, fifaRanking: 16, coach: 'Mauricio Pochettino' },
  { id: 14, name: 'Paraguai', code: 'PAR', flag: '🇵🇾', flagCode: 'py', confederation: 'CONMEBOL', group: 'D', titles: 0, fifaRanking: 35 },
  { id: 15, name: 'Austrália', code: 'AUS', flag: '🇦🇺', flagCode: 'au', confederation: 'AFC', group: 'D', titles: 0, fifaRanking: 25, nickname: 'Socceroos' },
  { id: 16, name: 'Turquia', code: 'TUR', flag: '🇹🇷', flagCode: 'tr', confederation: 'UEFA', group: 'D', titles: 0, fifaRanking: 26 },

  // ───────── Grupo E ─────────
  { id: 17, name: 'Alemanha', code: 'GER', flag: '🇩🇪', flagCode: 'de', confederation: 'UEFA', group: 'E', titles: 4, fifaRanking: 9, nickname: 'Die Mannschaft', coach: 'Julian Nagelsmann' },
  { id: 18, name: 'Curaçao', code: 'CUW', flag: '🇨🇼', flagCode: 'cw', confederation: 'CONCACAF', group: 'E', titles: 0, fifaRanking: 82 },
  { id: 19, name: 'Costa do Marfim', code: 'CIV', flag: '🇨🇮', flagCode: 'ci', confederation: 'CAF', group: 'E', titles: 0, fifaRanking: 40, nickname: 'Os Elefantes' },
  { id: 20, name: 'Equador', code: 'ECU', flag: '🇪🇨', flagCode: 'ec', confederation: 'CONMEBOL', group: 'E', titles: 0, fifaRanking: 24 },

  // ───────── Grupo F ─────────
  { id: 21, name: 'Países Baixos', code: 'NED', flag: '🇳🇱', flagCode: 'nl', confederation: 'UEFA', group: 'F', titles: 0, fifaRanking: 6, nickname: 'Laranja Mecânica', coach: 'Ronald Koeman' },
  { id: 22, name: 'Japão', code: 'JPN', flag: '🇯🇵', flagCode: 'jp', confederation: 'AFC', group: 'F', titles: 0, fifaRanking: 15, nickname: 'Samurai Azul', coach: 'Hajime Moriyasu' },
  { id: 23, name: 'Suécia', code: 'SWE', flag: '🇸🇪', flagCode: 'se', confederation: 'UEFA', group: 'F', titles: 0, fifaRanking: 30 },
  { id: 24, name: 'Tunísia', code: 'TUN', flag: '🇹🇳', flagCode: 'tn', confederation: 'CAF', group: 'F', titles: 0, fifaRanking: 41 },

  // ───────── Grupo G ─────────
  { id: 25, name: 'Bélgica', code: 'BEL', flag: '🇧🇪', flagCode: 'be', confederation: 'UEFA', group: 'G', titles: 0, fifaRanking: 8, nickname: 'Os Demônios Vermelhos', coach: 'Rudi Garcia' },
  { id: 26, name: 'Egito', code: 'EGY', flag: '🇪🇬', flagCode: 'eg', confederation: 'CAF', group: 'G', titles: 0, fifaRanking: 31, nickname: 'Os Faraós' },
  { id: 27, name: 'Irã', code: 'IRN', flag: '🇮🇷', flagCode: 'ir', confederation: 'AFC', group: 'G', titles: 0, fifaRanking: 18 },
  { id: 28, name: 'Nova Zelândia', code: 'NZL', flag: '🇳🇿', flagCode: 'nz', confederation: 'OFC', group: 'G', titles: 0, fifaRanking: 89, nickname: 'All Whites' },

  // ───────── Grupo H ─────────
  { id: 29, name: 'Espanha', code: 'ESP', flag: '🇪🇸', flagCode: 'es', confederation: 'UEFA', group: 'H', titles: 1, fifaRanking: 2, nickname: 'La Roja', coach: 'Luis de la Fuente' },
  { id: 30, name: 'Cabo Verde', code: 'CPV', flag: '🇨🇻', flagCode: 'cv', confederation: 'CAF', group: 'H', titles: 0, fifaRanking: 70, nickname: 'Tubarões Azuis' },
  { id: 31, name: 'Arábia Saudita', code: 'KSA', flag: '🇸🇦', flagCode: 'sa', confederation: 'AFC', group: 'H', titles: 0, fifaRanking: 60, nickname: 'Os Falcões Verdes' },
  { id: 32, name: 'Uruguai', code: 'URU', flag: '🇺🇾', flagCode: 'uy', confederation: 'CONMEBOL', group: 'H', titles: 2, fifaRanking: 11, nickname: 'La Celeste', coach: 'Marcelo Bielsa' },

  // ───────── Grupo I ─────────
  { id: 33, name: 'França', code: 'FRA', flag: '🇫🇷', flagCode: 'fr', confederation: 'UEFA', group: 'I', titles: 2, fifaRanking: 3, nickname: 'Les Bleus', coach: 'Didier Deschamps' },
  { id: 34, name: 'Senegal', code: 'SEN', flag: '🇸🇳', flagCode: 'sn', confederation: 'CAF', group: 'I', titles: 0, fifaRanking: 17, nickname: 'Leões de Teranga', coach: 'Pape Thiaw' },
  { id: 35, name: 'Iraque', code: 'IRQ', flag: '🇮🇶', flagCode: 'iq', confederation: 'AFC', group: 'I', titles: 0, fifaRanking: 58 },
  { id: 36, name: 'Noruega', code: 'NOR', flag: '🇳🇴', flagCode: 'no', confederation: 'UEFA', group: 'I', titles: 0, fifaRanking: 28, coach: 'Ståle Solbakken' },

  // ───────── Grupo J ─────────
  { id: 37, name: 'Argentina', code: 'ARG', flag: '🇦🇷', flagCode: 'ar', confederation: 'CONMEBOL', group: 'J', titles: 3, fifaRanking: 1, nickname: 'La Albiceleste', coach: 'Lionel Scaloni' },
  { id: 38, name: 'Argélia', code: 'ALG', flag: '🇩🇿', flagCode: 'dz', confederation: 'CAF', group: 'J', titles: 0, fifaRanking: 38, nickname: 'As Raposas do Deserto' },
  { id: 39, name: 'Áustria', code: 'AUT', flag: '🇦🇹', flagCode: 'at', confederation: 'UEFA', group: 'J', titles: 0, fifaRanking: 22 },
  { id: 40, name: 'Jordânia', code: 'JOR', flag: '🇯🇴', flagCode: 'jo', confederation: 'AFC', group: 'J', titles: 0, fifaRanking: 62 },

  // ───────── Grupo K ─────────
  { id: 41, name: 'Portugal', code: 'POR', flag: '🇵🇹', flagCode: 'pt', confederation: 'UEFA', group: 'K', titles: 0, fifaRanking: 7, nickname: 'A Seleção das Quinas', coach: 'Roberto Martínez' },
  { id: 42, name: 'Rep. Dem. do Congo', code: 'COD', flag: '🇨🇩', flagCode: 'cd', confederation: 'CAF', group: 'K', titles: 0, fifaRanking: 56, nickname: 'Os Leopardos' },
  { id: 43, name: 'Uzbequistão', code: 'UZB', flag: '🇺🇿', flagCode: 'uz', confederation: 'AFC', group: 'K', titles: 0, fifaRanking: 54 },
  { id: 44, name: 'Colômbia', code: 'COL', flag: '🇨🇴', flagCode: 'co', confederation: 'CONMEBOL', group: 'K', titles: 0, fifaRanking: 13, nickname: 'Los Cafeteros' },

  // ───────── Grupo L ─────────
  { id: 45, name: 'Inglaterra', code: 'ENG', flag: '🏴', flagCode: 'gb-eng', confederation: 'UEFA', group: 'L', titles: 1, fifaRanking: 4, nickname: 'The Three Lions', coach: 'Thomas Tuchel' },
  { id: 46, name: 'Croácia', code: 'CRO', flag: '🇭🇷', flagCode: 'hr', confederation: 'UEFA', group: 'L', titles: 0, fifaRanking: 10, nickname: 'Vatreni', coach: 'Zlatko Dalić' },
  { id: 47, name: 'Gana', code: 'GHA', flag: '🇬🇭', flagCode: 'gh', confederation: 'CAF', group: 'L', titles: 0, fifaRanking: 73, nickname: 'Estrelas Negras' },
  { id: 48, name: 'Panamá', code: 'PAN', flag: '🇵🇦', flagCode: 'pa', confederation: 'CONCACAF', group: 'L', titles: 0, fifaRanking: 30 },
]

/** Lookup rápido por id. */
export const countryById = new Map(countries.map((c) => [c.id, c]))

export const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const
