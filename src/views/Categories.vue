<template>
  <div class="categories-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加分类
          </el-button>
        </div>
      </template>

      <el-table :data="categories" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="dishCount" label="菜品数量" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="deleteCategory(row.name)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="添加分类" width="400px">
      <el-form :model="form" ref="formRef">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as api from '@/utils/api'

const loading = ref(false)
const submitting = ref(false)
const categories = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const form = reactive({
  name: ''
})

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await api.getCategories()
    let parsedData = res.resp_data
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData)
    }
    if (res.errcode === 0 || res.success || parsedData.success) {
      const categoryNames = parsedData.categories || []
      const allDishes = await api.getDishes({ pageSize: 1000 })
      let parsedDishes = allDishes.resp_data
      if (typeof parsedDishes === 'string') {
        parsedDishes = JSON.parse(parsedDishes)
      }
      const dishes = parsedDishes.dishes || []
      const countMap = {}
      dishes.forEach(dish => {
        if (dish.category) {
          countMap[dish.category] = (countMap[dish.category] || 0) + 1
        }
      })
      categories.value = categoryNames.map(name => ({
        name,
        dishCount: countMap[name] || 0
      }))
    } else {
      ElMessage.error(parsedData.error || '加载分类失败')
    }
  } catch (err) {
    console.error('加载分类失败', err)
    ElMessage.error('加载分类失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  form.name = ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  submitting.value = true
  try {
    const res = await api.addCategory(form.name)
    let parsedData = res.resp_data
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData)
    }
    if (res.errcode === 0 || res.success || parsedData.success) {
      ElMessage.success('添加成功')
      dialogVisible.value = false
      loadCategories()
    } else {
      ElMessage.error(parsedData.error || '添加失败')
    }
  } catch (err) {
    console.error('添加失败', err)
    ElMessage.error('添加失败')
  } finally {
    submitting.value = false
  }
}

const deleteCategory = async (name) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${name}"吗？该分类下的所有菜品也会被删除。`, 
      '提示', 
      { type: 'warning' }
    )

    const res = await api.deleteCategory(name)
    let parsedData = res.resp_data
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData)
    }
    if (res.errcode === 0 || res.success || parsedData.success) {
      ElMessage.success('删除成功')
      loadCategories()
    } else {
      ElMessage.error(parsedData.error || '删除失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除失败', err)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.categories-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>