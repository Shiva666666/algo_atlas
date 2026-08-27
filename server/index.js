function acceptsHtml(request){
  return request.headers.get('accept')?.includes('text/html')??false;
}

export default {
  async fetch(request,env){
    if(request.method!=='GET'&&request.method!=='HEAD'){
      return new Response('Method not allowed',{status:405,headers:{allow:'GET, HEAD'}});
    }
    let response=await env.ASSETS.fetch(request);
    if(response.status===404&&acceptsHtml(request)){
      const fallback=new URL('/index.html',request.url);
      response=await env.ASSETS.fetch(new Request(fallback,request));
    }
    return response;
  },
};
