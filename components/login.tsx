import { useState } from "react";

export default function Login({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[username] && users[username].password === password) {
      localStorage.setItem("currentUser", username);
      setError("");
      onLogin(username);
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="max-w-xs mx-auto mt-20 bg-zinc-800 p-6 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4">Iniciar sesión</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="w-full p-2 rounded bg-zinc-900 border border-zinc-700"
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="w-full p-2 rounded bg-zinc-900 border border-zinc-700"
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="text-red-400 text-xs">{error}</div>}
        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 rounded p-2 font-bold">Entrar</button>
      </form>
      <button
        className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 rounded p-2 font-bold"
        onClick={() => {
          // Crear cuenta invitado
          const guest = "invitado-" + Math.floor(Math.random() * 100000);
          const users = JSON.parse(localStorage.getItem("users") || "{}");
          users[guest] = { password: "", guest: true };
          localStorage.setItem("users", JSON.stringify(users));
          localStorage.setItem("currentUser", guest);
          onLogin(guest);
        }}
      >Entrar como invitado</button>
      <button
        className="mt-2 w-full bg-blue-700 hover:bg-blue-800 rounded p-2 font-bold"
        onClick={() => {
          const newUser = prompt("Nuevo usuario:");
          const newPass = prompt("Contraseña:");
          if (newUser && newPass) {
            const users = JSON.parse(localStorage.getItem("users") || "{}");
            if (users[newUser]) {
              alert("El usuario ya existe");
            } else {
              users[newUser] = { password: newPass };
              localStorage.setItem("users", JSON.stringify(users));
              alert("Usuario creado. Puedes iniciar sesión.");
            }
          }
        }}
      >Crear cuenta</button>
    </div>
  );
}
