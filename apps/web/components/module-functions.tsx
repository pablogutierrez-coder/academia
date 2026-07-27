"use client";

import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  FileQuestion,
  FolderOpen,
  Eye,
  MessageSquareText,
  Pencil,
  PlayCircle,
  Plus,
  Presentation,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

const estudiantesDocente = [
  { id: "EST-00124", nombre: "Mariana Torres López", grupo: "GRP-03", curso: "Analítica de datos aplicada", marca: "PRESENTE", acumulado: "94%" },
  { id: "EST-00156", nombre: "Luis Mendoza Ruiz", grupo: "GRP-03", curso: "Analítica de datos aplicada", marca: "FALTA", acumulado: "72%" },
  { id: "EST-00179", nombre: "Andrea Salas Vega", grupo: "GRP-03", curso: "Analítica de datos aplicada", marca: "TARDANZA", acumulado: "86%" },
  { id: "EST-00188", nombre: "Carlos Paredes Núñez", grupo: "GRP-03", curso: "Analítica de datos aplicada", marca: "PENDIENTE", acumulado: "68%" },
  { id: "EST-00201", nombre: "Rosa Medina Castro", grupo: "GRP-05", curso: "Estrategias de marketing digital", marca: "PRESENTE", acumulado: "97%" },
];

export function TeacherAttendance() {
  const [curso, setCurso] = useState("Analítica de datos aplicada");
  const [sesion, setSesion] = useState("Sesión 4");
  const [busqueda, setBusqueda] = useState("");
  const [estudiantes, setEstudiantes] = useState(estudiantesDocente);
  const [guardado, setGuardado] = useState(false);
  const visibles = estudiantes.filter((item) => item.curso === curso && `${item.nombre} ${item.id}`.toLowerCase().includes(busqueda.toLowerCase()));

  return <><header className="page-header"><div><span className="page-kicker">Módulo Docente</span><h1>Asistencia</h1><p>Registra la asistencia únicamente de los estudiantes pertenecientes a tus cursos asignados.</p></div></header>
    {guardado && <div className="feedback feedback-success"><CheckCircle2 size={16}/>Asistencia de {sesion} guardada correctamente.</div>}
    <section className="teacher-context panel"><label className="form-field"><span>Curso asignado</span><select value={curso} onChange={(event)=>{setCurso(event.target.value);setGuardado(false);}}><option>Analítica de datos aplicada</option><option>Estrategias de marketing digital</option></select></label><label className="form-field"><span>Sesión</span><select value={sesion} onChange={(event)=>{setSesion(event.target.value);setGuardado(false);}}><option>Sesión 4</option><option>Sesión 5</option><option>Sesión 6</option></select></label><label className="search-control"><Search size={17}/><input value={busqueda} onChange={(event)=>setBusqueda(event.target.value)} placeholder="Buscar estudiante asignado"/></label><button className="btn btn-primary" onClick={()=>setGuardado(true)}>Guardar asistencia</button></section>
    <section className="panel table-panel"><div className="panel-header"><div><h2>Estudiantes asignados</h2><p>{visibles.length} estudiantes visibles · {curso}</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Estudiante</th><th>Documento</th><th>Grupo</th><th>Asistencia acumulada</th><th>Marca de {sesion}</th></tr></thead><tbody>{visibles.map((item)=><tr key={item.id}><td><strong>{item.nombre}</strong></td><td><span className="record-code">{item.id}</span></td><td>{item.grupo}</td><td>{item.acumulado}</td><td><select className={`attendance-select ${item.marca.toLowerCase()}`} value={item.marca} onChange={(event)=>{setGuardado(false);setEstudiantes((actuales)=>actuales.map((student)=>student.id===item.id?{...student,marca:event.target.value}:student));}}><option value="PRESENTE">Presente</option><option value="TARDANZA">Tardanza</option><option value="FALTA">Falta</option><option value="JUSTIFICADA">Falta justificada</option><option value="PENDIENTE">Pendiente</option></select></td></tr>)}</tbody></table></div></section>
  </>;
}

type ElementoLms={id:string;tipo:"PASO"|"EVALUACION"|"FORO";titulo:string;descripcion:string;contenidoTipo:string;contenido:string;nombreArchivo?:string;storagePath?:string;tipoMime?:string;tamanoBytes?:number;tiempo:number;requisito:string;estado:string};
type ModuloLms={id:string;titulo:string;descripcion:string;estado:string;elementos:ElementoLms[]};
type CursoLms={id:string;codigo:string;nombre:string;estado:string;modalidad:string;progreso:number};
type RutaLms={cursoId:string;titulo:string;descripcion:string;estado:string;version:number;modulos:ModuloLms[]};
const iconoElemento={PASO:BookOpen,EVALUACION:FileQuestion,FORO:MessageSquareText};

function normalizarTipo(tipo:string,contenido:string,nombreArchivo?:string){
  const valor=tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const referencia=(nombreArchivo||contenido).split("?")[0]?.toLowerCase()??"";
  if(valor==="archivo"){
    if(referencia.endsWith(".pdf"))return"pdf";
    if(referencia.endsWith(".ppt")||referencia.endsWith(".pptx"))return"presentacion";
    if(/\.(mp4|webm|ogg|mov)$/.test(referencia))return"video";
  }
  return valor;
}

function urlSegura(valor:string){
  const limpio=valor.trim().replaceAll("&amp;","&");
  if(limpio.startsWith("data:")||limpio.startsWith("blob:"))return limpio;
  try{
    const url=new URL(limpio);
    return ["http:","https:"].includes(url.protocol)?url.toString():"";
  }catch{return"";}
}

function extraerFuenteHtml(html:string){
  const coincidencia=html.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  return coincidencia?.[1]?urlSegura(coincidencia[1]):"";
}

function fuenteVideo(valor:string){
  const segura=urlSegura(valor);
  if(!segura)return{url:"",embed:false};
  try{
    const url=new URL(segura);
    if(url.hostname.includes("youtube.com")){
      const id=url.searchParams.get("v");
      return{id:id??"",url:id?`https://www.youtube-nocookie.com/embed/${id}`:"",embed:true};
    }
    if(url.hostname==="youtu.be"){
      const id=url.pathname.slice(1).split("/")[0];
      return{id,url:id?`https://www.youtube-nocookie.com/embed/${id}`:"",embed:true};
    }
    if(url.hostname.includes("vimeo.com")){
      const id=url.pathname.split("/").filter(Boolean).pop();
      return{id:id??"",url:id?`https://player.vimeo.com/video/${id}`:"",embed:true};
    }
  }catch{return{url:segura,embed:false};}
  return{url:segura,embed:false};
}

function ResourceEmpty({tipo}:{tipo:string}){
  return <div className="resource-empty"><FileText size={34}/><strong>Recurso pendiente de configurar</strong><span>Agrega el contenido o la dirección del recurso desde el editor del curso.</span><small>Tipo seleccionado: {tipo}</small></div>;
}

