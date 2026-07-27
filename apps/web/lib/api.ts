const configuredApi=(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/,"");
const API=configuredApi.endsWith("/api") ? configuredApi : `${configuredApi}/api`;
export async function api<T>(path:string,init?:RequestInit):Promise<T>{
  const normalizedPath=path.startsWith("/") ? path : `/${path}`;
  const isFormData=typeof FormData!=="undefined"&&init?.body instanceof FormData;
  const headers=new Headers(init?.headers);
  if(!isFormData&&!headers.has("Content-Type"))headers.set("Content-Type","application/json");
  const response=await fetch(`${API}${normalizedPath}`,{...init,credentials:"include",headers});
  if(!response.ok){const body=await response.json().catch(()=>({message:"Error de comunicación"})) as {message?:string};throw new Error(body.message ?? "No fue posible completar la operación");}
  return response.json() as Promise<T>;
}
