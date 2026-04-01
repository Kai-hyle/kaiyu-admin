<template>
  <div class="dishes-page">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加菜品
        </el-button>
        <el-select v-model="filterCategory" placeholder="分类筛选" clearable @change="loadDishes">
          <el-option label="全部" value="" />
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </div>

      <el-table :data="dishes" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="菜品名称" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="getImageUrl(row)"
              style="width: 60px; height: 60px"
              fit="cover"
              :preview-src-list="[getImageUrl(row)]"
            />
            <span v-else style="color: #888;">暂无</span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteDishHandler(row)">删除</el-button>
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
          @size-change="loadDishes"
          @current-change="loadDishes"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜品' : '添加菜品'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="菜品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜品名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="烤串" value="烤串" />
            <el-option label="海鲜" value="海鲜" />
            <el-option label="酒水" value="酒水" />
            <el-option label="主食" value="主食" />
            <el-option label="凉菜" value="凉菜" />
            <el-option label="蔬菜" value="蔬菜" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :precision="1" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入菜品描述"
          />
        </el-form-item>
        <el-form-item label="图片" prop="imageUrl">
          <div class="image-upload-wrap">
            <el-upload
              class="image-uploader"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
            >
              <div v-if="form.imageUrl" class="preview-box">
                <el-image
                  :src="form.imageUrl"
                  style="width: 100px; height: 100px"
                  fit="cover"
                />
                <div class="upload-mask">点击更换</div>
              </div>
              <div v-else class="upload-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span>上传图片</span>
              </div>
            </el-upload>
            <el-input 
              v-model="form.imageUrl" 
              placeholder="或输入图片 URL" 
              style="margin-top: 10px;"
            />
          </div>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as api from '@/utils/api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
const ENV_ID = import.meta.env.VITE_ENV_ID || 'cloudbase-8ggmg3nbd4b2ced5'
const uploadUrl = `${API_BASE}/api/upload`

const loading = ref(false)
const submitting = ref(false)
const uploading = ref(false)
const dishes = ref([])
const dishImages = ref({})
const categories = ref([])
const filterCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  dishId: '',
  name: '',
  category: '',
  price: 0,
  sort: 0,
  description: '',
  imageUrl: ''
})

const getImageUrl = (dish) => {
  if (!dish.imageUrl) return ''
  
  if (dish.imageUrl.startsWith('http')) {
    return dish.imageUrl
  }
  
  if (dishImages.value[dish._id]) {
    return dishImages.value[dish._id]
  }
  
  return dish.imageUrl
}

const batchLoadImageUrls = async (dishList) => {
  const needLoad = dishList.filter(d => 
    d.imageUrl && 
    !d.imageUrl.startsWith('http') && 
    !dishImages.value[d._id]
  )

  if (needLoad.length === 0) return

  for (const dish of needLoad) {
    try {
      const res = await api.getTempFileURL(dish.imageUrl)
      let parsedData = res.resp_data
      if (typeof parsedData === 'string') {
        parsedData = JSON.parse(parsedData)
      }
      if (res.errcode === 0 || parsedData.success) {
        dishImages.value[dish._id] = parsedData.url || dish.imageUrl
      }
    } catch (err) {
      console.error('获取图片URL失败', err)
    }
  }
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  uploading.value = true
  return true
}

const handleUploadSuccess = (response) => {
  uploading.value = false
  if (response.success) {
    form.imageUrl = response.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.error || '上传失败')
  }
}

const handleUploadError = (err) => {
  uploading.value = false
  ElMessage.error('上传失败: ' + (err.message || '请检查网络'))
}

const rules = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

const loadDishes = async () => {
  loading.value = true
  try {
    const res = await api.getDishes({
      category: filterCategory.value || undefined,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    let parsedData = res.resp_data
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData)
    }
    if (res.errcode === 0 || res.success || parsedData.success) {
      const dishList = parsedData.dishes || []
      dishes.value = dishList
      total.value = parsedData.total || 0
      batchLoadImageUrls(dishList)
    } else {
      ElMessage.error(parsedData.error || '加载菜品失败')
    }
  } catch (err) {
    console.error('加载菜品失败', err)
    ElMessage.error('加载菜品失败: ' + (err.message || '请检查后台服务是否启动'))
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await api.getCategories()
    let parsedData = res.resp_data
    if (typeof parsedData === 'string') {
      parsedData = JSON.parse(parsedData)
    }
    if (res.errcode === 0 || res.success || parsedData.success) {
      categories.value = parsedData.categories || []
    }
  } catch (err) {
    console.error('加载分类失败', err)
  }
}

const showAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    dishId: '',
    name: '',
    category: '',
    price: 0,
    sort: 0,
    description: '',
    imageUrl: ''
  })
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, {
    dishId: row._id,
    name: row.name,
    category: row.category,
    price: row.price,
    sort: row.sort || 0,
    description: row.description || '',
    imageUrl: row.imageUrl || ''
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const apiFn = isEdit.value ? api.updateDish : api.addDish
      const res = await apiFn({
        dishId: form.dishId,
        name: form.name,
        category: form.category,
        price: form.price,
        sort: form.sort,
        description: form.description,
        imageUrl: form.imageUrl
      })
      if (res.errcode === 0 || res.success) {
        ElMessage.success(isEdit.value ? '编辑成功' : '添加成功')
        dialogVisible.value = false
        loadDishes()
        loadCategories()
      } else {
        ElMessage.error(res.errmsg || res.error || '操作失败')
      }
    } catch (err) {
      console.error('操作失败', err)
      ElMessage.error('操作失败: ' + (err.message || '请检查后台服务是否启动'))
    } finally {
      submitting.value = false
    }
  })
}

const toggleStatus = async (row) => {
  try {
    const newStatus = row.status === 1 ? 0 : 1
    const res = await api.updateDish({
      dishId: row._id,
      status: newStatus
    })
    if (res.errcode === 0 || res.success) {
      ElMessage.success(newStatus === 1 ? '上架成功' : '下架成功')
      loadDishes()
    } else {
      ElMessage.error(res.errmsg || res.error || '操作失败')
    }
  } catch (err) {
    console.error('操作失败', err)
    ElMessage.error('操作失败: ' + (err.message || '请检查后台服务是否启动'))
  }
}

const deleteDishHandler = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该菜品吗？', '提示', {
      type: 'warning'
    })

    const res = await api.deleteDish(row._id)
    if (res.errcode === 0 || res.success) {
      ElMessage.success('删除成功')
      loadDishes()
      loadCategories()
    } else {
      ElMessage.error(res.errmsg || res.error || '删除失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除失败', err)
      ElMessage.error('删除失败: ' + (err.message || '请检查后台服务是否启动'))
    }
  }
}

onMounted(() => {
  loadDishes()
  loadCategories()
})
</script>

<style scoped>
.dishes-page {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.image-upload-wrap {
  width: 100%;
}

.image-uploader {
  display: inline-block;
}

.preview-box {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-box:hover .upload-mask {
  opacity: 1;
}

.upload-placeholder {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-placeholder:hover {
  border-color: #D4AF37;
}

.upload-icon {
  font-size: 24px;
  color: #8c939d;
}

.upload-placeholder span {
  font-size: 12px;
  color: #8c939d;
  margin-top: 8px;
}
</style>