function ResourceViewer({elemento}:{elemento:ElementoLms}){
  const tipo=normalizarTipo(elemento.contenidoTipo,elemento.contenido,elemento.nombreArchivo);
  const contenido=elemento.contenido.trim();
  if(!contenido)return <ResourceEmpty tipo={elemento.contenidoTipo}/>;

  if(tipo==="html"){
    const fuente=extraerFuenteHtml(contenido);
    return <div className="resource-viewer resource-html">
      <div className="resource-viewer-toolbar"><span><FileText size={16}/><strong>Contenido interactivo</strong></span>{fuente&&<a href={fuente} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Abrir en otra pestaña</a>}</div>
      {fuente
        ? <iframe src={fuente} title={elemento.titulo} loading="lazy" allow="fullscreen; autoplay; clipboard-write" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"/>
        : <iframe srcDoc={contenido} title={elemento.titulo} sandbox="allow-scripts allow-forms allow-popups allow-presentation"/>}
    </div>;
  }

  if(tipo==="video"){
    const video=fuenteVideo(contenido);
    if(!video.url)return <ResourceEmpty tipo="Video"/>;
    return <div className="resource-viewer resource-video">
      <div className="resource-viewer-toolbar"><span><PlayCircle size={16}/><strong>Video del curso</strong></span><a href={video.url} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Abrir video</a></div>
      {video.embed
        ? <iframe src={video.url} title={elemento.titulo} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
        : <video src={video.url} controls preload="metadata">Tu navegador no puede reproducir este video.</video>}
    </div>;
  }

  if(tipo==="pdf"){
    const fuente=urlSegura(contenido);
    if(!fuente)return <ResourceEmpty tipo="PDF"/>;
    return <div className="resource-viewer resource-document">
      <div className="resource-viewer-toolbar"><span><FileText size={16}/><strong>{elemento.nombreArchivo||"Documento PDF"}</strong></span><span className="resource-actions"><a href={fuente} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Abrir</a><a href={fuente} download={elemento.nombreArchivo}><Download size={15}/>Descargar</a></span></div>
      <object data={`${fuente}#toolbar=1&navpanes=0`} type="application/pdf"><div className="resource-fallback"><FileText size={34}/><strong>La vista previa no está disponible en este navegador.</strong><a href={fuente} target="_blank" rel="noreferrer">Abrir documento PDF</a></div></object>
    </div>;
  }

  if(tipo==="presentacion"){
    const fuente=urlSegura(contenido);
    if(!fuente)return <ResourceEmpty tipo="Presentación"/>;
    const publicada=/^https?:/i.test(fuente);
    const visor=publicada?`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fuente)}`:"";
    return <div className="resource-viewer resource-presentation">
      <div className="resource-viewer-toolbar"><span><Presentation size={16}/><strong>{elemento.nombreArchivo||"Presentación"}</strong></span><span className="resource-actions"><a href={fuente} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Abrir</a><a href={fuente} download={elemento.nombreArchivo}><Download size={15}/>Descargar</a></span></div>
      {visor?<iframe src={visor} title={elemento.titulo} allowFullScreen/>:<div className="resource-fallback"><Presentation size={38}/><strong>Presentación lista para descargar</strong><p>Para mostrar diapositivas dentro del curso, publica el archivo en una URL accesible e ingrésala en el recurso.</p><a href={fuente} download={elemento.nombreArchivo}><Download size={16}/>Descargar presentación</a></div>}
    </div>;
  }

  if(tipo==="url"){
    const fuente=urlSegura(contenido);
    if(!fuente)return <ResourceEmpty tipo="Enlace"/>;
    return <div className="resource-viewer resource-url"><div className="resource-viewer-toolbar"><span><ExternalLink size={16}/><strong>Recurso externo</strong></span><a href={fuente} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Abrir en otra pestaña</a></div><iframe src={fuente} title={elemento.titulo} loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"/></div>;
  }

  if(tipo==="archivo"){
    const fuente=urlSegura(contenido);
    return <div className="resource-fallback"><FileText size={38}/><strong>{elemento.nombreArchivo||"Material descargable"}</strong><p>Este archivo está disponible como material complementario del curso.</p>{fuente&&<a href={fuente} download={elemento.nombreArchivo}><Download size={16}/>Descargar archivo</a>}</div>;
  }

  return <div className="text-content-preview">{contenido}</div>;
}

function ResourceContentFields({cursoId,elemento,tipoInicial,esEvaluacion}:{cursoId:string;elemento?:ElementoLms|undefined;tipoInicial:string;esEvaluacion:boolean}){
  const[tipo,setTipo]=useState(elemento?.contenidoTipo??tipoInicial);
  const[contenido,setContenido]=useState(elemento?.contenido??"");
  const[nombreArchivo,setNombreArchivo]=useState(elemento?.nombreArchivo??"");
  const[storagePath,setStoragePath]=useState(elemento?.storagePath??"");
  const[tipoMime,setTipoMime]=useState(elemento?.tipoMime??"");
  const[tamanoBytes,setTamanoBytes]=useState(elemento?.tamanoBytes??0);
  const[subiendo,setSubiendo]=useState(false);
  const[errorArchivo,setErrorArchivo]=useState("");
  const tipoNormalizado=normalizarTipo(tipo,contenido,nombreArchivo);
  const admiteArchivo=["archivo","pdf","presentacion","video"].includes(tipoNormalizado);
  async function cargarArchivo(event:React.ChangeEvent<HTMLInputElement>){
    const archivo=event.target.files?.[0];if(!archivo)return;
    if(archivo.size>40*1024*1024){setErrorArchivo("El archivo supera el límite de 40 MB.");event.target.value="";return;}
    setSubiendo(true);setErrorArchivo("");
    try{
      const form=new FormData();form.append("file",archivo);
      const result=await api<{url:string;nombreArchivo:string;storagePath:string;tipoMime:string;tamanoBytes:number}>(`/academico/courses/${encodeURIComponent(cursoId)}/resources`,{method:"POST",body:form});
      setContenido(result.url);setNombreArchivo(result.nombreArchivo);setStoragePath(result.storagePath);setTipoMime(result.tipoMime);setTamanoBytes(result.tamanoBytes);
    }catch(reason){setErrorArchivo(reason instanceof Error?reason.message:"No se pudo subir el archivo");}
    finally{setSubiendo(false);event.target.value="";}
  }
  const ayuda=tipoNormalizado==="html"?"Pega HTML completo o el código iframe del recurso.":tipoNormalizado==="video"?"Pega una URL de YouTube, Vimeo o de un archivo MP4/WebM.":tipoNormalizado==="pdf"?"Pega una URL pública o selecciona un PDF.":tipoNormalizado==="presentacion"?"Pega una URL pública de PPT/PPTX para visualizarla embebida, o adjunta el archivo para descarga.":"Escribe el contenido o pega la dirección del recurso.";
  return <><label className="form-field"><span>Tipo de contenido</span><select name="contenidoTipo" value={tipo} onChange={(event)=>{setTipo(event.target.value);setContenido("");setNombreArchivo("");}}><option>Texto</option><option>URL</option><option>HTML</option><option>Video</option><option>PDF</option><option>Presentación</option><option>Archivo</option>{esEvaluacion&&<option>Cuestionario</option>}</select></label>
    <label className="form-field lms-resource-content"><span>{tipoNormalizado==="texto"?"Contenido":"Contenido o URL del recurso"}</span><textarea name="contenido" rows={6} value={contenido} onChange={(event)=>{setContenido(event.target.value);if(event.target.value!==contenido)setNombreArchivo("");}} placeholder={ayuda}/><small>{ayuda}</small></label>
    {admiteArchivo&&<label className="lms-resource-upload"><Upload size={20}/><span><strong>{subiendo?"Subiendo a Firebase Storage…":nombreArchivo||"Seleccionar archivo"}</strong><small>{errorArchivo||"PDF, PPT, PPTX, MP4, WebM u otro material · máximo 40 MB"}</small></span><input disabled={subiendo||!cursoId} type="file" accept={tipoNormalizado==="pdf"?".pdf":tipoNormalizado==="presentacion"?".ppt,.pptx":tipoNormalizado==="video"?"video/*":".pdf,.ppt,.pptx,.mp4,.webm,.doc,.docx,.xlsx,.zip"} onChange={cargarArchivo}/></label>}
    <input type="hidden" name="nombreArchivo" value={nombreArchivo}/>
    <input type="hidden" name="storagePath" value={storagePath}/>
    <input type="hidden" name="tipoMime" value={tipoMime}/>
    <input type="hidden" name="tamanoBytes" value={tamanoBytes}/></>;
}

