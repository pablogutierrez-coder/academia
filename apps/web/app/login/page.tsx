"use client";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
export default function Login(){
  const router=useRouter();const[error,setError]=useState("");const[loading,setLoading]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setLoading(true);setError("");const data=new FormData(e.currentTarget);
    try{const result=await api<{usuario?:{perfil?:string;modulos?:string[]};requiereCambioPassword?:boolean}>("/auth/login",{method:"POST",body:JSON.stringify({usuario:data.get("usuario"),password:data.get("password")})});if(result.usuario){localStorage.setItem("siga_perfil",result.usuario.perfil??"Administrador");localStorage.setItem("siga_modulos",JSON.stringify(result.usuario.modulos??[]));}router.push(result.requiereCambioPassword?"/cambiar-contrasena":"/dashboard");}
    catch(err){setError(err instanceof Error?err.message:"No fue posible iniciar sesión");}finally{setLoading(false);}
  }
  return <main className="login">
    <video className="login-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
      <source src="/media/login-background.mp4" type="video/mp4" />
    </video>
    <span className="login-video-overlay" aria-hidden="true" />
    <form className="login-card" onSubmit={submit}><div className="login-brand"><Image src="/branding/logo-elite-expert-academy.png" alt="Elite Expert Academy" width={104} height={104} priority /><div><div className="eyebrow">Elite Expert Academy</div><h1>Sistema Integral de Gestión Académica</h1></div></div><p className="muted">Ingresa al centro de control académico.</p>
    <div className="field"><label htmlFor="usuario">Usuario</label><input id="usuario" name="usuario" type="text" autoComplete="username" defaultValue="admin@elite.test" placeholder="nombre.apellido" required /></div>
    <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" required /></div>
    {error&&<p className="error" role="alert">{error}</p>}<button className="button" disabled={loading}>{loading?"Verificando…":"Ingresar de forma segura"}</button>
    </form>
  </main>;
}
