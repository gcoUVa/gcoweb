// deno run --allow-read --allow-write script.ts

interface FileProcess {
  path: string;
  startMarker: string;
}

const files: FileProcess[] = [
  {
    path: "docs/en/index.html",
    startMarker:
      '<div class="quarto-listing quarto-listing-container-grid" id="listing-research-es">',
  },
  {
    path: "docs/es/index.html",
    startMarker:
      '<div class="quarto-listing quarto-listing-container-grid" id="listing-research">',
  },
];

const endMarker = "<!-- /content -->";

// Almacenará los contenidos procesados para escritura posterior
const processedFiles: { path: string; content: string }[] = [];

try {
  for (const file of files) {
    // Leer archivo
    const text = await Deno.readTextFile(file.path);
    const lines = text.split("\n");

    // Buscar marcadores
    const startLine = lines.findIndex((line) => line.includes(file.startMarker));
    const endLine = lines.findIndex((line) => line.includes(endMarker));

    if (startLine === -1) {
      throw new Error(`ERROR: No se encontró el bloque de inicio en ${file.path}`);
    }

    if (endLine === -1) {
      throw new Error(`ERROR: No se encontró el marcador <!-- /content --> en ${file.path}`);
    }

    if (endLine <= startLine) {
      throw new Error(`ERROR: Marcadores en orden incorrecto en ${file.path}`);
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
        `AVISO: incoherencia en <div> antes del marcador en ${file.path}\n  abiertos: ${openCount}\n  cerrados: ${closeCount}`
      );
    }

    // Guardamos el contenido procesado
    processedFiles.push({
      path: file.path,
      content: [...before, ...after].join("\n"),
    });
  }

  // Si todo está bien, escribimos los archivos
  for (const file of processedFiles) {
    await Deno.writeTextFile(file.path, file.content);
    console.log(`Archivo ${file.path} procesado correctamente. Estructura HTML consistente.`);
  }
} catch (err) {
  console.error(err.message);
  console.error("NO se modificó ningún archivo.");
  Deno.exit(1);
}
