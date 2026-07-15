<template>
  <div class="section">
    <h3>控件属性</h3>
    
    <!-- 固定文本 -->
    <template v-if="control.type === 'text'">
      <div class="property-group">
        <label>文本内容</label>
        <input 
          v-model="control.text" 
          type="text" 
          class="form-control" 
          @input="$emit('update', control)"
        />
      </div>
      <div class="form-row">
        <div class="property-group">
          <label>字号 (pt)</label>
          <div class="font-size-control">
            <input
              v-model.number="control.fontSize"
              type="number"
              min="8"
              max="72"
              class="form-control"
              @input="$emit('update', control)"
            />
            <input
              v-model.number="control.fontSize"
              type="range"
              min="8"
              max="72"
              class="form-slider"
              @input="$emit('update', control)"
            />
          </div>
        </div>
        <div class="property-group">
          <label>对齐</label>
          <select 
            v-model="control.align" 
            class="form-control"
            @change="$emit('update', control)"
          >
            <option value="left">左</option>
            <option value="center">中</option>
            <option value="right">右</option>
          </select>
        </div>
      </div>
      <div class="property-group">
        <label>字体粗细</label>
        <select 
          v-model="control.fontWeight" 
          class="form-control"
          @change="$emit('update', control)"
        >
          <option value="normal">正常</option>
          <option value="bold">粗体</option>
        </select>
      </div>
      <div class="form-row">
        <div class="property-group">
          <label>宽度 (mm)</label>
          <input 
            v-model.number="control.width" 
            type="number" 
            min="10" 
            max="500" 
            step="1"
            class="form-control" 
            @input="onSizeInput('width', $event)"
          />
        </div>
        <div class="property-group">
          <label>高度 (mm)</label>
          <input 
            v-model.number="control.height" 
            type="number" 
            min="5" 
            max="200" 
            step="1"
            class="form-control" 
            @input="onSizeInput('height', $event)"
          />
        </div>
      </div>
      <button class="btn btn-danger btn-sm full-width" @click.stop="$emit('delete')">删除控件</button>
    </template>
    
    <!-- 数据文本 -->
    <template v-else-if="control.type === 'data_text'">
      <div class="property-group">
        <label>数据字段</label>
        <select 
          v-model="control.dataField" 
          class="form-control"
          @change="$emit('update', control)"
        >
          <option value="">-- 无（通用数据文本）--</option>
          <optgroup label="订单信息">
            <option value="shop_order_id">订单号</option>
            <option value="order_status_text">订单状态</option>
            <option value="pay_type_desc">支付方式</option>
            <option value="create_time">下单时间</option>
            <option value="pay_time">付款时间</option>
            <option value="exp_ship_time">发货截止</option>
            <option value="user_nickname">买家昵称</option>
            <option value="buyer_words">买家留言</option>
            <option value="remark">卖家备注</option>
          </optgroup>
          <optgroup label="金额信息">
            <option value="pay_amount">商品总额</option>
            <option value="post_amount">运费</option>
            <option value="actual_pay_amount">实付金额</option>
            <option value="actual_receive_amount">商家收入</option>
          </optgroup>
          <optgroup label="收货信息">
            <option value="post_receiver">收货人</option>
            <option value="post_tel">联系电话</option>
            <option value="full_address">完整地址</option>
            <option value="province">省</option>
            <option value="city">市</option>
            <option value="town">区/县</option>
            <option value="street">街道</option>
            <option value="detail">详细地址</option>
          </optgroup>
          <optgroup label="商品信息">
            <option value="product_name">商品名称</option>
            <option value="product_count">商品数量</option>
            <option value="product_pay_amount">商品单价</option>
            <option value="sku_specs">SKU规格</option>
          </optgroup>
        </select>
      </div>
      <div class="property-group">
        <label>占位模式</label>
        <select 
          v-model="control.placeholderMode" 
          class="form-control"
          @change="$emit('update', control)"
        >
          <option value="prefix">在数据文本前输入</option>
          <option value="suffix">在数据文本后输入</option>
        </select>
      </div>
      <div class="property-group">
        <label>占位文本</label>
        <input 
          v-model="control.placeholderText" 
          type="text" 
          class="form-control" 
          @input="$emit('update', control)"
        />
      </div>
      <div class="form-row">
        <div class="property-group">
          <label>字号 (pt)</label>
          <div class="font-size-control">
            <input
              v-model.number="control.fontSize"
              type="number"
              min="8"
              max="72"
              class="form-control"
              @input="$emit('update', control)"
            />
            <input
              v-model.number="control.fontSize"
              type="range"
              min="8"
              max="72"
              class="form-slider"
              @input="$emit('update', control)"
            />
          </div>
        </div>
        <div class="property-group">
          <label>对齐</label>
          <select 
            v-model="control.align" 
            class="form-control"
            @change="$emit('update', control)"
          >
            <option value="left">左</option>
            <option value="center">中</option>
            <option value="right">右</option>
          </select>
        </div>
      </div>
      <div class="property-group">
        <label>字体粗细</label>
        <select 
          v-model="control.fontWeight" 
          class="form-control"
          @change="$emit('update', control)"
        >
          <option value="normal">正常</option>
          <option value="bold">粗体</option>
        </select>
      </div>
      <div class="form-row">
        <div class="property-group">
          <label>宽度 (mm)</label>
          <input 
            v-model.number="control.width" 
            type="number" 
            min="10" 
            max="500" 
            step="1"
            class="form-control" 
            @input="onSizeInput('width', $event)"
          />
        </div>
        <div class="property-group">
          <label>高度 (mm)</label>
          <input 
            v-model.number="control.height" 
            type="number" 
            min="5" 
            max="200" 
            step="1"
            class="form-control" 
            @input="onSizeInput('height', $event)"
          />
        </div>
      </div>
      <button class="btn btn-danger btn-sm full-width" @click.stop="$emit('delete')">删除控件</button>
    </template>
    
    <!-- 线条 -->
    <template v-else-if="control.type === 'line'">
      <div class="form-row">
        <div class="property-group">
          <label>宽度 (mm)</label>
          <input 
            v-model.number="control.width" 
            type="number" 
            min="10" 
            max="500" 
            step="1"
            class="form-control" 
            @input="onSizeInput('width', $event)"
          />
        </div>
        <div class="property-group">
          <label>线条粗细</label>
          <input 
            v-model.number="control.borderWidth" 
            type="number" 
            min="1" 
            max="20" 
            class="form-control" 
            @input="$emit('update', control)"
          />
        </div>
      </div>
      <button class="btn btn-danger btn-sm full-width" @click.stop="$emit('delete')">删除控件</button>
    </template>
    
    <!-- 图片 -->
    <template v-else-if="control.type === 'image'">
      <div class="property-group">
        <label>图片类型</label>
        <select 
          v-model="control.imageType" 
          class="form-control"
          @change="$emit('update', control)"
        >
          <option value="barcode">条形码</option>
          <option value="qrcode">二维码</option>
        </select>
      </div>
      <div class="form-row">
        <div class="property-group">
          <label>宽度 (mm)</label>
          <input 
            v-model.number="control.width" 
            type="number" 
            min="10" 
            max="500" 
            step="1"
            class="form-control" 
            @input="onSizeInput('width', $event)"
          />
        </div>
        <div class="property-group">
          <label>高度 (mm)</label>
          <input 
            v-model.number="control.height" 
            type="number" 
            min="10" 
            max="500" 
            step="1"
            class="form-control" 
            @input="onSizeInput('height', $event)"
          />
        </div>
      </div>
      <button class="btn btn-danger btn-sm full-width" @click.stop="$emit('delete')">删除控件</button>
    </template>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  control: {
    type: Object,
    required: true
  },
  dataFields: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update', 'delete'])

// 处理尺寸输入，确保为整数
const onSizeInput = (field, event) => {
  const value = parseInt(event.target.value, 10)
  if (!isNaN(value)) {
    props.control[field] = value
    emit('update', props.control)
  }
}
</script>