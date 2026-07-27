const API=process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export async function api<T>(path:string,init?:RequestInit):Promise<T>{
  const response=await fetch(`${API}${path}`,{...init,credentials:"include",headers:{"Content-Type":"application/json",...init?.headers}});
  if(!response.ok){const body=await response.json().catch(()=>({message:"Error de comunicación"})) as {message?:string};throw new Error(body.message ?? "No fue posible completar la operación");}
  return response.json() as Promise<T>;
}
