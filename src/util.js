import instance from './api'

export async function getTreeData() {
  const tree = []
  const res = await instance.get(`reach/Contacts/AllowDepartment?t=${new Date().getTime()}`)
  if (res.Code === 1) {
    // 先筛出来一级 再二级 再三级 为避免重复遍历 筛完的不再参与下次筛选
    const level2 = [] // 筛选完一级后剩下的
    const level3 = [] // 筛选完二级后剩下的
    res.Data.forEach(item => {
      if (item.level === 1) {
        tree.push(item)
      } else {
        level2.push(item)
      }
    })
    // 剔除一级后剩下的二级和三级数据
    level2.forEach(item => {
      if (item.level === 2) {
        const parentNode = tree.find(parent => parent.id === item.pid)
        parentNode.children || (parentNode.children = [])
        parentNode.children.push(item)
      } else {
        level3.push(item)
      }
    })
    // 剔除一二级后剩下的三级数据 还有个零级没用这里扔掉不要了
    level3.forEach(item => {
      if (item.level === 3) {
        const parentNode = level2.find(parent => parent.id === item.pid)
        parentNode.children || (parentNode.children = [])
        parentNode.children.push(item)
      }
    })
    return tree
  } else if (res.includes('登录失效')) {
    return '登录失效'
  }
}

export async function getDepartAllUser(departmentId) {
  const mergeUserList = []
  let total = 0
  let pageNum = 1

  const getData = async () => {
    const res = await instance.get('reach/Contacts/staffV2', {
      params: { 'page_num': pageNum, 'page_size': 100, 'department_id': departmentId, 'content': '' }
    })
    if (res.Code === 1 && res.Data) {
      total = res.Data.total
      if (res.Data.users?.length) {
        mergeUserList.push(...res.Data.users)
        pageNum += 1
      }
    }
  }
  await getData()
  while (mergeUserList.length < total) {
    await getData()
  }
  return mergeUserList
}