// Elimina la parte del final de los ficheros /en/index.html 
// o /es/index.html en la que pone las noticias y las líneas de investigación
// del listing en el otro idioma
//
// quarto run limpiar_portada.ts <ruta>
// La ruta debe terminar en "en", "en/", "es" o "es/"

if (Deno.args.length !== 1) {
  console.error("ERROR: Debes proporcionar exactamente una ruta como argumento.");
  Deno.exit(1);
}

let dir = Deno.args[0].replace(/\/$/, ""); // quitar barra final si existe
let startMarker: string;
let filePath: string;

if (dir.endsWith("/en") || dir === "en") {
  filePath = `${dir}/index.html`;
  startMarker =
    '<div class="quarto-listing quarto-listing-container-grid" id="listing-research-es">';
} else if (dir.endsWith("/es") || dir === "es") {
  filePath = `${dir}/index.html`;
  startMarker =
    '<div class="quarto-listing quarto-listing-container-grid" id="listing-research">';
} else {
  console.error(
    "ERROR: La ruta debe terminar en 'en', 'en/', 'es' o 'es/'. No se procesa nada."
  );
  Deno.exit(1);
}

const endMarker = "<!-- /content -->";

try {
  // Leer archivo
  const text = await Deno.readTextFile(filePath);
  const lines = text.split("\n");

  // Buscar marcadores
  const startLine = lines.findIndex((line) => line.includes(startMarker));
  const endLine = lines.findIndex((line) => line.includes(endMarker));

  if (startLine === -1) {
    throw new Error(`ERROR: No se encontró el bloque de inicio en ${filePath}`);
  }

  if (endLine === -1) {
    throw new Error(`ERROR: No se encontró el marcador <!-- /content --> en ${filePath}`);
  }

  if (endLine <= startLine) {
    throw new Error(`ERROR: Marcadores en orden incorrecto en ${filePath}`);
  }

  // Partes que se conservan
  const before = lines.slice(0, startLine);
  const after = lines.slice(endLine);

  // Verificación de coherencia de divs antes del marcador final
  const checkText = [...before, after[0]].join("\n");
  const openCount = (checkText.match(/<div(\s|>)/g)?.length ?? 0) + 1;
  const closeCount = checkText.match(/<\/div>/g)?.length ?? 0;

  if (openCount !== closeCount) {
    throw new Error(
      `AVISO: incoherencia en <div> antes del marcador en ${filePath}\n  abiertos: ${openCount}\n  cerrados: ${closeCount}`
    );
  }

  // Guardar archivo
  await Deno.writeTextFile(filePath, [...before, ...after].join("\n"));
  console.log(`Archivo ${filePath} procesado correctamente. Estructura HTML consistente.`);
} catch (err) {
  console.error(err.message);
  console.error("NO se modificó el archivo.");
  Deno.exit(1);
}
