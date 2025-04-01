<script setup>
import { onMounted, ref, computed } from 'vue'
import instance from './api'
import throttle from 'lodash/throttle'
import { Search } from '@element-plus/icons-vue'

const tree = ref([])
const showDialog = ref(false)
onMounted(async () => {
  await getTree()
})

const getTree = async () => {
  const res = await instance.get('Contacts/AllowDepartment', {
    params: { 'quark_s': '1ec5eb2cd9eaf8d3fbe130f5622c1ff5fe0e976e2c0f21da3beadc30e5c55bd5' } // 东软睿驰公司ID
  })
  if (res.Code === 1) {
    // 先筛出来一级 再二级 再三级 为避免重复遍历 筛完的不再参与下次筛选
    const level2 = [] // 筛选完一级后剩下的
    const level3 = [] // 筛选完二级后剩下的
    res.Data.forEach(item => {
      if (item.level === 1) {
        tree.value.push(item)
      } else {
        level2.push(item)
      }
    })
    // 剔除一级后剩下的二级和三级数据
    level2.forEach(item => {
      if (item.level === 2) {
        const parentNode = tree.value.find(parent => parent.id === item.pid)
        parentNode.children || (parentNode.children = [])
        parentNode.children.push(item)
      } else {
        level3.push(item)
      }
    })
    // 剔除一二级后剩下的三级数据 还有个零级东软睿驰这里扔掉不要了
    level3.forEach(item => {
      if (item.level === 3) {
        const parentNode = level2.find(parent => parent.id === item.pid)
        parentNode.children || (parentNode.children = [])
        parentNode.children.push(item)
      }
    })
  } else if (res === 'Redirect was intercepted.') {
    ElMessage({
      message: 'Cookie失效，请重新设置Cookie',
      type: 'error',
    })
    showDialog.value = true
  }
  // 进来默认展示全部数据
  await search()
  getDepartNum()
}

const flashIndex = ref(0)
const totalLength = ref(0)
const getDepartNum = async () => {
  const departData = localStorage.getItem('departData') ? JSON.parse(localStorage.getItem('departData')) : []
  const oldDepartData = localStorage.getItem('oldDepartData') ? JSON.parse(localStorage.getItem('oldDepartData')) : []
  let list = tree.value
  list.forEach(item => {
    if (item.children && Array.isArray(item.children)) {
      list = list.concat(item.children);
    }
  })
  flashIndex.value = 0
  totalLength.value = list.length
  for (const treeItem of list) {
    const localDepartItem = departData.find(ele => ele.id === treeItem.id)
    const oldLocalDepartItem = oldDepartData.find(ele => ele.id === treeItem.id) || {}
    if (localDepartItem) {
      treeItem.num = localDepartItem.num
      treeItem.oldNum = oldLocalDepartItem.num
      treeItem.users = localDepartItem.users || []
      treeItem.showName = `${treeItem.name}(${treeItem.oldNum ? treeItem.oldNum + '>' : ''}${treeItem.num})`
    } else {
      const res = await instance.get('Contacts/staffV2', {
        params: { 'page_num': 1, 'page_size': 100, 'department_id': treeItem.id, 'content': '' }
      })
      if (res.Code === 1 && res.Data) {
        treeItem.num = res.Data.total || 0
        treeItem.oldNum = oldLocalDepartItem.num
        treeItem.users = res.Data.users?.map(item => { return item.name }) || []
        treeItem.showName = `${treeItem.name}(${treeItem.oldNum ? treeItem.oldNum + '>' : ''}${treeItem.num})`
      }
      departData.push({
        id: treeItem.id,
        users: treeItem.users,
        num: treeItem.num,
        oldNum: treeItem.oldNum,
        name: treeItem.name,
      })
    }
    flashIndex.value = flashIndex.value + 1
  }
  ElMessage({ message: '加载完成', type: 'success' })
  localStorage.setItem('departData', JSON.stringify(departData))
}


const flashDialog = ref(false)
const percentage = computed(() => {
  return totalLength.value ? (flashIndex.value * 100 / totalLength.value) : 0
})
const flash = async () => {
  const departData = localStorage.getItem('departData')
  if (!departData) {
    return ElMessage({
      message: '正在刷新中，请稍后重试......',
      type: 'warning',
    })
  }
  await ElMessageBox.confirm('刷新将会耗费大量服务器资源，且耗时较长。是否确认继续刷新？', '建议不要频繁刷新',
    { confirmButtonText: '是', cancelButtonText: '否', type: 'warning', }
  )
  flashDialog.value = true
  localStorage.setItem('oldDepartData', departData)
  localStorage.removeItem('departData')
  getDepartNum()
}

