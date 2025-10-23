import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import ChallengeList from './pages/ChallengeList.vue'
import ChallengeDetail from './pages/ChallengeDetail.vue'
import Scoreboard from './pages/Scoreboard.vue'
export default createRouter({ history: createWebHistory(), routes: [ { path: '/', component: Home }, { path: '/challenges', component: ChallengeList }, { path: '/challenge/:id', component: ChallengeDetail, props: true }, { path: '/scoreboard', component: Scoreboard } ] })
