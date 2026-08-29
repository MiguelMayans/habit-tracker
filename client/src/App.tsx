const categorias = [
  { nombre: "Cuerpo", clase: "bg-cuerpo" },
  { nombre: "Disciplina", clase: "bg-disciplina" },
  { nombre: "Mente", clase: "bg-mente" },
  { nombre: "Ingenio", clase: "bg-ingenio" },
  { nombre: "Corazón", clase: "bg-corazon" },
] as const;

function App() {
  return (
    <main className="min-h-screen bg-negro p-10">
      <h1 className="font-display uppercase text-amarillo text-5xl">Habits</h1>
      <p className="mt-2 text-sm text-hueso/60">
        Verificación de paleta y tipografía — paso 3
      </p>

      <ul className="mt-8 grid max-w-md gap-3">
        {categorias.map(({ nombre, clase }) => (
          <li
            key={nombre}
            className={`${clase} rounded px-5 py-4 font-display text-xl uppercase text-hueso`}
          >
            {nombre}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
