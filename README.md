#### 项目说明
**本项目默认使用者熟悉浏览器F12开发者工具与Nginx安装配置**

本项目用于查询睿驰人员列表，目前为nginx配置反向代理至 [https://account.italent.cn/](https://account.italent.cn/) 。
由于需要网站Token才可使用，需要先在  [https://www.italent.cn/Login](https://www.italent.cn/Login) 中登录并手动获取 `Cookie` 粘贴至本系统。

#### 使用方式
首先在项目代码的`src/api.js`中确认定义的域名(baseURL)是否可用，**如果不可用需要更换域名**

```
const instance = axios.create({
  baseURL: 'https://test.domain.com/reach', // 此处设置baseURL
  withCredentials: true,
  timeout: 50000,
});
```

> 域名后面的请求前缀'reach'不要改，不用管。

服务端部署在腾讯云边缘加速服务EO 类似于Cloudflare Worker



登录腾讯云边缘加速服务EdgeOne，新建一个EO的Makers项目，从Github导入：https://github.com/dq77/api

#### 本地客户端

`npm run dev` 启动本项目。

项目首次启动会弹窗提示设置Cookie，访问[https://www.italent.cn/Login](https://www.italent.cn/Login) ，登录后在F12中查看 "Cookie" 。获取 "Cookie" 中的 "ssn_Tita_PC" 字段值，复制并粘贴至输入框。

设置好cookie后刷新页面即可。


#### 请求缓存

各部门人数存放在本地`localStorage`中的 `departData` 字段，如需刷新各部门人数请点击`人数刷新`按钮。

> 刷新人数为敏感操作，对服务器资源压力极大，建议不要频繁刷新人数记录。

员工邮箱及入职时间存放在本地`localStorage`中的 `userData` 字段，不建议删除该字段，因为这些信息基本不会有改动，如需强制刷新，请删除该字段内容，然后刷新网页。

更多功能待开发......