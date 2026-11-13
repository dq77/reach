
export async function onRequest(context) {
  
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace('/storage', '');
  const key = url.searchParams.get('key');

  if (pathname.startsWith('/get')) {
    const data = await KV.get(key, 'json');
    return new Response(JSON.stringify({ code: 0, data }));
  } else if (pathname.startsWith('/set')) {
    const value = context.request.body
    await KV.put(key, value);
    return new Response(JSON.stringify({ code: 0, msg: 'success' }));
  } else {
    return new Response(JSON.stringify({ code: 404, msg: 'Not Found' }));
  }
}