export function LmsBuilder(){
  type Editor={kind:"MODULO";moduleIndex?:number}|{kind:"ELEMENTO";moduleIndex:number;itemIndex?:number;tipo:ElementoLms["tipo"]};
  const[cursos,setCursos]=useState<CursoLms[]>([]);
  const[cursoId,setCursoId]=useState("");
  const[ruta,setRuta]=useState<Omit<RutaLms,"modulos">>({cursoId:"",titulo:"",descripcion:"",estado:"BORRADOR",version:0});
  const[modulos,setModulos]=useState<ModuloLms[]>([]);
  const[mensaje,setMensaje]=useState("");const[error,setError]=useState("");const[cargando,setCargando]=useState(true);const[guardando,setGuardando]=useState(false);const[editor,setEditor]=useState<Editor|null>(null);const[preview,setPreview]=useState(false);const[activePreview,setActivePreview]=useState(0);
  useEffect(()=>{let active=true;api<CursoLms[]>("/academico/courses").then((items)=>{if(!active)return;setCursos(items);setCursoId((current)=>current||items[0]?.id||"");if(items.length===0)setCargando(false);}).catch((reason)=>{if(active){setError(reason instanceof Error?reason.message:"No se pudieron cargar los cursos");setCargando(false);}});return()=>{active=false;};},[]);
  useEffect(()=>{if(!cursoId)return;let active=true;setCargando(true);setError("");api<RutaLms>(`/academico/courses/${encodeURIComponent(cursoId)}/learning-path`).then((result)=>{if(!active)return;const{modulos:items,...metadata}=result;setRuta(metadata);setModulos(items);setActivePreview(0);}).catch((reason)=>{if(active)setError(reason instanceof Error?reason.message:"No se pudo cargar la ruta");}).finally(()=>{if(active)setCargando(false);});return()=>{active=false;};},[cursoId]);
  async function persistir(next:ModuloLms[],success:string){if(!cursoId)return false;setGuardando(true);setError("");try{const result=await api<RutaLms>(`/academico/courses/${encodeURIComponent(cursoId)}/learning-path`,{method:"PUT",body:JSON.stringify({titulo:ruta.titulo||cursos.find((item)=>item.id===cursoId)?.nombre||"Ruta de aprendizaje",descripcion:ruta.descripcion||"Ruta de aprendizaje del curso.",estado:ruta.estado,modulos:next})});const{modulos:items,...metadata}=result;setRuta(metadata);setModulos(items);setMensaje(success);return true;}catch(reason){setError(reason instanceof Error?reason.message:"No fue posible guardar los cambios");return false;}finally{setGuardando(false);}}
  async function moverModulo(indice:number,direccion:-1|1){const destino=indice+direccion;if(destino<0||destino>=modulos.length)return;const next=[...modulos];[next[indice],next[destino]]=[next[destino]!,next[indice]!];await persistir(next,"Orden de módulos guardado.");}
  async function eliminarModulo(indice:number){const titulo=modulos[indice]?.titulo;await persistir(modulos.filter((_,i)=>i!==indice),`${titulo} eliminado.`);}
  async function moverElemento(moduleIndex:number,itemIndex:number,direccion:-1|1){const next=modulos.map((modulo,i)=>{if(i!==moduleIndex)return modulo;const destino=itemIndex+direccion;if(destino<0||destino>=modulo.elementos.length)return modulo;const elementos=[...modulo.elementos];[elementos[itemIndex],elementos[destino]]=[elementos[destino]!,elementos[itemIndex]!];return{...modulo,elementos};});await persistir(next,"Orden del contenido guardado.");}
  async function eliminarElemento(moduleIndex:number,itemIndex:number){const next=modulos.map((modulo,i)=>i===moduleIndex?{...modulo,elementos:modulo.elementos.filter((_,j)=>j!==itemIndex)}:modulo);await persistir(next,"Contenido eliminado del módulo.");}
  async function guardarModulo(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!editor||editor.kind!=="MODULO")return;const form=new FormData(event.currentTarget);const data={titulo:String(form.get("titulo")),descripcion:String(form.get("descripcion")),estado:String(form.get("estado"))};const next=editor.moduleIndex===undefined?[...modulos,{id:`mod-${crypto.randomUUID()}`,...data,elementos:[]}]:modulos.map((modulo,i)=>i===editor.moduleIndex?{...modulo,...data}:modulo);if(await persistir(next,editor.moduleIndex===undefined?"Módulo creado y guardado.":"Módulo actualizado y guardado."))setEditor(null);}
  async function guardarElemento(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!editor||editor.kind!=="ELEMENTO")return;const form=new FormData(event.currentTarget);const elemento:ElementoLms={id:editor.itemIndex===undefined?`elm-${crypto.randomUUID()}`:modulos[editor.moduleIndex]!.elementos[editor.itemIndex]!.id,tipo:editor.tipo,titulo:String(form.get("titulo")),descripcion:String(form.get("descripcion")),contenidoTipo:String(form.get("contenidoTipo")),contenido:String(form.get("contenido")),nombreArchivo:String(form.get("nombreArchivo")||""),storagePath:String(form.get("storagePath")||""),tipoMime:String(form.get("tipoMime")||""),tamanoBytes:Number(form.get("tamanoBytes")||0),tiempo:Number(form.get("tiempo")),requisito:String(form.get("requisito")),estado:String(form.get("estado"))};const next=modulos.map((modulo,i)=>{if(i!==editor.moduleIndex)return modulo;const elementos=[...modulo.elementos];if(editor.itemIndex===undefined)elementos.push(elemento);else elementos[editor.itemIndex]=elemento;return{...modulo,elementos};});if(await persistir(next,`${editor.tipo==="PASO"?"Paso":editor.tipo==="EVALUACION"?"Evaluación":"Foro"} guardado en Firebase.`))setEditor(null);}
  const moduloEditado=editor?.kind==="MODULO"&&editor.moduleIndex!==undefined?modulos[editor.moduleIndex]:undefined;
  const elementoEditado=editor?.kind==="ELEMENTO"&&editor.itemIndex!==undefined?modulos[editor.moduleIndex]?.elementos[editor.itemIndex]:undefined;
  const contenidosVisibles=modulos.flatMap((modulo,moduleIndex)=>modulo.elementos.filter((elemento)=>elemento.estado!=="Borrador"&&elemento.estado!=="Programado").map((elemento)=>({modulo,moduleIndex,elemento})));
  const contenidoActivo=contenidosVisibles[Math.min(activePreview,Math.max(0,contenidosVisibles.length-1))];
  function abrirVistaPrevia(){setActivePreview(0);setPreview(true);}
  return <><header className="page-header"><div><span className="page-kicker">LMS docente</span><h1>Ruta de aprendizaje</h1><p>Diseña la experiencia del curso mediante módulos, pasos, evaluaciones y foros.</p></div><div className="page-actions"><button className="btn btn-secondary" onClick={abrirVistaPrevia}><Eye size={17}/>Vista del estudiante</button><button className="btn btn-primary" onClick={()=>setEditor({kind:"MODULO"})}><Plus size={17}/>Añadir módulo</button></div></header>
    {mensaje&&<div className="feedback feedback-success"><CheckCircle2 size={16}/>{mensaje}</div>}{error&&<div className="feedback feedback-error">{error}</div>}{guardando&&<div className="feedback">Guardando cambios en Firebase…</div>}
    <section className="teacher-context panel lms-course-context"><label className="form-field"><span>Curso asignado</span><select value={cursoId} onChange={(event)=>setCursoId(event.target.value)} disabled={cargando||guardando}>{cursos.map((curso)=><option key={curso.id} value={curso.id}>{curso.nombre} · {curso.codigo}</option>)}</select></label><div><small>Estructura</small><strong>{cargando?"Cargando…":`${modulos.length} módulos · ${modulos.reduce((total,item)=>total+item.elementos.length,0)} elementos`}</strong></div><div><small>Estado</small><span className="status-badge success">{ruta.estado.replaceAll("_"," ")}</span></div></section>
    <section className="lms-modules">{modulos.map((modulo,indice)=><article className="panel lms-module" key={modulo.id}><header><span className="module-number">{indice+1}</span><div><h2>{modulo.titulo}</h2><p>{modulo.descripcion} · {modulo.estado}</p></div><div className="lms-module-actions"><button className="icon-button small" disabled={indice===0} onClick={()=>moverModulo(indice,-1)} aria-label={`Subir ${modulo.titulo}`}><ArrowUp size={15}/></button><button className="icon-button small" disabled={indice===modulos.length-1} onClick={()=>moverModulo(indice,1)} aria-label={`Bajar ${modulo.titulo}`}><ArrowDown size={15}/></button><button className="icon-button small" onClick={()=>setEditor({kind:"MODULO",moduleIndex:indice})} aria-label={`Editar ${modulo.titulo}`}><Pencil size={15}/></button><button className="icon-button small danger-outline" onClick={()=>eliminarModulo(indice)} aria-label={`Eliminar ${modulo.titulo}`}><Trash2 size={15}/></button></div></header><div className="lms-items">{modulo.elementos.map((elemento,itemIndex)=>{const Icon=iconoElemento[elemento.tipo];return <div key={elemento.id}><span className={`lms-type ${elemento.tipo.toLowerCase()}`}><Icon size={17}/></span><div><strong>{elemento.titulo}</strong><small>{elemento.tipo} · {elemento.contenidoTipo} · {elemento.tiempo} min · {elemento.estado}</small></div><div className="lms-item-actions"><button className="icon-button small" disabled={itemIndex===0} onClick={()=>moverElemento(indice,itemIndex,-1)} aria-label={`Subir ${elemento.titulo}`}><ArrowUp size={14}/></button><button className="icon-button small" disabled={itemIndex===modulo.elementos.length-1} onClick={()=>moverElemento(indice,itemIndex,1)} aria-label={`Bajar ${elemento.titulo}`}><ArrowDown size={14}/></button><button className="icon-button small" onClick={()=>setEditor({kind:"ELEMENTO",moduleIndex:indice,itemIndex,tipo:elemento.tipo})} aria-label={`Editar ${elemento.titulo}`}><Pencil size={14}/></button><button className="icon-button small danger-outline" onClick={()=>eliminarElemento(indice,itemIndex)} aria-label={`Eliminar ${elemento.titulo}`}><Trash2 size={14}/></button></div></div>})}{modulo.elementos.length===0&&<div className="lms-empty"><FolderOpen size={22}/><span>Añade el primer contenido del módulo.</span></div>}</div><footer><button onClick={()=>setEditor({kind:"ELEMENTO",moduleIndex:indice,tipo:"PASO"})}><Plus size={14}/>Paso</button><button onClick={()=>setEditor({kind:"ELEMENTO",moduleIndex:indice,tipo:"EVALUACION"})}><Plus size={14}/>Evaluación</button><button onClick={()=>setEditor({kind:"ELEMENTO",moduleIndex:indice,tipo:"FORO"})}><Plus size={14}/>Foro</button></footer></article>)}</section>
    {editor?.kind==="MODULO"&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modulo-title"><header><div><span className="page-kicker">Estructura del curso</span><h2 id="modulo-title">{moduloEditado?"Editar módulo":"Agregar módulo"}</h2><p>Define el nombre, propósito y visibilidad del módulo.</p></div><button className="icon-button" onClick={()=>setEditor(null)} aria-label="Cerrar editor de módulo"><X size={18}/></button></header><form onSubmit={guardarModulo}><label className="form-field"><span>Título *</span><input name="titulo" required defaultValue={moduloEditado?.titulo}/></label><label className="form-field"><span>Descripción</span><textarea name="descripcion" rows={4} defaultValue={moduloEditado?.descripcion}/></label><label className="form-field"><span>Estado</span><select name="estado" defaultValue={moduloEditado?.estado??"Borrador"}><option>Borrador</option><option>Publicado</option><option>Programado</option></select></label><footer><button className="btn btn-secondary" type="button" onClick={()=>setEditor(null)}>Cancelar</button><button className="btn btn-primary" type="submit">Guardar módulo</button></footer></form></section></div>}
    {editor?.kind==="ELEMENTO"&&<div className="modal-backdrop"><section className="modal lms-editor-modal" role="dialog" aria-modal="true" aria-labelledby="elemento-title"><header><div><span className="page-kicker">{editor.tipo}</span><h2 id="elemento-title">{elementoEditado?"Editar":"Agregar"} {editor.tipo==="PASO"?"paso":editor.tipo==="EVALUACION"?"evaluación":"foro"}</h2><p>Configura el contenido, requisito de avance y estado de publicación.</p></div><button className="icon-button" onClick={()=>setEditor(null)} aria-label="Cerrar editor de contenido"><X size={18}/></button></header><form onSubmit={guardarElemento}><div className="form-row lms-title-row"><label className="form-field"><span>Título *</span><input name="titulo" required defaultValue={elementoEditado?.titulo}/></label><ResourceContentFields cursoId={cursoId} elemento={elementoEditado} tipoInicial={editor.tipo==="EVALUACION"?"Cuestionario":"Texto"} esEvaluacion={editor.tipo==="EVALUACION"}/></div><label className="form-field"><span>Descripción</span><textarea name="descripcion" rows={3} defaultValue={elementoEditado?.descripcion}/></label><div className="form-row lms-config-row"><label className="form-field"><span>Tiempo (min)</span><input name="tiempo" type="number" min="0" defaultValue={elementoEditado?.tiempo??0}/></label><label className="form-field"><span>Requisito</span><select name="requisito" defaultValue={elementoEditado?.requisito??"Libre"}><option>Libre</option><option>Completar paso anterior</option><option>Completar módulo anterior</option><option>Completar módulo</option></select></label><label className="form-field"><span>Estado</span><select name="estado" defaultValue={elementoEditado?.estado??"Borrador"}><option>Borrador</option><option>Publicado</option><option>Programado</option><option>Abierto</option></select></label></div><footer><button className="btn btn-secondary" type="button" onClick={()=>setEditor(null)}>Cancelar</button><button className="btn btn-primary" type="submit" disabled={guardando}>Guardar {editor.tipo==="PASO"?"paso":editor.tipo==="EVALUACION"?"evaluación":"foro"}</button></footer></form></section></div>}
    {preview&&<div className="learning-preview-backdrop"><section className="learning-preview" role="dialog" aria-modal="true" aria-labelledby="preview-title"><header className="learning-preview-top"><strong>Vista del estudiante</strong><button onClick={()=>setPreview(false)} aria-label="Cerrar vista del estudiante"><X size={21}/></button></header><div className="learning-hero"><div><span>RUTA DE APRENDIZAJE</span><h2 id="preview-title">Analítica de datos aplicada</h2><p>Aprende a transformar información en decisiones mediante una experiencia práctica y progresiva.</p></div><div className="learning-progress-ring"><strong>{Math.min(activePreview+1,contenidosVisibles.length)}/{contenidosVisibles.length}</strong><span>contenidos</span></div></div><div className="learning-experience"><aside><h3>Contenido del curso</h3>{modulos.map((modulo,moduleIndex)=>{const visibles=contenidosVisibles.filter((item)=>item.moduleIndex===moduleIndex);if(visibles.length===0)return null;return <div className="learning-module-list" key={modulo.id}><strong>{modulo.titulo}</strong>{visibles.map((item)=>{const globalIndex=contenidosVisibles.indexOf(item);return <button className={globalIndex===activePreview?"is-active":""} onClick={()=>setActivePreview(globalIndex)} key={item.elemento.id}><span>{globalIndex+1}</span><div><b>{item.elemento.titulo}</b><small>{item.elemento.contenidoTipo} · {item.elemento.tiempo} min</small></div></button>})}</div>})}</aside><div className="learning-main">{contenidoActivo?<><span className="learning-current-module">{contenidoActivo.modulo.titulo}</span><h2>{contenidoActivo.elemento.titulo}</h2><p className="learning-description">{contenidoActivo.elemento.descripcion}</p><article className={`learning-content learning-content-${contenidoActivo.elemento.tipo.toLowerCase()}`}><span className="learning-content-type">{contenidoActivo.elemento.tipo} · {contenidoActivo.elemento.contenidoTipo}</span>{contenidoActivo.elemento.tipo==="EVALUACION"?<div className="assessment-preview"><FileQuestion size={30}/><h3>Evaluación disponible</h3><p>{contenidoActivo.elemento.contenido}</p><button onClick={()=>setMensaje("La evaluación se abrirá en la experiencia real del estudiante.")}>Comenzar evaluación</button></div>:contenidoActivo.elemento.tipo==="FORO"?<div className="forum-preview"><MessageSquareText size={30}/><h3>Participa en el foro</h3><p>{contenidoActivo.elemento.contenido}</p><textarea aria-label="Respuesta de vista previa" placeholder="Escribe una respuesta de prueba…"/><button onClick={()=>setMensaje("La participación se habilitará al publicar la ruta.")}>Publicar respuesta</button></div>:<ResourceViewer elemento={contenidoActivo.elemento}/>}</article><footer className="learning-navigation"><button disabled={activePreview===0} onClick={()=>setActivePreview((actual)=>Math.max(0,actual-1))}><ChevronLeft size={17}/>Anterior</button><span>{activePreview+1} de {contenidosVisibles.length}</span><button disabled={activePreview===contenidosVisibles.length-1} onClick={()=>setActivePreview((actual)=>Math.min(contenidosVisibles.length-1,actual+1))}>Siguiente<ChevronRight size={17}/></button></footer></>:<div className="learning-no-content"><FolderOpen size={36}/><h2>No hay contenido publicado</h2><p>Publica al menos un paso para visualizar la experiencia del estudiante.</p></div>}</div></div></section></div>}
  </>;
}

