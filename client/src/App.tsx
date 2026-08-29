const categorias = [
  { nombre: "Cuerpo", clase: "bg-cuerpo" },
  { nombre: "Disciplina", clase: "bg-disciplina" },
  { nombre: "Mente", clase: "bg-mente" },
  { nombre: "Ingenio", clase: "bg-ingenio" },
  { nombre: "Corazón", clase: "bg-corazon" },
] as const;

/** Giro alterno de las casillas, estilo collage de Persona. */
const giros = ["-3deg", "2deg", "-1.5deg", "3deg", "-2deg"];

function App() {
  return (
    <main className="min-h-screen bg-negro p-10">
      <h1 className="text-slam-tilt inline-block font-display text-6xl uppercase text-amarillo">
        Habits
      </h1>
      <p className="mt-6 text-sm text-hueso/60">
        Verificación de paleta y tipografía — paso 3
      </p>

      <ul className="mt-10 grid max-w-md gap-4">
        {categorias.map(({ nombre, clase }, i) => (
          <li
            key={nombre}
            className={`${clase} panel-slam font-display px-5 py-4 text-xl uppercase text-hueso`}
            style={{ "--rotacion": giros[i] } as React.CSSProperties}
          >
            {nombre}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
