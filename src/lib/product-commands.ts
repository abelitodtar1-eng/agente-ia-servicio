import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  findProductByName,
  type Product,
} from "./db";

export type CommandResult = { ok: boolean; reply: string };

// Comandos soportados (prefijo /inv):
//   /inv lista
//   /inv rebaja N de NOMBRE
//   /inv agrega N de NOMBRE
//   /inv stock NOMBRE: N          (set stock directo)
//   /inv precio NOMBRE: N         (set precio directo)
//   /inv nuevo NOMBRE, PRECIO, STOCK [, CATEGORIA] [, UDM]
//   /inv edita NOMBRE campo: VALOR
//   /inv borra NOMBRE
//   /inv ayuda

function fmt(p: Product): string {
  const estado = p.activo ? "✅" : "🔴";
  return `${estado} *${p.nombre}* | stock: ${p.stock} | precio: ${p.precio} CUP${p.categoria ? ` | ${p.categoria}` : ""}`;
}

export function handleProductCommand(raw: string): CommandResult | null {
  const text = raw.trim();
  if (!/^\/inv\b/i.test(text)) return null;

  const cmd = text.replace(/^\/inv\s*/i, "").trim();

  // /inv ayuda
  if (/^ayuda$/i.test(cmd)) {
    return {
      ok: true,
      reply: `📦 *Comandos de inventario:*
/inv lista — ver todos los productos
/inv rebaja N de NOMBRE — reducir stock
/inv agrega N de NOMBRE — aumentar stock
/inv stock NOMBRE: N — fijar stock
/inv precio NOMBRE: N — fijar precio
/inv nuevo NOMBRE, PRECIO, STOCK
/inv edita NOMBRE stock: N
/inv edita NOMBRE precio: N
/inv edita NOMBRE categoria: TEXTO
/inv borra NOMBRE`,
    };
  }

  // /inv lista
  if (/^lista$/i.test(cmd)) {
    const products = listProducts();
    if (products.length === 0) return { ok: true, reply: "📦 Sin productos registrados." };
    const lines = products.map(fmt).join("\n");
    return { ok: true, reply: `📦 *Productos (${products.length}):*\n${lines}` };
  }

  // /inv rebaja N de NOMBRE
  const rebajaMatch = cmd.match(/^rebaja\s+(\d+(?:\.\d+)?)\s+de\s+(.+)$/i);
  if (rebajaMatch) {
    const qty = parseFloat(rebajaMatch[1]);
    const p = findProductByName(rebajaMatch[2].trim());
    if (!p) return { ok: false, reply: `❌ Producto "${rebajaMatch[2].trim()}" no encontrado.` };
    const newStock = Math.max(0, p.stock - qty);
    updateProduct(p.id, { stock: newStock });
    return { ok: true, reply: `✅ *${p.nombre}* — stock: ${p.stock} → ${newStock}` };
  }

  // /inv agrega N de NOMBRE
  const agregaMatch = cmd.match(/^agrega\s+(\d+(?:\.\d+)?)\s+de\s+(.+)$/i);
  if (agregaMatch) {
    const qty = parseFloat(agregaMatch[1]);
    const p = findProductByName(agregaMatch[2].trim());
    if (!p) return { ok: false, reply: `❌ Producto "${agregaMatch[2].trim()}" no encontrado.` };
    const newStock = p.stock + qty;
    updateProduct(p.id, { stock: newStock });
    return { ok: true, reply: `✅ *${p.nombre}* — stock: ${p.stock} → ${newStock}` };
  }

  // /inv stock NOMBRE: N
  const stockMatch = cmd.match(/^stock\s+(.+?):\s*(\d+(?:\.\d+)?)$/i);
  if (stockMatch) {
    const p = findProductByName(stockMatch[1].trim());
    if (!p) return { ok: false, reply: `❌ Producto "${stockMatch[1].trim()}" no encontrado.` };
    const newStock = parseFloat(stockMatch[2]);
    updateProduct(p.id, { stock: newStock });
    return { ok: true, reply: `✅ *${p.nombre}* — stock fijado en ${newStock}` };
  }

  // /inv precio NOMBRE: N
  const precioSetMatch = cmd.match(/^precio\s+(.+?):\s*(\d+(?:\.\d+)?)$/i);
  if (precioSetMatch) {
    const p = findProductByName(precioSetMatch[1].trim());
    if (!p) return { ok: false, reply: `❌ Producto "${precioSetMatch[1].trim()}" no encontrado.` };
    const newPrecio = parseFloat(precioSetMatch[2]);
    updateProduct(p.id, { precio: newPrecio });
    return { ok: true, reply: `✅ *${p.nombre}* — precio fijado en ${newPrecio} CUP` };
  }

  // /inv nuevo NOMBRE, PRECIO, STOCK [, CATEGORIA] [, UDM]
  const nuevoMatch = cmd.match(/^nuevo\s+(.+)$/i);
  if (nuevoMatch) {
    const parts = nuevoMatch[1].split(",").map(s => s.trim());
    if (parts.length < 3) {
      return { ok: false, reply: "❌ Formato: /inv nuevo NOMBRE, PRECIO, STOCK [, CATEGORIA] [, UDM]" };
    }
    const nombre = parts[0];
    const precio = parseFloat(parts[1]);
    const stock = parseFloat(parts[2]);
    if (!nombre || isNaN(precio) || isNaN(stock)) {
      return { ok: false, reply: "❌ PRECIO y STOCK deben ser números." };
    }
    try {
      const p = createProduct({
        nombre,
        precio,
        stock,
        categoria: parts[3] ?? "",
        udm: parts[4] ?? "",
        activo: 1,
        imagen: null,
      });
      return { ok: true, reply: `✅ Producto creado:\n${fmt(p)}` };
    } catch {
      return { ok: false, reply: `❌ Ya existe un producto con ese nombre.` };
    }
  }

  // /inv edita NOMBRE campo: VALOR
  const editaMatch = cmd.match(/^edita\s+(.+?)\s+(stock|precio|categoria|udm|activo):\s*(.+)$/i);
  if (editaMatch) {
    const p = findProductByName(editaMatch[1].trim());
    if (!p) return { ok: false, reply: `❌ Producto "${editaMatch[1].trim()}" no encontrado.` };
    const campo = editaMatch[2].toLowerCase();
    const valor = editaMatch[3].trim();
    const numCampos = ["stock", "precio", "activo"];
    const patch: Record<string, string | number> = {};
    if (numCampos.includes(campo)) {
      const n = parseFloat(valor);
      if (isNaN(n)) return { ok: false, reply: `❌ "${valor}" no es un número válido.` };
      patch[campo] = n;
    } else {
      patch[campo] = valor;
    }
    updateProduct(p.id, patch);
    return { ok: true, reply: `✅ *${p.nombre}* — ${campo} actualizado a "${valor}"` };
  }

  // /inv borra NOMBRE
  const borraMatch = cmd.match(/^borra\s+(.+)$/i);
  if (borraMatch) {
    const p = findProductByName(borraMatch[1].trim());
    if (!p) return { ok: false, reply: `❌ Producto "${borraMatch[1].trim()}" no encontrado.` };
    deleteProduct(p.id);
    return { ok: true, reply: `🗑️ Producto *${p.nombre}* eliminado.` };
  }

  // comando desconocido
  return {
    ok: false,
    reply: `❓ Comando no reconocido. Envía */inv ayuda* para ver los comandos disponibles.`,
  };
}
