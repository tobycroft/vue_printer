<template>
  <section class="material-bg py-20 relative">
    <div class="absolute inset-0 bg-black bg-opacity-40"></div>
    <div class="relative z-10 max-w-7xl mx-auto px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-4xl font-light text-white mb-8">材质科技</h2>
          <div class="space-y-6 text-stone-200">
            <div v-for="feature in features" :key="feature.id" class="flex items-start space-x-4">
              <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <i :class="feature.icon" class="text-white w-6 h-6"></i>
              </div>
              <div>
                <h3 class="text-xl font-medium text-white mb-2">{{ feature.title }}</h3>
                <p class="text-sm leading-relaxed">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8">
          <h3 class="text-2xl font-medium text-white mb-6">性能参数</h3>
          <div class="space-y-4">
            <div v-for="stat in stats" :key="stat.id">
              <div class="flex justify-between text-stone-200 mb-2">
                <span>{{ stat.name }}</span>
                <span>{{ stat.value }}</span>
              </div>
              <div class="w-full bg-stone-700 rounded-full h-2">
                <div class="bg-primary h-2 rounded-full" :style="{ width: stat.width }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const features = ref([
  {
    id: 1,
    title: 'EVA 发泡技术',
    description: '采用德国进口 EVA 材料，密度达到 0.25 g/cm³，轻盈且具有优异的回弹性，能够有效分散足部压力，提供如云朵般的踩踏感受。',
    icon: 'fas fa-microscope'
  },
  {
    id: 2,
    title: '抗菌防臭处理',
    description: '内置银离子抗菌因子，有效抑制 99.9% 的细菌滋生，保持鞋内环境清洁，长时间穿着依然清新无异味。',
    icon: 'fas fa-shield-alt'
  },
  {
    id: 3,
    title: '环保可回收',
    description: '所有材料均可回收利用，生产过程零有害物质排放，践行可持续发展理念，守护地球家园。',
    icon: 'fas fa-recycle'
  }
])

const stats = ref([
  { id: 1, name: '回弹率', value: '95%', width: '95%' },
  { id: 2, name: '防滑系数', value: '0.8', width: '80%' },
  { id: 3, name: '透气指数', value: '8.5/10', width: '85%' },
  { id: 4, name: '抗菌等级', value: 'A+', width: '98%' }
])
</script>

<style scoped>
</style>