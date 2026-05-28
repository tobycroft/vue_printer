<template>
  <section class="py-20 px-8 bg-stone-100">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-4xl font-light text-center mb-16 text-gray-800">系列展示</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="space-y-8">
          <div v-for="collection in collections" :key="collection.id" class="bg-white rounded-xl p-8 shadow-sm">
            <h3 class="text-2xl font-medium text-gray-800 mb-4">{{ collection.name }}</h3>
            <p class="text-gray-600 mb-4 leading-relaxed">{{ collection.description }}</p>
            <ul class="text-sm text-gray-500 space-y-1">
              <li v-for="(item, index) in collection.features" :key="index">• {{ item }}</li>
            </ul>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-6">
          <img src="https://static.mastergo.com/ai/img_res/1778480267758T7wY9zA1cK2jH5nM8pQ3r.jpg" alt="拖鞋系列集合" class="rounded-xl shadow-sm">
          <img src="https://static.mastergo.com/ai/img_res/1778480267758A1cK2jH5nM8pQ3rT7wY9z.jpg" alt="拖鞋细节工艺" class="rounded-xl shadow-sm mt-12">
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const collections = ref([
  {
    id: 1,
    name: 'Urban Comfort',
    description: '都市生活系列专为现代家庭设计，简约而不失优雅的线条，适合各种室内装修风格，让您在家中也能享受都市生活的精致感。',
    features: ['防滑橡胶底，安全可靠', '可拆卸鞋垫，便于清洗', '一年质保服务']
  },
  {
    id: 2,
    name: 'Nature Touch',
    description: '自然触感系列采用天然植物纤维和有机棉，带来最接近大自然的舒适体验。每一双拖鞋都承载着对自然的敬畏与热爱。',
    features: ['有机棉面料认证', '天然染料，无化学残留', '碳中和生产流程']
  }
])
</script>

<style scoped>
</style>