##### 项目说明
用于查询睿驰人员列表，目前为本地vite配置反向代理至 [https://account.italent.cn/](https://account.italent.cn/) 。
暂时只支持本地起项目使用，由于需要网站Token才可使用，需要先在  [https://www.italent.cn/Login](https://www.italent.cn/Login) 中登录并手动获取 `Cookie` 粘贴至本系统。

##### 使用方式
1. `npm install`
2. `npm run dev`
3. 浏览器打开 [http://localhost:5173/](http://localhost:5173/)
4. 按照弹窗中的提示，登录 [https://www.italent.cn/Login](https://www.italent.cn/Login) ，在F12中查看 `Cookie` ，获取 `Cookie` 中的 `ssn_Tita_PC` 字段值，复制出来。
5. 将 `ssn_Tita_PC` 的值粘贴到弹窗中，并点击确定。 `ssn_Tita_PC` 的值一般如下图所示

```
HLiBrc4k-04LR2Bb4h1x_BUUybQ5BshRmmvpYBVY-79Br_eGiHmtYaUbA-4bWCI'
```


##### 请求缓存

各部门人数存放在本地`localStorage`中的 `departData` 字段，如需刷新各部门人数请删除该字段内容，然后刷新网页。

员工邮箱及入职时间存放在本地`localStorage`中的 `userData` 字段，不建议删除该字段，因为这些信息基本不会有改动，如需强制刷新，和上面一样操作。

更多功能待开发