#### 项目说明



##### 首先在服务端部署：Cloudflare Worker

新建一个Cloudflare的Worker，名字随便起，把本项目的 `src/cloudflare.js` 文件内容全部粘贴进去。然后发布Worker，新建一个自定义二级域名 test.domain.com 即可。名字随便起。



然后在项目代码的`src/api.js`中的域名(baseURL)字段填写入刚才自定义的二级域名，比如test.domain.com。

```
const instance = axios.create({
  baseURL: 'https://test.domain.com', // 此处设置baseURL
  withCredentials: true,
  timeout: 50000,
});
```





#### 本地客户端

`npm run dev` 启动本项目。

项目首次启动会弹窗提示输入用户名，此处用户名为访问[https://www.italent.cn/Login](https://www.italent.cn/Login) 的用户名，不带邮箱后缀。

#### 客户端部署

`npm run build` 对项目打包，打包后的文件在 `docs` 目录下，复制到Nginx静态资源目录或者上传至Github Page即可使用，项目已配置好CORS策略。


#### 请求缓存

各部门人数存放在本地`localStorage`中的 `departData` 字段，如需刷新各部门人数请点击`人数刷新`按钮。

> 刷新人数为敏感操作，对服务器资源压力极大，建议不要频繁刷新人数记录。

员工邮箱及入职时间存放在本地`localStorage`中的 `userData` 字段，不建议删除该字段，因为这些信息基本不会有改动，如需强制刷新，请删除该字段内容，然后刷新网页。

更多功能待开发......