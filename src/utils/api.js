import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
const ENV_ID = import.meta.env.VITE_ENV_ID || 'cloudbase-8ggmg3nbd4b2ced5'

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API 请求失败:', error)
    return Promise.reject(error)
  }
)

export async function callCloudFunction(name, data) {
  try {
    const result = await apiClient.post('/api/call', { 
      name, 
      data, 
      env: ENV_ID 
    })
    return result
  } catch (err) {
    console.error('调用云函数失败:', err)
    throw err
  }
}

export async function getDishes(params = {}) {
  return callCloudFunction('admin', { type: 'getDishList', ...params })
}

export async function addDish(data) {
  return callCloudFunction('admin', { type: 'addDish', ...data })
}

export async function updateDish(data) {
  return callCloudFunction('admin', { type: 'updateDish', ...data })
}

export async function deleteDish(dishId) {
  return callCloudFunction('admin', { type: 'deleteDish', dishId })
}

export async function getCategories() {
  return callCloudFunction('admin', { type: 'getCategories' })
}

export async function addCategory(category) {
  return callCloudFunction('admin', { type: 'addCategory', category })
}

export async function deleteCategory(category) {
  return callCloudFunction('admin', { type: 'deleteCategory', category })
}

export async function getOrders(params = {}) {
  return callCloudFunction('admin', { type: 'getAllOrders', ...params })
}

export async function getOrderDetail(orderId) {
  return callCloudFunction('admin', { type: 'getOrderDetail', orderId })
}

export async function updateOrderStatus(orderId, status) {
  return callCloudFunction('admin', { 
    type: 'updateOrderStatus', 
    orderId, 
    status,
    isAdmin: true  // 标记为管理员操作，跳过权限验证
  })
}

export async function getDashboard() {
  return callCloudFunction('admin', { type: 'getDashboard' })
}

export async function getTempFileURL(fileId) {
  return callCloudFunction('uploadImage', { type: 'getTempFileURL', fileId })
}