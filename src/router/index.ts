import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * Rotas públicas do app (sem login).
 * Views carregadas com lazy-loading para code-splitting e melhor performance.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/public/HomeView.vue'),
    meta: { title: 'Início' },
  },
  {
    path: '/resultados',
    name: 'resultados',
    component: () => import('@/views/public/ResultadosView.vue'),
    meta: { title: 'Resultados' },
  },
  {
    path: '/jogo/:id',
    name: 'detalhes-jogo',
    component: () => import('@/views/public/DetalhesJogoView.vue'),
    props: (route) => ({ id: Number(route.params.id) }),
    meta: { title: 'Detalhes do Jogo' },
  },
  {
    path: '/classificacao',
    name: 'classificacao',
    component: () => import('@/views/public/ClassificacaoView.vue'),
    meta: { title: 'Classificação' },
  },
  {
    path: '/estatisticas',
    name: 'estatisticas',
    component: () => import('@/views/public/EstatisticasView.vue'),
    meta: { title: 'Estatísticas' },
  },
  {
    path: '/estadios',
    name: 'estadios',
    component: () => import('@/views/public/EstadiosView.vue'),
    meta: { title: 'Estádios' },
  },
  {
    path: '/paises',
    name: 'paises',
    component: () => import('@/views/public/PaisesView.vue'),
    meta: { title: 'Países' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'nao-encontrado',
    component: () => import('@/views/public/NaoEncontradoView.vue'),
    meta: { title: 'Página não encontrada' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

const BASE_TITLE = 'Copa do Mundo 2026'
router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? ''
  document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE
})

export default router
