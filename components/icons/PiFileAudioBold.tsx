import * as React from "react";
import { SVGProps } from "react";

// Icono PiFileAudioBold estilo "audio file" bold para control de volumen
export default function PiFileAudioBold(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      viewBox="0 0 24 24"
      {...props}
    >
      
      <path d="M9.5 10v4h2.5l3 3V7l-3 3H9.5z" fill="#fff"/>
      <path d="M15.5 13.5c1.2-1.2 1.2-3.1 0-4.3" stroke="#fff" strokeWidth={1.5} fill="none"/>
      <circle cx={9.5} cy={12} r={0.8} fill="#fff" />
    </svg>
  );
}