export function StudentLearningPath(){
  const[courses,setCourses]=useState<CursoLms[]>([]);const[courseId,setCourseId]=useState("");const[path,setPath]=useState<RutaLms|null>(null);const[active,setActive]=useState(0);const[message,setMessage]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(true);
  useEffect(()=>{api<CursoLms[]>("/academico/courses").then((items)=>{setCourses(items);setCourseId(items[0]?.id||"");if(items.length===0)setLoading(false);}).catch((reason)=>{setError(reason instanceof Error?reason.message:"No se pudieron cargar tus cursos");setLoading(false);});},[]);
  useEffect(()=>{if(!courseId)return;setLoading(true);setError("");api<RutaLms>(`/academico/courses/${encodeURIComponent(courseId)}/learning-path`).then((result)=>{setPath(result);setActive(0);}).catch((reason)=>setError(reason instanceof Error?reason.message:"No se pudo cargar la ruta")).finally(()=>setLoading(false));},[courseId]);
  const modules=path?.modulos??[];
  const contents=modules.flatMap((modulo,moduleIndex)=>modulo.elementos.filter((elemento)=>elemento.estado!=="Borrador"&&elemento.estado!=="Programado").map((elemento)=>({modulo,moduleIndex,elemento})));
  const current=contents[Math.min(active,Math.max(0,contents.length-1))];
  return <><header className="page-header"><div><span className="page-kicker">Mi aprendizaje</span><h1>Ruta de aprendizaje</h1><p>Avanza por los contenidos publicados, participa y completa las evaluaciones de tu curso.</p></div></header>
    {message&&<div className="feedback feedback-success"><CheckCircle2 size={16}/>{message}</div>}{error&&<div className="feedback feedback-error">{error}</div>}
    <section className="teacher-context panel"><label className="form-field"><span>Curso asignado</span><select value={courseId} onChange={(event)=>setCourseId(event.target.value)} disabled={loading}>{courses.map((course)=><option key={course.id} value={course.id}>{course.nombre} · {course.codigo}</option>)}</select></label><div><small>Estado de la ruta</small><strong>{loading?"Sincronizando…":path?.estado.replaceAll("_"," ")||"Sin contenido"}</strong></div></section>
    {current&&path?<section className="student-learning-page panel">
      <div className="learning-hero"><div><span>CURSO ACTIVO</span><h2>{path.titulo}</h2><p>{path.descripcion}</p></div><div className="learning-progress-ring"><strong>{active+1}/{contents.length}</strong><span>contenidos</span></div></div>
      <div className="learning-experience"><aside><h3>Contenido del curso</h3>{modules.map((modulo,moduleIndex)=>{const visible=contents.filter((item)=>item.moduleIndex===moduleIndex);if(!visible.length)return null;return <div className="learning-module-list" key={modulo.id}><strong>{modulo.titulo}</strong>{visible.map((item)=>{const index=contents.indexOf(item);return <button className={index===active?"is-active":""} onClick={()=>setActive(index)} key={item.elemento.id}><span>{index+1}</span><div><b>{item.elemento.titulo}</b><small>{item.elemento.contenidoTipo} · {item.elemento.tiempo} min</small></div></button>})}</div>})}</aside>
        <div className="learning-main"><span className="learning-current-module">{current.modulo.titulo}</span><h2>{current.elemento.titulo}</h2><p className="learning-description">{current.elemento.descripcion}</p><article className={`learning-content learning-content-${current.elemento.tipo.toLowerCase()}`}><span className="learning-content-type">{current.elemento.tipo} · {current.elemento.contenidoTipo}</span>{current.elemento.tipo==="EVALUACION"?<div className="assessment-preview"><FileQuestion size={30}/><h3>Evaluación disponible</h3><p>{current.elemento.contenido}</p><button onClick={()=>setMessage("Evaluación iniciada. Tus respuestas se guardarán al finalizar.")}>Comenzar evaluación</button></div>:current.elemento.tipo==="FORO"?<div className="forum-preview"><MessageSquareText size={30}/><h3>Participa en el foro</h3><p>{current.elemento.contenido}</p><textarea aria-label="Respuesta del estudiante" placeholder="Escribe tu aporte…"/><button onClick={()=>setMessage("Tu participación fue registrada.")}>Publicar respuesta</button></div>:<ResourceViewer elemento={current.elemento}/>}</article><footer className="learning-navigation"><button disabled={active===0} onClick={()=>setActive((value)=>Math.max(0,value-1))}><ChevronLeft size={17}/>Anterior</button><span>{active+1} de {contents.length}</span><button disabled={active===contents.length-1} onClick={()=>setActive((value)=>Math.min(contents.length-1,value+1))}>Siguiente<ChevronRight size={17}/></button></footer></div>
      </div>
    </section>:!loading&&<section className="panel empty-state"><FolderOpen size={34}/><strong>No hay contenidos publicados para este curso.</strong><p>Cuando el docente publique la ruta, aparecerá aquí automáticamente.</p></section>}
  </>;
}

