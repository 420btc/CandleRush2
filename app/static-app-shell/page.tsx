"use client";

import dynamic from "next/dynamic";

// Cargamos la app cliente sin SSR
const App = dynamic(() => import("../../frontend/app"), { ssr: false });

export default function StaticAppShell() {
  return <App />;
}
