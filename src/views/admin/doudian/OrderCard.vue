<template>
  <div class="order-card">
    <div class="order-card-header">
      <div class="order-id-section">
        <span class="order-id-label">订单号</span>
        <span class="order-id-value">{{ order.shop_order_id || '-' }}</span>
        <button
          class="btn-copy"
          @click="$emit('copy', order.shop_order_id)"
          :title="'复制订单号'"
        >复制</button>
        <span class="meta-tag" v-if="order.product_count">共 {{ order.product_count }} 件</span>
      </div>
      <div class="order-status-section">
        <span :class="['status-badge', statusClass]">
          {{ order.order_status_info?.order_status_text || statusText }}
        </span>
        <span class="pay-type">{{ order.pay_type_desc || '-' }}</span>
      </div>
    </div>

    <div class="order-card-body">
      <!-- 买家留言/卖家备注 -->
      <div class="remarks-section" v-if="order.buyer_words || order.remark">
        <div v-if="order.buyer_words" class="remark-item buyer-remark">
          <span class="remark-label">💬 买家留言:</span>
          <span class="remark-text">{{ order.buyer_words }}</span>
        </div>
        <div v-if="order.remark" class="remark-item seller-remark">
          <span class="remark-label">📝 卖家备注:</span>
          <span class="remark-text">{{ order.remark }}</span>
        </div>
      </div>

      <!-- 商品信息 -->
      <div class="product-section" v-if="order.product_item && order.product_item.length > 0">
        <div class="section-title">🎁 商品信息</div>
        <div
          v-for="(product, pIndex) in order.product_item"
          :key="pIndex"
          class="product-item"
        >
          <img
            v-if="product.img"
            :src="product.img"
            class="product-image"
            alt="商品图片"
          />
          <div class="product-info">
            <h4 class="product-name">{{ product.product_name || '-' }}</h4>
            <div class="product-specs">
              <span
                v-for="(spec, sIndex) in product.sku_spec"
                :key="sIndex"
                class="spec-tag"
              >
                {{ spec.name }}: {{ spec.value }}
              </span>
            </div>
            <div class="product-price">
              <span class="price">¥{{ formatAmount(product.pay_amount) }}</span>
              <span class="quantity">x{{ product.combo_num || 1 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 买家信息 -->
      <div class="buyer-section" v-if="order.receiver_info">
        <div class="section-title">👤 收货信息</div>
        <div class="buyer-info">
          <p><strong>买家昵称:</strong> {{ order.user_nickname || '-' }}</p>
          <p><strong>收货人:</strong> {{ order.receiver_info.post_receiver || '-' }}</p>
          <p><strong>电话:</strong> {{ order.receiver_info.post_tel || '-' }}</p>
          <p v-if="order.receiver_info.post_addr">
            <strong>地址:</strong>
            {{ order.receiver_info.post_addr.province?.name || '' }}
            {{ order.receiver_info.post_addr.city?.name || '' }}
            {{ order.receiver_info.post_addr.town?.name || '' }}
            {{ order.receiver_info.post_addr.street?.name || '' }}
            {{ order.receiver_info.post_addr.detail || '' }}
          </p>
        </div>
      </div>

      <!-- 订单金额 -->
      <div class="amount-section">
        <div class="section-title">💰 订单金额</div>
        <div class="amount-info">
          <div class="amount-row">
            <span>商品总额:</span>
            <span>¥{{ formatAmount(order.pay_amount) }}</span>
          </div>
          <div class="amount-row">
            <span>运费:</span>
            <span>¥{{ formatAmount(order.post_amount) }}</span>
          </div>
          <div class="amount-row total">
            <span>实付金额:</span>
            <span class="total-amount">¥{{ formatAmount(order.actual_pay_amount) }}</span>
          </div>
          <div class="amount-row">
            <span>商家收入:</span>
            <span class="receive-amount">{{ order.actual_receive_amount || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 订单时间 -->
      <div class="time-section">
        <div class="section-title">📅 订单时间</div>
        <div class="time-info">
          <p><strong>下单时间:</strong> {{ formatTime(order.create_time) }}</p>
          <p><strong>付款时间:</strong> {{ formatTime(order.pay_time) }}</p>
          <p v-if="order.exp_ship_time">
            <strong>发货截止:</strong> {{ formatTime(order.exp_ship_time) }}
          </p>
        </div>
      </div>

      <!-- 状态备注 -->
      <div class="remark-section" v-if="order.order_status_info?.order_status_remark">
        <div class="section-title">⏰ 状态备注</div>
        <p class="status-remark">{{ order.order_status_info.order_status_remark }}</p>
      </div>

      <!-- 商品标签 -->
      <div class="tags-section" v-if="order.product_item && order.product_item[0]?.tags">
        <div class="section-title">🏷️ 商品标签</div>
        <div class="tag-list">
          <span
            v-for="(tag, tIndex) in order.product_item[0].tags"
            :key="tIndex"
            :class="['tag', tag.tag_type || 'default']"
          >
            {{ tag.text }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  order: { type: Object, required: true },
  statusClass: { type: String, default: 'unknown' },
  statusText: { type: String, default: '未知状态' }
})

defineEmits(['copy'])

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return (amount / 100).toFixed(2)
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  if (typeof timestamp === 'number') {
    const ts = timestamp > 10000000000 ? timestamp : timestamp * 1000
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped>
.order-card {
  padding: 20px;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.order-card:hover {
  background: #f9f9f9;
}

.order-card:last-child {
  border-bottom: none;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e0e0e0;
}

.order-id-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.order-id-label {
  font-size: 12px;
  color: #999;
}

.order-id-value {
  font-weight: 600;
  color: #333;
  font-family: monospace;
  font-size: 14px;
}

.btn-copy {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #BDBDBD;
  background: #fff;
  color: #555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-copy:hover {
  background: #E3F2FD;
  border-color: #1976D2;
  color: #1976D2;
}

.meta-tag {
  padding: 2px 8px;
  background: #F5F5F5;
  color: #666;
  border-radius: 4px;
  font-size: 12px;
}

.order-status-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.pending {
  background: #FFF3E0;
  color: #E65100;
}

.status-badge.shipped {
  background: #E3F2FD;
  color: #1565C0;
}

.status-badge.completed {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.cancelled {
  background: #FFEBEE;
  color: #C62828;
}

.status-badge.unknown {
  background: #F5F5F5;
  color: #666;
}

.pay-type {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
}

.order-card-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.section-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.remarks-section {
  grid-column: 1 / -1;
  background: #FFF9C4;
  border-left: 4px solid #FBC02D;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.remark-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.remark-label {
  font-weight: 600;
  white-space: nowrap;
  color: #6D4C41;
}

.remark-item.buyer-remark .remark-label {
  color: #5D4037;
}

.remark-item.seller-remark {
  background: #FFECB3;
  border-radius: 4px;
  padding: 4px 8px;
}

.remark-item.seller-remark .remark-label {
  color: #1565C0;
}

.remark-text {
  color: #4E342E;
  line-height: 1.5;
}

.product-section {
  grid-column: 1 / -1;
}

.product-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
}

.product-name {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.product-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.spec-tag {
  font-size: 12px;
  color: #666;
  background: #e8e8e8;
  padding: 2px 8px;
  border-radius: 4px;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price {
  font-weight: 600;
  color: #f44336;
  font-size: 16px;
}

.quantity {
  color: #999;
  font-size: 13px;
}

.buyer-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.buyer-info p {
  margin: 4px 0;
  color: #555;
  font-size: 13px;
}

.amount-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 13px;
  color: #555;
}

.amount-row.total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #ddd;
  font-weight: 600;
}

.total-amount {
  color: #f44336;
  font-size: 16px;
}

.receive-amount {
  color: #4CAF50;
  font-weight: 600;
}

.time-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.time-info p {
  margin: 4px 0;
  color: #555;
  font-size: 13px;
}

.remark-section {
  background: #FFF8E1;
  padding: 12px;
  border-radius: 8px;
}

.status-remark {
  margin: 0;
  color: #E65100;
  font-size: 13px;
}

.tags-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}

.tag.transparent_grey {
  background: #e0e0e0;
  color: #666;
}

.tag.default {
  background: #e0e0e0;
  color: #666;
}
</style>
