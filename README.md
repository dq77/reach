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

服务端部署一共有两种方式，分别为 **服务器Nginx模式** 和 **Cloudflare Worker模式**



##### 首先说第一种：服务器Nginx模式

> 请确保域名已做好解析并且正确配置了证书
>
> 此处假设在`src/api.js`中配置的baseURL为'https://test.domain.com/reach'

然后在域名对应的服务器上配置nginx的代理转发规则如下：

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

配置好后别忘了重启nginx配置生效。至此服务端配置完毕，接下来配置客户端。



##### 第二种模式：Cloudflare Worker模式

新建一个Cloudflare的Worker，名字随便起，内容全文粘贴如下：

```
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // 检查是否是预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // 设置客户端cookie请求
  const cookieValue = url.searchParams.get('cookievalue');
  if (cookieValue) {
    return new Response('Parameter received: ' + cookieValue, {
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Set-Cookie': `ssn_Tita_PC=${cookieValue}; Path=/; SameSite=None; Secure`,
        'Content-Type': 'text/html'
      }
    });
  }

  // 移除URL中的reach前缀
  let pathname = url.pathname;
  if (pathname.startsWith('/reach/')) {
    pathname = pathname.replace('/reach/', '/');
  }

  // 转发请求到目标服务器
  const targetUrl = new URL('https://account.italent.cn' + pathname);

  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });
  const modifiedRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  try {
    let response = await fetch(modifiedRequest);

    // 克隆响应并添加 CORS 头
    response = new Response(response.body, response);
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}
```

然后发布Worker，新建一个自定义二级域名 test.domain.com 即可。

> 此处假设在`src/api.js`中配置的baseURL为'https://test.domain.com/reach'。



#### 本地客户端

`npm run dev` 启动本项目。

项目首次启动会弹窗提示设置Cookie，访问[https://www.italent.cn/Login](https://www.italent.cn/Login) ，登录后在F12中查看 "Cookie" 。获取 "Cookie" 中的 "ssn_Tita_PC" 字段值，复制并粘贴至输入框。

设置好cookie后刷新页面即可。

#### 客户端部署

`npm run build` 对项目打包，打包后的文件在 `docs` 目录下，复制到Nginx静态资源目录或者上传至Github Page即可使用，项目已配置好CORS策略。


#### 请求缓存

各部门人数存放在本地`localStorage`中的 `departData` 字段，如需刷新各部门人数请点击`人数刷新`按钮。

> 刷新人数为敏感操作，对服务器资源压力极大，建议不要频繁刷新人数记录。

员工邮箱及入职时间存放在本地`localStorage`中的 `userData` 字段，不建议删除该字段，因为这些信息基本不会有改动，如需强制刷新，请删除该字段内容，然后刷新网页。

更多功能待开发......