type AlternativaEvaluacion={id:string;texto:string;correcta:boolean};
type PreguntaEvaluacion={id:string;enunciado:string;tipo:"Opción única"|"Opción múltiple"|"Verdadero/Falso"|"Texto corto"|"Texto largo";puntaje:number;alternativas:AlternativaEvaluacion[];explicacion:string};
type EvaluacionDemo={id:string;titulo:string;tipo:string;preguntas:PreguntaEvaluacion[];intentos:number;estado:string;instrucciones:string;intentosPermitidos:number;puntajeMinimo:number;fechaInicio:string;fechaLimite:string;tiempoLimite:number;obligatoria:boolean;bloquearSiguiente:boolean;permitirReintentos:boolean;condicionDesbloqueo:string;mensajeBloqueo:string;mostrarResultado:boolean;mostrarCorrectas:boolean;retroalimentacion:boolean;preguntasAleatorias:boolean;alternativasAleatorias:boolean};
const preguntaBase=(id:string,enunciado:string):PreguntaEvaluacion=>({id,enunciado,tipo:"Opción única",puntaje:1,alternativas:[{id:`${id}-a`,texto:"Alternativa A",correcta:true},{id:`${id}-b`,texto:"Alternativa B",correcta:false}],explicacion:""});
const evaluacionesIniciales:EvaluacionDemo[]=[
  {id:"eval-1",titulo:"Evaluación diagnóstica",tipo:"Cuestionario",preguntas:[preguntaBase("p-11","¿Cuál es el propósito principal del análisis de datos?"),preguntaBase("p-12","¿Qué criterio permite validar una fuente?")],intentos:24,estado:"Publicada",instrucciones:"Responde todas las preguntas. Revisa tus respuestas antes de finalizar.",intentosPermitidos:1,puntajeMinimo:70,fechaInicio:"2026-07-27T09:00",fechaLimite:"2026-08-03T23:59",tiempoLimite:20,obligatoria:true,bloquearSiguiente:true,permitirReintentos:false,condicionDesbloqueo:"Aprobar evaluación",mensajeBloqueo:"Debes aprobar esta evaluación para continuar.",mostrarResultado:true,mostrarCorrectas:false,retroalimentacion:true,preguntasAleatorias:false,alternativasAleatorias:false},
  {id:"eval-2",titulo:"Caso práctico de limpieza",tipo:"Tarea",preguntas:[{...preguntaBase("p-21","Describe el proceso de limpieza aplicado al caso."),tipo:"Texto largo",alternativas:[]}],intentos:18,estado:"Activa",instrucciones:"Analiza el caso y sustenta tu respuesta.",intentosPermitidos:2,puntajeMinimo:70,fechaInicio:"2026-07-30T09:00",fechaLimite:"2026-08-07T23:59",tiempoLimite:45,obligatoria:true,bloquearSiguiente:false,permitirReintentos:true,condicionDesbloqueo:"Solo responder",mensajeBloqueo:"Completa la actividad para continuar.",mostrarResultado:true,mostrarCorrectas:false,retroalimentacion:true,preguntasAleatorias:false,alternativasAleatorias:false},
  {id:"eval-3",titulo:"Proyecto parcial",tipo:"Proyecto",preguntas:[{...preguntaBase("p-31","Presenta el tablero ejecutivo del proyecto."),tipo:"Texto largo",puntaje:20,alternativas:[]}],intentos:0,estado:"Borrador",instrucciones:"Adjunta el enlace del proyecto y explica tus decisiones.",intentosPermitidos:1,puntajeMinimo:70,fechaInicio:"",fechaLimite:"",tiempoLimite:0,obligatoria:false,bloquearSiguiente:false,permitirReintentos:false,condicionDesbloqueo:"Solo responder",mensajeBloqueo:"",mostrarResultado:true,mostrarCorrectas:false,retroalimentacion:true,preguntasAleatorias:false,alternativasAleatorias:false},
];
const evaluacionVacia=():EvaluacionDemo=>({id:`eval-${Date.now()}`,titulo:"",tipo:"Cuestionario",preguntas:[preguntaBase(`p-${Date.now()}`,"")],intentos:0,estado:"Borrador",instrucciones:"",intentosPermitidos:1,puntajeMinimo:70,fechaInicio:"",fechaLimite:"",tiempoLimite:20,obligatoria:false,bloquearSiguiente:false,permitirReintentos:true,condicionDesbloqueo:"Solo responder",mensajeBloqueo:"Debes completar esta evaluación para continuar.",mostrarResultado:true,mostrarCorrectas:false,retroalimentacion:true,preguntasAleatorias:false,alternativasAleatorias:false});

