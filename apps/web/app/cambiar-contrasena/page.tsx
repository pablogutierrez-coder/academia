"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function ChangePasswordPage(){
  const router=useRouter();
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setError("");
    const data=new FormData(event.currentTarget);
    const actual=String(data.get("actual"));
    const nueva=String(data.get("nueva"));
    const confirmacion=String(data.get("confirmacion"));
    if(nueva!==confirmacion){setError("Las contraseñas nuevas no coinciden.");return;}
    if(!/^[A-Za-z0-9]{8,}$/.test(nueva)){setError("Usa mínimo 8 caracteres, únicamente letras sin tilde y números.");return;}
    setLoading(true);
    try{
      await api("/auth/change-password",{method:"POST",body:JSON.stringify({passwordActual:actual,nuevaPassword:nueva})});
      router.push("/dashboard");
    }catch(reason){
      setError(reason instanceof Error?reason.message:"No fue posible cambiar la contraseña");
    }finally{
      setLoading(false);
    }
  }

  return <main className="login">
    <video className="login-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true"><source src="/media/login-background.mp4" type="video/mp4"/></video>
    <span className="login-video-overlay" aria-hidden="true"/>
    <form className="login-card" onSubmit={submit}>
      <div className="login-brand"><Image src="/branding/logo-elite-expert-academy.png" alt="Elite Expert Academy" width={104} height={104} priority/><div><div className="eyebrow">Primer ingreso</div><h1>Crea tu nueva contraseña</h1></div></div>
      <p className="muted">Por seguridad, reemplaza la contraseña temporal basada en tu DNI.</p>
      <div className="field"><label htmlFor="actual">Contraseña actual</label><input id="actual" name="actual" type="password" autoComplete="current-password" required/></div>
      <div className="field"><label htmlFor="nueva">Nueva contraseña</label><input id="nueva" name="nueva" type="password" autoComplete="new-password" minLength={8} pattern="[A-Za-z0-9]{8,}" required/><small>Solo letras sin tilde y números; mínimo 8 caracteres y distinta al DNI.</small></div>
      <div className="field"><label htmlFor="confirmacion">Confirmar contraseña</label><input id="confirmacion" name="confirmacion" type="password" autoComplete="new-password" minLength={8} required/></div>
      {error&&<p className="error" role="alert">{error}</p>}
      <button className="button" disabled={loading}>{loading?"Guardando…":"Guardar y continuar"}</button>
    </form>
  </main>;
}
