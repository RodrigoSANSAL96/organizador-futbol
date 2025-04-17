let jugadores = JSON.parse(localStorage.getItem('jugadores')) || [];
let jugadoresAsistentes = [];
let indiceEdicion = null;

// ==== UTILIDAD ====
function guardarJugadores() {
  localStorage.setItem('jugadores', JSON.stringify(jugadores));
}

function calcularPrioridad(jugador) {
  let p = 0;
  if (jugador.etiquetas.includes("invierno")) p += 2;
  if (jugador.etiquetas.includes("encuesta")) p += 1;
  if (jugador.etiquetas.includes("solidario")) p += 3;
  return p;
}

function toggleElemento(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === "none" ? "block" : "none";
}

// ==== JUGADORES ====
function mostrarJugadores() {
  const lista = document.getElementById("lista-jugadores");
  lista.innerHTML = "";
  jugadores.forEach((j, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${j.nombre} (${j.etiquetas.join(", ") || "Sin prioridades"}) 
      <button class="btn-editar" onclick="editarJugador(${i})">Editar</button>
      <button class="btn-eliminar" onclick="eliminarJugador(${i})">Eliminar</button>
    `;
    lista.appendChild(li);
  });
}

function agregarJugador() {
  const nombre = document.getElementById("nombre").value.trim();

  if (!nombre) {
    alert("Ingresá un nombre");
    return;
  }

  if (jugadores.some(j => j.nombre.toLowerCase() === nombre.toLowerCase())) {
    alert("Ese jugador ya está cargado 🛑");
    return;
  }

  // Obtenemos las nuevas prioridades ingresadas por el usuario
  const checkboxes = document.querySelectorAll(".etiqueta-checkbox");
  const etiquetas = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  jugadores.push({ nombre, etiquetas });
  guardarJugadores();
  mostrarJugadores();

  // Limpia el formulario
  document.getElementById("nombre").value = "";
  checkboxes.forEach(cb => cb.checked = false);
}

// ==== ASISTENCIA ====
function mostrarAsistencia() {
  toggleElemento("lista-asistencia");
  const contenedor = document.getElementById("lista-asistencia");
  contenedor.innerHTML = jugadores.map(j => {
    const checked = jugadoresAsistentes.includes(j.nombre) ? "checked" : "";
    return `<label><input type="checkbox" value="${j.nombre}" ${checked}> ${j.nombre}</label><br>`;
  }).join("");
}

function guardarAsistencia() {
  const checkboxes = document.querySelectorAll("#lista-asistencia input[type=checkbox]");
  jugadoresAsistentes = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  alert("Asistencia guardada ✅");
}

// ==== SORTEO DE EQUIPOS ====
function sortearEquipos() {
  if (jugadoresAsistentes.length === 0) {
    alert("Primero seleccioná los jugadores que van al partido.");
    return;
  }

  const asistentes = jugadores.filter(j => jugadoresAsistentes.includes(j.nombre));
  const copia = [...asistentes];
  copia.sort((a, b) => calcularPrioridad(b) - calcularPrioridad(a));

  const titulares = copia.slice(0, 14);
  const suplentes = copia.slice(14);

  const equipoVerde = titulares.filter((_, i) => i % 2 === 0);
  const equipoBlanco = titulares.filter((_, i) => i % 2 !== 0);

  const tabla = document.getElementById("tabla-equipos");
  tabla.innerHTML = `
    <h3>Equipo con Pechera (Verde)</h3>
    <ul>${equipoVerde.map(j => `<li>${j.nombre}</li>`).join("")}</ul>
    <h3>Equipo sin Pechera (Blanco)</h3>
    <ul>${equipoBlanco.map(j => `<li>${j.nombre}</li>`).join("")}</ul>
    <h3>Suplentes</h3>
    <ul>${suplentes.map(j => `<li>${j.nombre}</li>`).join("")}</ul>
  `;

  if (suplentes.length > 0) {
    const titularesOrdenados = [...titulares].sort((a, b) => calcularPrioridad(a) - calcularPrioridad(b));
    const rotaciones = suplentes.map((suplente, i) => {
      const sale = titularesOrdenados[i % titularesOrdenados.length];
      return {
        minuto: (i + 1) * 15,
        entra: suplente.nombre,
        sale: sale.nombre
      };
    });

    const rotacionHtml = rotaciones.map(r =>
      `<li><strong>Min ${r.minuto}:</strong> Entra ${r.entra} / Sale ${r.sale}</li>`
    ).join("");

    tabla.innerHTML += `<h3>Rotaciones sugeridas (cada 15 min)</h3><ul>${rotacionHtml}</ul>`;
  }

  const partido = {
    fecha: new Date().toLocaleString(),
    asistentes: jugadoresAsistentes,
    titulares,
    suplentes
  };

  const historial = JSON.parse(localStorage.getItem('historial')) || [];
  historial.push(partido);
  localStorage.setItem('historial', JSON.stringify(historial));
}

// ==== WHATSAPP ====
function compartirWhatsApp() {
  const copia = jugadores.filter(j => jugadoresAsistentes.includes(j.nombre));
  copia.sort((a, b) => calcularPrioridad(b) - calcularPrioridad(a));

  const titulares = copia.slice(0, 14);
  const suplentes = copia.slice(14);
  const equipoVerde = titulares.filter((_, i) => i % 2 === 0);
  const equipoBlanco = titulares.filter((_, i) => i % 2 !== 0);

  let texto = "*🎽 Equipos del Partido:*\n\n";
  texto += "*Equipo Verde:*\n" + equipoVerde.map(j => `- ${j.nombre}`).join("\n") + "\n\n";
  texto += "*Equipo Blanco:*\n" + equipoBlanco.map(j => `- ${j.nombre}`).join("\n") + "\n\n";
  if (suplentes.length) {
    texto += "*Suplentes:*\n" + suplentes.map(j => `- ${j.nombre}`).join("\n");
  }

  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

// ==== RANKING ====
function mostrarRanking() {
  toggleElemento("lista-ranking");

  const lista = document.getElementById("lista-ranking");
  const copia = [...jugadores];
  copia.sort((a, b) => calcularPrioridad(b) - calcularPrioridad(a));

  lista.innerHTML = copia.map(j =>
    `<li><strong>${j.nombre}</strong> (${j.etiquetas.join(", ") || "sin prioridades"})</li>`
  ).join("");
}

// ==== HISTORIAL ====
function mostrarHistorial() {
  toggleElemento("tabla-historial");
  const historial = JSON.parse(localStorage.getItem('historial')) || [];
  const jugadoresResumen = {};

  jugadores.forEach(j => {
    jugadoresResumen[j.nombre] = {
      nombre: j.nombre,
      titular: 0,
      suplente: 0,
      ausente: 0,
      partidas: []
    };
  });

  historial.forEach(partido => {
    const nombresTitulares = partido.titulares.map(j => j.nombre);
    const nombresSuplentes = partido.suplentes.map(j => j.nombre);
    jugadores.forEach(j => {
      const reg = jugadoresResumen[j.nombre];
      if (nombresTitulares.includes(j.nombre)) {
        reg.titular++;
        reg.partidas.push({ fecha: partido.fecha, estado: "Titular", prioridades: j.etiquetas || [] });
      } else if (nombresSuplentes.includes(j.nombre)) {
        reg.suplente++;
        reg.partidas.push({ fecha: partido.fecha, estado: "Suplente", prioridades: j.etiquetas || [] });
      } else {
        reg.ausente++;
        reg.partidas.push({ fecha: partido.fecha, estado: "Ausente", prioridades: [] });
      }
    });
  });

  const contenedor = document.getElementById("tabla-historial");
  contenedor.innerHTML = "";

  Object.values(jugadoresResumen).forEach(j => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${j.nombre}</h3>
      <p><strong>Titular:</strong> ${j.titular} | <strong>Suplente:</strong> ${j.suplente} | <strong>Ausente:</strong> ${j.ausente}</p>
      <ul>
        ${j.partidas.map(p =>
          `<li><strong>${p.fecha}:</strong> ${p.estado} ${
            p.prioridades.length > 0 ? `(Prioridades: ${p.prioridades.join(", ")})` : ""
          }</li>`).join("")}
      </ul>
    `;
    contenedor.appendChild(div);
  });
}

function editarJugador(index) {
  const jugador = jugadores[index];
  const nuevasEtiquetas = jugador.etiquetas;

  // Actualizar el nombre del jugador
  document.getElementById("editar-nombre").value = jugador.nombre;

  // Marcar los checkboxes según las etiquetas del jugador
  document.getElementById("editar-invierno").checked = nuevasEtiquetas.includes("invierno");
  document.getElementById("editar-encuesta").checked = nuevasEtiquetas.includes("encuesta");
  document.getElementById("editar-solidario").checked = nuevasEtiquetas.includes("solidario");

  // Mostrar el formulario de edición
  toggleElemento("editar-jugador");

  // Guardar el índice de edición
  indiceEdicion = index;
}

function eliminarJugador(index) {
  if (confirm("¿Estás seguro de que quieres eliminar este jugador?")) {
    jugadores.splice(index, 1); // Elimina el jugador
    guardarJugadores(); // Guarda los cambios
    mostrarJugadores(); // Actualiza la lista de jugadores
  }
}

// ==== INICIALIZACIÓN ====
mostrarJugadores();
