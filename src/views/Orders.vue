<template>
  <div class="orders-page">
    <el-card>
      <div class="toolbar">
        <el-tabs v-model="filterStatus" @tab-change="loadOrders">
          <el-tab-pane label="全部订单" name="" />
          <el-tab-pane label="待支付" name="pending_payment" />
          <el-tab-pane label="已支付" name="paid" />
          <el-tab-pane label="已接单" name="confirmed" />
          <el-tab-pane label="已完成" name="completed" />
          <el-tab-pane label="已取消" name="cancelled" />
        </el-tabs>
      </div>

      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column label="用餐方式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.deliveryType === 'delivery' ? 'success' : 'info'">
              {{ row.deliveryType === 'delivery' ? '配送' : '自提' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="菜品" min-width="200">
          <template #default="{ row }">
            <div class="order-items">
              <div v-for="(item, idx) in row.items" :key="idx" class="item-row">
                <span>{{ item.name }} x{{ item.quantity }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'paid' || row.status === 'pending_payment'"
              size="small"
              type="success"
              @click="confirmOrder(row)"
            >
              确认接单
            </el-button>
            <el-button
              v-if="row.status === 'pending_payment' || row.status === 'paid' || row.status === 'confirmed'"
              size="small"
              type="danger"
              @click="cancelOrder(row)"
            >
              取消订单
            </el-button>
            <el-button
              v-if="row.status === 'confirmed'"
              size="small"
              type="primary"
              @click="completeOrder(row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadOrders"
          @current-change="loadOrders"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用餐方式">
          <el-tag :type="currentOrder.deliveryType === 'delivery' ? 'success' : 'info'">
            {{ currentOrder.deliveryType === 'delivery' ? '配送' : '自提' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="桌号">{{ currentOrder.tableNumber || '-' }}</el-descriptions-item>
        <el-descriptions-item label="人数">{{ currentOrder.peopleCount || '-' }}人</el-descriptions-item>
        <el-descriptions-item label="配送时间">{{ currentOrder.deliveryTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">
          {{ formatDate(currentOrder.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ currentOrder.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="菜品清单" :span="2">
          <el-table :data="currentOrder.items" size="small">
            <el-table-column prop="name" label="菜品" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="price" label="单价" width="80">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column label="小计" width="100">
              <template #default="{ row }">¥{{ (row.price * row.quantity).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, getOrderDetail, updateOrderStatus } from '@/utils/api'

const loading = ref(false)
const orders = ref([])
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const detailVisible = ref(false)
const currentOrder = ref(null)

const statusMap = {
  'pending_payment': '待支付',
  'paid': '已支付',
  'confirmed': '已接单',
  'completed': '已完成',
  'cancelled': '已取消'
}

const statusTypeMap = {
  'pending_payment': 'warning',
  'paid': 'success',
  'confirmed': 'primary',
  'completed': 'info',
  'cancelled': 'danger'
}

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders({
      status: filterStatus.value || undefined,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    let parsedData = res.resp_data
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData)
    }
    if (res.errcode === 0 || res.success || parsedData.success) {
      orders.value = parsedData.orders || []
      total.value = parsedData.total || 0
    } else {
      ElMessage.error(parsedData.error || '加载订单失败')
    }
  } catch (err) {
    console.error('加载订单失败', err)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const viewDetail = async (row) => {
  try {
    const res = await getOrderDetail(row._id)
    if (res.errcode === 0 || res.success) {
      currentOrder.value = res.data?.order || res.order
      detailVisible.value = true
    } else {
      ElMessage.error(res.errmsg || res.error || '获取订单详情失败')
    }
  } catch (err) {
    console.error('获取订单详情失败', err)
    ElMessage.error('获取订单详情失败')
  }
}

const confirmOrder = async (row) => {
  try {
    const res = await updateOrderStatus(row._id, 'confirmed')
    if (res.errcode === 0 || res.success) {
      ElMessage.success('接单成功')
      loadOrders()
    } else {
      ElMessage.error(res.errmsg || res.error || '接单失败')
    }
  } catch (err) {
    console.error('接单失败', err)
    ElMessage.error('接单失败')
  }
}

const cancelOrder = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      type: 'warning'
    })

    console.log('取消订单，订单 ID:', row._id)
    const res = await updateOrderStatus(row._id, 'cancelled')
    console.log('取消订单响应:', res)
    
    if (res.errcode === 0 || res.success) {
      ElMessage.success('订单已取消')
      loadOrders()
    } else {
      const errorMsg = res.errmsg || res.error || res.message || '取消失败'
      ElMessage.error(errorMsg)
    }
  } catch (err) {
    console.error('取消订单失败，完整错误:', err)
    if (err !== 'cancel') {
      ElMessage.error('取消失败：' + (err.message || '未知错误'))
    }
  }
}

const completeOrder = async (row) => {
  try {
    const res = await updateOrderStatus(row._id, 'completed')
    if (res.errcode === 0 || res.success) {
      ElMessage.success('订单已完成')
      loadOrders()
    } else {
      ElMessage.error(res.errmsg || res.error || '操作失败')
    }
  } catch (err) {
    console.error('操作失败', err)
    ElMessage.error('操作失败')
  }
}

const getStatusText = (status) => {
  return statusMap[status] || status
}

const getStatusType = (status) => {
  return statusTypeMap[status] || ''
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-page {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.item-row {
  font-size: 13px;
  color: #666;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>