const getUserDetail = async () => {
  const userData = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : []
  for (const item of userList.value) {
    if (item.Email) continue
    const localUserItem = userData.find(ele => ele.userId === item.userId)
    if (localUserItem) {
      item.Email = localUserItem.Email
      item.EmployedDate = localUserItem.EmployedDate
    } else {
      const res = await instance.get('Contacts/GetUserInfoById', {
        params: {
          'toUserId': item.userId,
        }
      })
      if (res.Code === 200) {
        item.Email = res.Data.Email
        item.EmployedDate = res.Data.EmployedDate
        item.name = res.Data.Name
      }
      userData.push({
        userId: item.userId,
        name: item.name,
        Email: item.Email,
        EmployedDate: item.EmployedDate
      })
    }
  }
  localStorage.setItem('userData', JSON.stringify(userData))
}

const loading = ref(true)
const pageNum = ref(1)
const departmentId = ref(0)
const total = ref(0)
const userList = ref([])
const isSearch = ref(false)
const searchText = ref('')
const getData = async(treeItem) => {
  // 部门点击和搜索调用不同的接口
  const api = isSearch.value ? 'Contacts/searchV2' : 'Contacts/staffV2'
  const res = await instance.get(api, {
    params: {
      'page_num': pageNum.value,
      'page_size': 50,
      'department_id': departmentId.value,
      'content': searchText.value
    }
  })
  if (res.Code === 1) {
    if (res.Data) {
      total.value = res.Data.total
      userList.value.push(...res.Data.users)
      loading.value = userList.value.length < total.value
      getUserDetail()
    } else {
      total.value = 0
      userList.value = []
      loading.value = false
    }
  }
}

// 部门点击
const handleNodeClick = async (data) => {
  if (departmentId.value === data.id && isSearch.value === false) return false
  isSearch.value = false
  searchText.value = ''
  loading.value = true
  departmentId.value = data.id
  pageNum.value = 1
  total.value = 0
  userList.value = []
  getData(data)
}

// 搜索按钮
const search = async() => {
  isSearch.value = true
  loading.value = true
  pageNum.value = 1
  total.value = 0
  userList.value = []
  await getData()
}

// 滚动到最下边触发继续加载
const scrollbarRef = ref(null)
const barScroll = throttle(function(e) {
  // 当 可滚动区域总高度 = 已滚动距离 - 可视窗口高度， 则表示滚动到底了
  if(scrollbarRef.value.wrapRef.scrollHeight - e.scrollTop - scrollbarRef.value.wrapRef.clientHeight === 0) {
    if (userList.value.length < total.value) {
      pageNum.value += 1
      getData()
    }
  }
}, 500)

// 点击名片触发获取用户邮箱和入职时间
const getUserInfo = async (item) => {
  if (item.Email) return false
  const res = await instance.get('Contacts/GetUserInfoById', {
    params: {
      'toUserId': item.userId,
    }
  })
  if (res.Code === 200) {
    item.Email = res.Data.Email
    item.EmployedDate = res.Data.EmployedDate
  }
}
const cookieInput = ref('')
const handleClose = async () => {
  if (!cookieInput.value) {
    return ElMessage({
      message: '请输入ssn_Tita_PC',
      type: 'error',
    })
  }
  // 设置Cookie
  await instance.get('setCookie', {
    params: {
      'cookievalue': cookieInput.value,
    }
  })
  showDialog.value = false
  getTree()
}

const showChange = () => {
  // 仅限前100人对比
  const oldDepartDataStr = localStorage.getItem('oldDepartData')
  const departDataStr = localStorage.getItem('departData')
  if (!oldDepartDataStr || !departDataStr) {
    return ElMessage({
      message: '不存在历史数据，请先进行人数刷新',
      type: 'error',
    })
  }
  const oldDepartData = JSON.parse(oldDepartDataStr)
  const departData = JSON.parse(departDataStr)
  const oldUsers = oldDepartData.find(item => item.id === departmentId.value)?.users || []
  const newUsers = departData.find(item => item.id === departmentId.value)?.users || []
  const addUsers = newUsers.filter(item => !oldUsers.includes(item))
  const delUsers = oldUsers.filter(item => !newUsers.includes(item))
  if (addUsers.length) {
    ElMessage({
      message: `新增：${addUsers.join(',')}`,
      type: 'warning',
    })
  }
  if (delUsers.length) {
    ElMessage({
      message: `删除：${delUsers.join(',')}`,
      type: 'warning',
    })
  }

}

</script>

