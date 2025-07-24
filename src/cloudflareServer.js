addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const headers = {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true'
  }
  
  // 预检请求返回允许跨域
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  // 根据URL匹配路由
  const url = new URL(request.url);
  let pathname = url.pathname;
  let targetUrl

  // reach搜路由
  if (pathname.startsWith('/reach/')) {

    // 处理 cookie 设置请求
    const cookieValue = url.searchParams.get('cookievalue');
    if (cookieValue) {
      return new Response('Parameter received: ' + cookieValue, {
        headers: { ...headers,
          'Set-Cookie': `ssn_Tita_PC=${cookieValue}; Path=/; SameSite=None; Secure`,
        }
      });
    }
    pathname = pathname.replace('/reach/', '/');
    targetUrl = new URL('https://account.italent.cn' + pathname);
  } else if (pathname.startsWith('/loginehr/')) {
    pathname = pathname.replace('/loginehr/', '/');
    targetUrl = new URL('https://www.italent.cn' + pathname);
  } else if (pathname.startsWith('/weather/')) {
    pathname = pathname.replace('/weather/', '/');
    targetUrl = new URL('https://products.weather.com.cn' + pathname);
  } else if (pathname.startsWith('/totalweather/')) {
    pathname = pathname.replace('/totalweather/', '/');
    targetUrl = new URL('https://d1.weather.com.cn' + pathname);
  }

  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });
  const modifiedRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  if (targetUrl.toString().includes('d1.weather.com.cn')) {
    modifiedRequest.headers.set('Referer', 'https://www.weather.com.cn/');
  }

  try {
    let response = await fetch(modifiedRequest);

    // 克隆响应并添加 CORS 头
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

    // 获取所有 Set-Cookie 头 睿驰搜登录用
    const setCookies = response.headers.get('Set-Cookie');
    if (setCookies) {
      // 分割多个Cookie
      const cookies = setCookies.split(/,\s*(?=ssn_)/);
      cookies.forEach(cookie => {
        newCookie = cookie.replace(' domain=italent.cn;', '');
        newResponse.headers.append('Set-Cookie', newCookie);
      })
    }
    return newResponse;
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}