export function TeacherAssessments(){
  const[evaluaciones,setEvaluaciones]=useState(evaluacionesIniciales);const[mensaje,setMensaje]=useState("");const[builder,setBuilder]=useState<{index:number|null;draft:EvaluacionDemo}|null>(null);const[calificador,setCalificador]=useState<number|null>(null);
  function abrirNueva(){setBuilder({index:null,draft:evaluacionVacia()});}
  function abrirEdicion(index:number){setBuilder({index,draft:structuredClone(evaluaciones[index]!)});}
  function patchEvaluacion<K extends keyof EvaluacionDemo>(key:K,value:EvaluacionDemo[K]){setBuilder((current)=>current?{...current,draft:{...current.draft,[key]:value}}:current);}
  function patchPregunta(index:number,patch:Partial<PreguntaEvaluacion>){setBuilder((current)=>current?{...current,draft:{...current.draft,preguntas:current.draft.preguntas.map((pregunta,i)=>i===index?{...pregunta,...patch}:pregunta)}}:current);}
  function agregarPregunta(){setBuilder((current)=>current?{...current,draft:{...current.draft,preguntas:[...current.draft.preguntas,preguntaBase(`p-${Date.now()}`,"")]}}:current);}
  function eliminarPregunta(index:number){setBuilder((current)=>current?{...current,draft:{...current.draft,preguntas:current.draft.preguntas.filter((_,i)=>i!==index)}}:current);}
  function agregarAlternativa(questionIndex:number){setBuilder((current)=>{if(!current)return current;const preguntas=current.draft.preguntas.map((pregunta,i)=>i===questionIndex?{...pregunta,alternativas:[...pregunta.alternativas,{id:`alt-${Date.now()}`,texto:"",correcta:false}]}:pregunta);return{...current,draft:{...current.draft,preguntas}};});}
  function patchAlternativa(questionIndex:number,alternativeIndex:number,patch:Partial<AlternativaEvaluacion>,unique=false){setBuilder((current)=>{if(!current)return current;const preguntas=current.draft.preguntas.map((pregunta,i)=>{if(i!==questionIndex)return pregunta;return{...pregunta,alternativas:pregunta.alternativas.map((alternativa,j)=>j===alternativeIndex?{...alternativa,...patch}:unique?{...alternativa,correcta:false}:alternativa)};});return{...current,draft:{...current.draft,preguntas}};});}
  function eliminarAlternativa(questionIndex:number,alternativeIndex:number){setBuilder((current)=>{if(!current)return current;const preguntas=current.draft.preguntas.map((pregunta,i)=>i===questionIndex?{...pregunta,alternativas:pregunta.alternativas.filter((_,j)=>j!==alternativeIndex)}:pregunta);return{...current,draft:{...current.draft,preguntas}};});}
  function guardarEvaluacion(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!builder)return;if(!builder.draft.titulo.trim()){setMensaje("Ingresa el título de la evaluación.");return;}if(builder.index===null)setEvaluaciones((current)=>[...current,builder.draft]);else setEvaluaciones((current)=>current.map((item,i)=>i===builder.index?builder.draft:item));setMensaje(`Evaluación “${builder.draft.titulo}” guardada con ${builder.draft.preguntas.length} pregunta(s).`);setBuilder(null);}
  function guardarNota(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(calificador===null)return;const form=new FormData(event.currentTarget);setCalificador(null);setMensaje(`Nota ${String(form.get("nota"))}/20 registrada para ${String(form.get("estudiante"))}.`);}
  const draft=builder?.draft;
  return <><header className="page-header"><div><span className="page-kicker">Módulo Docente</span><h1>Evaluaciones y notas</h1><p>Diseña instrumentos, configura reglas de avance, califica entregas y publica retroalimentación.</p></div><button className="btn btn-primary" onClick={abrirNueva}><Plus size={17}/>Crear evaluación</button></header>
    {mensaje&&<div className={`feedback ${mensaje.startsWith("Ingresa")?"feedback-error":"feedback-success"}`}><CheckCircle2 size={16}/>{mensaje}</div>}
    <section className="assessment-grid">{evaluaciones.map((item,index)=><article className="panel assessment-card" key={item.id}><header><span className="metric-icon blue"><ClipboardCheck size={19}/></span><span className={`status-badge ${item.estado==="Borrador"?"warning":"success"}`}>{item.estado}</span></header><h2>{item.titulo}</h2><p>{item.tipo} · {item.preguntas.length} {item.preguntas.length===1?"pregunta":"preguntas"} · mínimo {item.puntajeMinimo}%</p><div><span><small>Entregas</small><strong>{item.intentos}</strong></span><span><small>Por calificar</small><strong>{Math.min(item.intentos,6)}</strong></span></div><footer><button className="btn btn-secondary" onClick={()=>abrirEdicion(index)}>Editar</button><button className="btn btn-primary" onClick={()=>setCalificador(index)}>Calificar</button></footer></article>)}</section>
    <section className="panel table-panel gradebook"><div className="panel-header"><div><h2>Libro de notas</h2><p>Analítica de datos aplicada · GRP-03</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Estudiante</th><th>Diagnóstica</th><th>Caso práctico</th><th>Proyecto</th><th>Promedio</th><th>Estado</th></tr></thead><tbody><tr><td><strong>Mariana Torres López</strong></td><td>18</td><td>17</td><td>19</td><td><strong>18.0</strong></td><td><span className="status-badge success">Aprobado</span></td></tr><tr><td><strong>Luis Mendoza Ruiz</strong></td><td>14</td><td>13</td><td>Pendiente</td><td><strong>13.5</strong></td><td><span className="status-badge warning">En curso</span></td></tr><tr><td><strong>Andrea Salas Vega</strong></td><td>17</td><td>18</td><td>18</td><td><strong>17.7</strong></td><td><span className="status-badge success">Aprobado</span></td></tr></tbody></table></div></section>
    {builder&&draft&&<div className="modal-backdrop evaluation-builder-backdrop"><section className="modal evaluation-builder" role="dialog" aria-modal="true" aria-labelledby="eval-builder-title"><header><div><span className="page-kicker">Constructor</span><h2 id="eval-builder-title">{builder.index===null?"Nueva evaluación":"Editar evaluación"}</h2><p>Configura la experiencia, las reglas y las preguntas del instrumento.</p></div><button className="icon-button" onClick={()=>setBuilder(null)} aria-label="Cerrar constructor"><X size={18}/></button></header><form onSubmit={guardarEvaluacion}>
      <section className="evaluation-config"><div className="evaluation-title-grid"><label className="form-field"><span>Título *</span><input required value={draft.titulo} onChange={(event)=>patchEvaluacion("titulo",event.target.value)}/></label><label className="form-field"><span>Estado</span><select value={draft.estado} onChange={(event)=>patchEvaluacion("estado",event.target.value)}><option>Borrador</option><option>Activa</option><option>Publicada</option></select></label></div><label className="form-field"><span>Instrucciones</span><textarea rows={4} value={draft.instrucciones} onChange={(event)=>patchEvaluacion("instrucciones",event.target.value)}/></label>
      <div className="evaluation-settings-grid"><label className="form-field"><span>Intentos permitidos</span><input type="number" min="1" value={draft.intentosPermitidos} onChange={(event)=>patchEvaluacion("intentosPermitidos",Number(event.target.value))}/></label><label className="form-field"><span>Puntaje mínimo %</span><input type="number" min="0" max="100" value={draft.puntajeMinimo} onChange={(event)=>patchEvaluacion("puntajeMinimo",Number(event.target.value))}/></label><label className="form-field"><span>Fecha de inicio</span><input type="datetime-local" value={draft.fechaInicio} onChange={(event)=>patchEvaluacion("fechaInicio",event.target.value)}/></label><label className="form-field"><span>Fecha límite</span><input type="datetime-local" value={draft.fechaLimite} onChange={(event)=>patchEvaluacion("fechaLimite",event.target.value)}/></label><label className="form-field"><span>Tiempo límite (min)</span><input type="number" min="0" value={draft.tiempoLimite} onChange={(event)=>patchEvaluacion("tiempoLimite",Number(event.target.value))}/></label><label className="form-field"><span>Condición de desbloqueo</span><select value={draft.condicionDesbloqueo} onChange={(event)=>patchEvaluacion("condicionDesbloqueo",event.target.value)}><option>Solo responder</option><option>Aprobar evaluación</option><option>Obtener puntaje mínimo</option></select></label></div>
      <div className="evaluation-rules"><div className="switch-list"><label><input type="checkbox" checked={draft.obligatoria} onChange={(event)=>patchEvaluacion("obligatoria",event.target.checked)}/><span>Obligatoria para avanzar</span></label><label><input type="checkbox" checked={draft.bloquearSiguiente} onChange={(event)=>patchEvaluacion("bloquearSiguiente",event.target.checked)}/><span>Bloquear contenido siguiente</span></label><label><input type="checkbox" checked={draft.permitirReintentos} onChange={(event)=>patchEvaluacion("permitirReintentos",event.target.checked)}/><span>Permitir reintentos</span></label></div><label className="form-field"><span>Mensaje de bloqueo</span><input value={draft.mensajeBloqueo} onChange={(event)=>patchEvaluacion("mensajeBloqueo",event.target.value)}/></label></div>
      <div className="evaluation-option-grid">{([["mostrarResultado","Mostrar resultado"],["mostrarCorrectas","Mostrar respuestas correctas"],["retroalimentacion","Permitir retroalimentación"],["preguntasAleatorias","Preguntas aleatorias"],["alternativasAleatorias","Alternativas aleatorias"]] as Array<[keyof EvaluacionDemo,string]>).map(([key,label])=><label key={key}><input type="checkbox" checked={Boolean(draft[key])} onChange={(event)=>patchEvaluacion(key,event.target.checked as never)}/><span>{label}</span></label>)}</div></section>
      <section className="question-builder"><header><div><h3>Preguntas</h3><p>Agrega preguntas directamente a esta evaluación.</p></div><button className="btn btn-secondary" type="button" onClick={agregarPregunta}><Plus size={15}/>Agregar pregunta</button></header>{draft.preguntas.map((pregunta,index)=><article className="question-card" key={pregunta.id}><header><span>{index+1}</span><input aria-label={`Enunciado pregunta ${index+1}`} placeholder="Escribe el enunciado" value={pregunta.enunciado} onChange={(event)=>patchPregunta(index,{enunciado:event.target.value})}/><select aria-label={`Tipo pregunta ${index+1}`} value={pregunta.tipo} onChange={(event)=>{const tipo=event.target.value as PreguntaEvaluacion["tipo"];patchPregunta(index,{tipo,alternativas:tipo==="Verdadero/Falso"?[{id:`${pregunta.id}-v`,texto:"Verdadero",correcta:true},{id:`${pregunta.id}-f`,texto:"Falso",correcta:false}]:tipo.startsWith("Texto")?[]:pregunta.alternativas.length?pregunta.alternativas:[{id:`${pregunta.id}-a`,texto:"",correcta:true},{id:`${pregunta.id}-b`,texto:"",correcta:false}]});}}><option>Opción única</option><option>Opción múltiple</option><option>Verdadero/Falso</option><option>Texto corto</option><option>Texto largo</option></select><input className="score-input" aria-label={`Puntaje pregunta ${index+1}`} type="number" min=".1" step=".1" value={pregunta.puntaje} onChange={(event)=>patchPregunta(index,{puntaje:Number(event.target.value)})}/><button className="icon-button small danger-outline" type="button" onClick={()=>eliminarPregunta(index)} aria-label={`Eliminar pregunta ${index+1}`}><Trash2 size={15}/></button></header>{pregunta.alternativas.length>0&&<div className="alternative-list">{pregunta.alternativas.map((alternativa,altIndex)=><div key={alternativa.id}><input aria-label={`Respuesta correcta ${index+1}.${altIndex+1}`} type={pregunta.tipo==="Opción múltiple"?"checkbox":"radio"} name={`correct-${pregunta.id}`} checked={alternativa.correcta} onChange={(event)=>patchAlternativa(index,altIndex,{correcta:event.target.checked},pregunta.tipo!=="Opción múltiple")}/><input aria-label={`Alternativa ${index+1}.${altIndex+1}`} value={alternativa.texto} onChange={(event)=>patchAlternativa(index,altIndex,{texto:event.target.value})}/><button type="button" onClick={()=>eliminarAlternativa(index,altIndex)} aria-label={`Eliminar alternativa ${index+1}.${altIndex+1}`}><X size={14}/></button></div>)}{pregunta.tipo!=="Verdadero/Falso"&&<button className="text-action add-alternative" type="button" onClick={()=>agregarAlternativa(index)}><Plus size={13}/>Agregar alternativa</button>}</div>}<label className="form-field question-explanation"><span>Explicación o guía para el evaluador</span><textarea rows={2} value={pregunta.explicacion} onChange={(event)=>patchPregunta(index,{explicacion:event.target.value})}/></label></article>)}{draft.preguntas.length===0&&<div className="empty-state"><strong>La evaluación aún no tiene preguntas.</strong><p>Usa “Agregar pregunta” para comenzar.</p></div>}</section>
      <footer className="evaluation-builder-footer"><span>{draft.preguntas.length} pregunta(s) · {draft.preguntas.reduce((total,pregunta)=>total+pregunta.puntaje,0)} puntos</span><div><button className="btn btn-secondary" type="button" onClick={()=>setBuilder(null)}>Cancelar</button><button className="btn btn-primary" type="submit">Guardar evaluación</button></div></footer>
    </form></section></div>}
    {calificador!==null&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="grade-title"><header><div><span className="page-kicker">Libro de notas</span><h2 id="grade-title">Calificar entrega</h2><p>{evaluaciones[calificador]?.titulo}</p></div><button className="icon-button" onClick={()=>setCalificador(null)} aria-label="Cerrar calificación"><X size={18}/></button></header><form onSubmit={guardarNota}><label className="form-field"><span>Estudiante</span><select name="estudiante"><option>Mariana Torres López</option><option>Luis Mendoza Ruiz</option><option>Andrea Salas Vega</option></select></label><label className="form-field"><span>Nota (0 a 20)</span><input name="nota" type="number" min="0" max="20" step=".1" required/></label><label className="form-field"><span>Retroalimentación</span><textarea name="feedback" rows={4} placeholder="Registra fortalezas y aspectos por mejorar."/></label><footer><button className="btn btn-secondary" type="button" onClick={()=>setCalificador(null)}>Cancelar</button><button className="btn btn-primary" type="submit">Publicar nota</button></footer></form></section></div>}
  </>;
}

