<template>
  <section class="py-20 px-8">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-4xl font-light text-center mb-16 text-gray-800">精选系列</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="product in products" :key="product.id" class="product-card group relative overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow">
          <div class="aspect-square overflow-hidden">
            <img :src="product.image" :alt="product.name" class="w-full h-full object-cover transition-transform group-hover:scale-105">
            <div class="product-overlay absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 transition-opacity">
              <button class="!rounded-button bg-white text-primary px-6 py-3 whitespace-nowrap">查看详情</button>
            </div>
          </div>
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-800 mb-2">{{ product.name }}</h3>
            <p class="text-gray-600 text-sm mb-3">{{ product.description }}</p>
            <div class="flex justify-between items-center">
              <span class="text-xl font-semibold text-primary">¥ {{ product.price }}</span>
              <span class="text-gray-500 text-sm">{{ product.tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const products = ref([
  {
    id: 1,
    name: '鼠尾草绿棉麻拖鞋',
    description: '天然棉麻面料，透气舒适',
    price: '299',
    tag: 'Eco-friendly Material',
    image: 'https://static.mastergo.com/ai/img_res/1778480267758K2jH5nM8pQ3rT7wY9zA1c.jpg'
  },
  {
    id: 2,
    name: '温暖米色羊皮拖鞋',
    description: '澳洲绵羊皮，柔软亲肤',
    price: '459',
    tag: 'Sheepskin Leather',
    image: 'https://static.mastergo.com/ai/img_res/1778480267758M8pQ3rT7wY9zA1cK2jH5.jpg'
  },
  {
    id: 3,
    name: '柔和灰蓝色记忆棉拖鞋',
    description: '记忆棉鞋垫，贴合足型',
    price: '389',
    tag: 'Memory Foam',
    image: 'https://static.mastergo.com/ai/img_res/1778480267758Q3rT7wY9zA1cK2jH5nM8p.jpg'
  }
])
</script>

<style scoped>
</style>