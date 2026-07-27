import "./globals.css";
export const metadata={
  title:"Elite Expert Academy | SIGA",
  description:"Sistema Integral de Gestión Académica de Elite Expert Academy",
  icons:{
    icon:[{url:"/branding/logo-elite-expert-academy.png",type:"image/png"}],
    shortcut:"/branding/logo-elite-expert-academy.png",
    apple:"/branding/logo-elite-expert-academy.png",
  },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