type UsuarioDemo={id?:string;nombre:string;dni:string;celular:string;whatsapp:string;correo:string;usuario?:string;perfil:string;modulos:string[];estado:string;cambioPasswordRequerido?:boolean};
const modulosDisponibles=["Docente","Estudiante","Gestión al estudiante","Administrador"];
export function AdminUsers(){
  const[usuarios,setUsuarios]=useState<UsuarioDemo[]>([]);const[modal,setModal]=useState<{index?:number}|null>(null);const[mensaje,setMensaje]=useState("");const[error,setError]=useState("");const[perfilModal,setPerfilModal]=useState("Docente");const[modulosAdmin,setModulosAdmin]=useState<string[]>(modulosDisponibles);
  const usuarioEditado=modal?.index===undefined?undefined:usuarios[modal.index];
  useEffect(()=>{api<UsuarioDemo[]>("/auth/users").then(setUsuarios).catch((reason)=>setError(reason instanceof Error?reason.message:"No se pudieron cargar los usuarios"));},[]);
  function abrirNuevo(){setPerfilModal("Docente");setModulosAdmin(modulosDisponibles);setError("");setModal({});}
  function abrirEdicion(index:number){const item=usuarios[index]!;setPerfilModal(item.perfil);setModulosAdmin(item.modulos);setModal({index});}
  async function crear(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setError("");const form=new FormData(event.currentTarget);const modulos=perfilModal==="Administrador"?modulosAdmin:[perfilModal];const payload={nombre:String(form.get("nombre")),dni:String(form.get("dni")),celular:String(form.get("celular")),whatsapp:String(form.get("whatsapp")),correo:String(form.get("correo")),perfil:perfilModal,modulos};try{if(usuarioEditado){setUsuarios((actuales)=>actuales.map((item,i)=>i===modal?.index?{...item,...payload}:item));setMensaje(`Datos de ${payload.nombre} actualizados.`);}else{const nuevo=await api<UsuarioDemo>("/auth/users",{method:"POST",body:JSON.stringify(payload)});setUsuarios((actuales)=>[nuevo,...actuales]);setMensaje(`Usuario ${nuevo.usuario} creado. Su contraseña inicial es el DNI y deberá cambiarla en el primer ingreso.`);}setModal(null);}catch(reason){setError(reason instanceof Error?reason.message:"No se pudo crear el usuario");}}
  return <><header className="page-header"><div><span className="page-kicker">Administrador</span><h1>Usuarios y accesos</h1><p>Crea cuentas personales. El perfil determina automáticamente el módulo disponible; solo el administrador puede seleccionar varios módulos.</p></div><button className="btn btn-primary" onClick={abrirNuevo}><Plus size={17}/>Crear usuario</button></header>
    {mensaje&&<div className="feedback feedback-success"><CheckCircle2 size={16}/>{mensaje}</div>}
    {error&&<div className="feedback feedback-error">{error}</div>}
    <section className="metric-grid compact"><article className="metric-card"><div className="metric-head"><span>Usuarios activos</span></div><strong>{usuarios.length}</strong><small>Acceso vigente</small></article><article className="metric-card"><div className="metric-head"><span>Docentes</span></div><strong>{usuarios.filter((item)=>item.perfil==="Docente").length}</strong><small>Perfil docente</small></article><article className="metric-card"><div className="metric-head"><span>Administradores</span></div><strong>{usuarios.filter((item)=>item.perfil==="Administrador").length}</strong><small>Acceso total</small></article></section>
    <section className="panel table-panel"><div className="table-scroll"><table className="data-table"><thead><tr><th>Usuario</th><th>DNI / contacto</th><th>Perfil</th><th>Acceso a módulos</th><th>Estado</th><th>Gestión</th></tr></thead><tbody>{usuarios.map((item,index)=><tr key={item.id??item.correo}><td><strong>{item.nombre}</strong><small className="student-email">{item.usuario} · {item.correo}</small></td><td><strong>{item.dni||"—"}</strong><small className="student-email">{item.celular||"Sin celular"} · WA {item.whatsapp||"—"}</small></td><td>{item.perfil}</td><td><div className="access-badges">{item.modulos.map((modulo)=><span key={modulo}>{modulo}</span>)}</div></td><td><span className="status-badge success">{item.estado}</span>{item.cambioPasswordRequerido&&<small className="student-email">Cambio de clave pendiente</small>}</td><td><button className="row-action" onClick={()=>abrirEdicion(index)}>Editar acceso</button></td></tr>)}</tbody></table></div></section>
    {modal&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="usuario-title"><header><div><span className="page-kicker">{usuarioEditado?"Gestión de acceso":"Nueva cuenta"}</span><h2 id="usuario-title">{usuarioEditado?"Editar usuario":"Crear usuario"}</h2><p>La cuenta usará nombre.apellido y el DNI como contraseña temporal.</p></div><button className="icon-button" onClick={()=>setModal(null)} aria-label="Cerrar"><X size={18}/></button></header><form onSubmit={crear}><label className="form-field"><span>Nombre completo</span><input name="nombre" required minLength={3} defaultValue={usuarioEditado?.nombre}/></label><div className="form-grid two"><label className="form-field"><span>DNI</span><input name="dni" required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} defaultValue={usuarioEditado?.dni}/></label><label className="form-field"><span>Celular</span><input name="celular" required inputMode="tel" pattern="9[0-9]{8}" maxLength={9} defaultValue={usuarioEditado?.celular}/></label></div><div className="form-grid two"><label className="form-field"><span>WhatsApp</span><input name="whatsapp" required inputMode="tel" pattern="9[0-9]{8}" maxLength={9} defaultValue={usuarioEditado?.whatsapp}/></label><label className="form-field"><span>Correo personal</span><input name="correo" type="email" required defaultValue={usuarioEditado?.correo}/></label></div><label className="form-field"><span>Perfil</span><select name="perfil" value={perfilModal} onChange={(event)=>setPerfilModal(event.target.value)}><option>Docente</option><option>Estudiante</option><option>Gestión al estudiante</option><option>Administrador</option></select></label><fieldset className="module-access"><legend>Acceso a módulos</legend>{modulosDisponibles.map((modulo)=><label key={modulo}><input type="checkbox" name="modulos" value={modulo} disabled={perfilModal!=="Administrador"} checked={perfilModal==="Administrador"?modulosAdmin.includes(modulo):perfilModal===modulo} onChange={(event)=>setModulosAdmin((current)=>event.target.checked?[...current,modulo]:current.filter((item)=>item!==modulo))}/><span><ShieldCheck size={16}/>{modulo}</span></label>)}</fieldset><div className="feedback">Contraseña inicial: DNI. En el primer ingreso deberá crear una clave de mínimo 8 caracteres, usando solo letras sin tilde y números, y distinta al DNI.</div><footer><button className="btn btn-secondary" type="button" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" type="submit">{usuarioEditado?"Guardar cambios":"Crear usuario"}</button></footer></form></section></div>}
  </>;
}
