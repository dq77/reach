##### 项目说明
**本项目默认使用者熟悉浏览器F12开发者工具与Nginx安装配置**

本项目用于查询睿驰人员列表，目前为nginx配置反向代理至 [https://account.italent.cn/](https://account.italent.cn/) 。
由于需要网站Token才可使用，需要先在  [https://www.italent.cn/Login](https://www.italent.cn/Login) 中登录并手动获取 `Cookie` 粘贴至本系统。

##### 使用方式
首先在项目代码的`src/api.js`中确认定义的域名(baseURL)是否可用，**如果不可用需要更换域名**

```
const instance = axios.create({
  baseURL: 'https://test.domain.com/reach', // 此处设置baseURL
  withCredentials: true,
  timeout: 50000,
});
```

> 域名后面的请求前缀'reach'不要改，不用管。
>
> 请确保域名已做好解析并且正确配置了证书

然后在域名对应的服务器上配置nginx的代理转发规则如下：

> 此处假设在`src/api.js`中配置的baseURL为'test.domain.com'

```
    server {
        listen 80;
        server_name test.domain.com;
        
        location /reach/ {
            if ($arg_cookievalue) {
                add_header Access-Control-Allow-Origin $http_origin;
                add_header Access-Control-Allow-Credentials true;
                add_header Set-Cookie "ssn_Tita_PC=$arg_cookievalue; Path=/; SameSite=None; Secure";
                add_header Content-Type text/html;
                return 200 "Parameter received: $arg_cookievalue";
            }
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Credentials true;
            proxy_pass https://account.italent.cn/;
            proxy_intercept_errors on;
            rewrite ^/reach/(.*)$/$1 break;
            error_page 302 =200 /cookieOut;
        }
        location = /cookieOut {
            add_header Content-Type text/html;
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Credentials true;
            return 200 'Redirect was intercepted.';
        }
    }
```

至此服务端配置完毕，接下来配置客户端

`npm run dev` 启动本项目。此处不做具体讲解。

项目启动后会弹窗提示设置Cookie，访问[https://www.italent.cn/Login](https://www.italent.cn/Login) ，登录后在F12中查看 "Cookie" 。获取 "Cookie" 中的 "ssn_Tita_PC" 字段值，复制并粘贴至输入框。

设置好cookie后刷新页面即可。


##### 请求缓存

各部门人数存放在本地`localStorage`中的 `departData` 字段，如需刷新各部门人数请删除该字段内容，然后刷新网页。

员工邮箱及入职时间存放在本地`localStorage`中的 `userData` 字段，不建议删除该字段，因为这些信息基本不会有改动，如需强制刷新，和上面一样操作。

更多功能待开发