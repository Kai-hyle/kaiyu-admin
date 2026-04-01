<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409EFF;">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ todayRevenue }}</div>
              <div class="stat-label">今日销售额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67C23A;">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ todayOrders }}</div>
              <div class="stat-label">今日订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #E6A23C;">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ pendingOrders }}</div>
              <div class="stat-label">待处理订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #F56C6C;">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ todayCustomers }}</div>
              <div class="stat-label">今日客数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>今日菜品销量排行</span>
            </div>
          </template>
          <el-table :data="topDishes" style="width: 100%">
            <el-table-column type="index" label="排名" width="80" />
            <el-table-column prop="name" label="菜品名称" />
            <el-table-column prop="count" label="销量" width="100" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单状态分布</span>
            </div>
          </template>
          <div class="order-status-chart">
            <div class="status-item" v-for="item in orderStatusData" :key="item.status">
              <span class="status-label">{{ item.label }}</span>
              <span class="status-value">{{ item.count }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as api from '@/utils/api'

const todayRevenue = ref(0)
const todayOrders = ref(0)
const pendingOrders = ref(0)
const todayCustomers = ref(0)
const topDishes = ref([])
const orderStatusData = ref([])

const loadDashboardData = async () => {
  try {
    const res = await api.getDashboard()
    let parsedData = res.resp_data
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData)
    }
    if (res.errcode === 0 || parsedData.success) {
      const data = parsedData
      todayRevenue.value = data.todayRevenue || 0
      todayOrders.value = data.todayOrders || 0
      pendingOrders.value = data.pendingOrders || 0
      todayCustomers.value = data.todayCustomers || 0
      topDishes.value = data.topDishes || []
      orderStatusData.value = data.orderStatusData || []
    }
  } catch (err) {
    console.error('加载数据失败', err)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.stat-icon .el-icon {
  font-size: 30px;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-status-chart {
  padding: 20px 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  color: #666;
}

.status-value {
  font-weight: bold;
  color: #333;
}
</style>