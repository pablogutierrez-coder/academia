export type ResultadoEnvio={id:string;estado:"SIMULADO"|"ENVIADO"|"ERROR"};
export interface EmailProvider { enviar(destinatario:string,plantilla:string,datos:Record<string,unknown>):Promise<ResultadoEnvio>; }
export interface WhatsAppProvider { enviar(destinatario:string,plantilla:string,datos:Record<string,unknown>):Promise<ResultadoEnvio>; }
export interface StorageProvider { guardar(nombre:string,contenido:Uint8Array):Promise<{ruta:string;hash:string}>; }
export interface AIProvider { ejecutar(caso:string,entrada:Record<string,unknown>):Promise<{contenido:string;generadoPorIA:true}>; }

export class MockWhatsAppProvider implements WhatsAppProvider {
  async enviar():Promise<ResultadoEnvio>{return {id:crypto.randomUUID(),estado:"SIMULADO"};}
}