<template>
  <div class="main">
    <div class="left-area">
      <el-scrollbar class="scrollMenuBox">
        <el-tree
          class="left-tree"
          :data="tree"
          :props="{ children: 'children', label: 'showName' }"
          @node-click="handleNodeClick"
        />
      </el-scrollbar>
    </div>
    <div class="right-area">
      <div class="top">
        <el-input v-model="searchText" class="search-input" :prefix-icon="Search" placeholder="搜索" clearable></el-input>
        <el-button @click="search" class="search-btn" type="primary">搜索</el-button>
        <el-button @click="flash" class="flash-btn" type="warning">人数刷新</el-button>
        <el-button @click="showChange" class="flash-btn" type="success">成员对比</el-button>
        <div class="tips" v-if="userList[0]">共<span class="num">{{ total }}</span>人</div>
      </div>
      <el-scrollbar class="scrollMenuBox" @scroll="barScroll" ref="scrollbarRef">
        <div v-for="item in userList" class="person" :key="item.userId" @click="getUserInfo(item)">
            <div class="name">{{ item.name }}</div>
            <div class="department">{{ item.departmentPath.slice(5) }}</div>
            <div class="department">{{ item.Email ? 'Email：' : ' ' }}{{ item.Email }}</div>
            <div class="department">{{ item.EmployedDate ? '入职日期：' : ' ' }}{{ item.EmployedDate ? item.EmployedDate.slice(0, 10) : '' }}</div>
        </div>
        <div class="loading">{{ loading ? '正在加载中......' : `共${userList.length}人` }}</div>
      </el-scrollbar>
    </div>
  </div>
  <el-dialog v-model="showDialog" title="输入Cookie" width="730" :before-close="handleClose">
    <div class="dialog-tips">
      <span>本系统依赖网站Cookie方可使用，请登录 </span>
      <el-link href="https://www.italent.cn/Login" target="_blank" type="primary">https://www.italent.cn/Login</el-link>
      <span>，在F12中查看 "Cookie" 。获取 "Cookie" 中的 "ssn_Tita_PC" 字段值，复制并粘贴至下方。</span>
    </div>
    <div style="margin-top: 8px">
      <el-input v-model="cookieInput" class="cookie-input" placeholder="HLiBrc4kK04L......">
        <template #prepend>ssn_Tita_PC</template>
      </el-input>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleClose">确认</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog
    v-model="flashDialog"
    :close-on-click-modal='false'
    :show-close='false'
    title="刷新中，请稍候"
    width="500"
  >
    <el-text v-if="flashIndex !== totalLength" class="mx-1" type="primary">刷新中请不要关闭本页面，请耐心等待。</el-text>
    <el-text v-else class="mx-1" type="success">刷新完成！</el-text>
    <el-progress :percentage='percentage' :showText='false' :stroke-width="15" :status="flashIndex === totalLength ? 'success' : ''" style='margin: 14px 0;'/>
    <span>{{ flashIndex }} / {{ totalLength }}</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :disabled='flashIndex !== totalLength' @click="flashDialog = false">
          完成
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss">
.main{
  display: flex;
  .left-area{
    margin-left: 100px;
    width: 400px;
    .scrollMenuBox{
      height: 100vh;
      .left-tree{
        margin: 30px 0;
      }
    }
  }
  .right-area{
    flex: 1;
    background-color: rgb(247, 249, 250);
    .top{
      height: 60px;
      padding-top: 20px;
      border-bottom: 1px solid #bee1f5;
      .search-input{
        width: 200px;
        margin-left: 16px;
      }
      .search-btn{
        margin-left: 16px;
      }
      .flash-btn{
        margin-left: 26px;
      }
      .tips{
        margin-top: 6px;
        font-size: 14px;
        margin-left: 16px;
        .num{
          color: #fd8f46;
          margin: 0 4px;
        }
      }
    }
    .scrollMenuBox{
      height: calc(100vh - 81px);
      .person{
        display: inline-block;
        width: 240px;
        height: 80px;
        margin-top: 20px;
        margin-left: 20px;
        background-color: #fff;
        padding: 12px 6px;
        box-shadow: 0px 0px 8px rgba($color: #666, $alpha: 0.25);
        transition: all 0.3s;
        &:hover{
          box-shadow: 2px 2px 16px rgba($color: #666, $alpha: 0.2);
        }
        .name{
          font-weight: bold;
          font-size: 18px;
          line-height: 18px;
          color: #666;
          margin-left: 4px;
          margin-bottom: 8px;
        }
        .department{
          margin-top: 4px;
          height: 16px;
          line-height: 16px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          color: #999;
        }
      }
      .loading{
        text-align: center;
        padding-bottom: 30px;
        padding-top: 20px;
        padding-right: 20%;
      }
    }
  }
}
.dialog-tips{
  display: inline;
  font-size: 14px;
  line-height: 18px;
  margin-bottom: 8px;
  .el-link{
    display: inline;
    vertical-align: bottom;
  }
}
</style>
