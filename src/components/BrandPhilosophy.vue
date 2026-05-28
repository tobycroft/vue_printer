<template>
  <section class="py-20 px-8 bg-gradient-to-br from-stone-50 to-stone-100">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-4xl font-light text-center mb-16 text-gray-800">品牌理念</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="philosophy in philosophies" :key="philosophy.id" class="bg-white rounded-xl p-8 shadow-sm text-center">
          <div class="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
            <i :class="philosophy.icon" class="text-primary w-8 h-8"></i>
          </div>
          <h3 class="text-xl font-medium text-gray-800 mb-4">{{ philosophy.title }}</h3>
          <p class="text-gray-600 text-sm leading-relaxed">{{ philosophy.description }}</p>
        </div>
      </div>
      <div class="mt-16 bg-white rounded-2xl p-12 shadow-sm">
        <div class="max-w-4xl mx-auto text-center">
          <h3 class="text-2xl font-medium text-gray-800 mb-6">用心选品，竭诚陪伴</h3>
          <p class="text-gray-600 text-lg leading-relaxed mb-8">每一双 RC 拖鞋都经过严格的质量检测。我们坚持选择优质材料，结合精湛工艺，确保每一处细节都经得起时间的考验。从选品到质检，我们用心对待每一个环节，只为给您带来舒心的购物体验。</p>
          <div class="text-4xl font-semibold text-primary tracking-wider">
            GOOD TO GREAT
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const philosophies = ref([
  {
    id: 1,
    title: '舒适至上',
    description: '我们相信每一步都应该是一种享受。从选材到制作，每一个环节都以极致舒适为目标，让双脚在家中得到最温柔的呵护。',
    icon: 'fas fa-heart'
  },
  {
    id: 2,
    title: '自然环保',
    description: '尊重自然是我们不变的初心。选用可持续材料，践行绿色生产，让每双拖鞋都承载着对地球的关爱与责任。',
    icon: 'fas fa-leaf'
  },
  {
    id: 3,
    title: '居家美学',
    description: '家居不仅是生活的空间，更是美学的表达。我们追求简约而不简单的美感，让拖鞋成为家的装饰艺术品。',
    icon: 'fas fa-home'
  }
])
</script>

<style scoped>
</style>