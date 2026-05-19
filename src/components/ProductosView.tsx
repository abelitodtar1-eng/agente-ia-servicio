"use client";
import { useState, useEffect, useRef, FormEvent } from "react";

const BG = "#0a0c10"; const CARD = "#1a1d27"; const BORD = "#2a2d3e";
const PRP = "#6c63ff"; const TEAL = "#00d4aa"; const RED = "#ff6b6b";
const TEXT = "#e2e8f0"; const MUTED = "#8892a4"; const YELLOW = "#f6c90e";

interface Product {
  id: number;
  nombre: string;
  categoria: string;
  udm: string;
  stock: number;
  precio: number;
  activo: number;
  imagen: string | null;
  updated_at: number;
}

const EMPTY_FORM = { nombre: "", categoria: "", udm: "", stock: "0", precio: "0", activo: 1 };

function inputStyle(focus: boolean) {
  return {
    width: "100%", background: BG, border: `1px solid ${focus ? PRP : BORD}`, borderRadius: 8,
    padding: "9px 12px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box" as const,
    transition: "border-color .15s",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <Field label={label}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={inputStyle(focus)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />
    </Field>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <Field label={label}>
      <input type="number" min="0" step="any" value={value} onChange={e => onChange(e.target.value)}
        style={inputStyle(focus)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />
    </Field>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 16, padding: "24px 28px", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: MUTED, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, variant = "primary", disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "outline" | "danger" | "success"; disabled?: boolean;
}) {
  const bg: Record<string, React.CSSProperties> = {
    primary: { background: PRP, color: "#fff", border: "none" },
    outline: { background: "transparent", color: MUTED, border: `1px solid ${BORD}` },
    danger: { background: "transparent", color: RED, border: `1px solid rgba(255,107,107,.3)` },
    success: { background: TEAL, color: "#0a0c10", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...bg[variant], borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .6 : 1,
    }}>
      {children}
    </button>
  );
}

function ProductForm({
  initial, onSubmit, submitting, error,
}: {
  initial: typeof EMPTY_FORM;
  onSubmit: (data: typeof EMPTY_FORM) => void;
  submitting: boolean;
  error: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY_FORM) => (v: string | number) => setForm(p => ({ ...p, [k]: v }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <TextInput label="Nombre *" value={form.nombre} onChange={set("nombre")} placeholder="Ej. Arroz 1kg" required />
      <TextInput label="Categoría" value={form.categoria} onChange={set("categoria")} placeholder="Ej. Granos" />
      <TextInput label="Unidad de medida" value={form.udm} onChange={set("udm")} placeholder="Ej. kg, L, unid" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <NumberInput label="Stock" value={String(form.stock)} onChange={set("stock")} />
        <NumberInput label="Precio (CUP)" value={String(form.precio)} onChange={set("precio")} />
      </div>
      <Field label="Estado">
        <div style={{ display: "flex", gap: 10 }}>
          {[{ v: 1, label: "Activo", color: TEAL }, { v: 0, label: "Inactivo", color: MUTED }].map(opt => (
            <button key={opt.v} type="button" onClick={() => set("activo")(opt.v)}
              style={{
                flex: 1, padding: "8px", fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: "pointer",
                background: form.activo === opt.v ? `${opt.color}22` : "transparent",
                border: `1px solid ${form.activo === opt.v ? opt.color : BORD}`,
                color: form.activo === opt.v ? opt.color : MUTED,
                transition: "all .15s",
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </Field>
      {error && <p style={{ color: RED, fontSize: 12, marginBottom: 14 }}>{error}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <ActionBtn variant="primary" disabled={submitting || !form.nombre.trim()}>
          {submitting ? "Guardando..." : "Guardar"}
        </ActionBtn>
      </div>
    </form>
  );
}

function ImageUpload({ product, onUpdated }: { product: Product; onUpdated: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleFile(file: File) {
    setUploading(true); setMsg("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/admin/products/${product.id}/image`, { method: "POST", body: form });
    setUploading(false);
    if (res.ok) { setMsg("Imagen actualizada"); onUpdated(); }
    else { const d = await res.json(); setMsg(d.error ?? "Error"); }
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleDelete() {
    setUploading(true);
    await fetch(`/api/admin/products/${product.id}/image`, { method: "DELETE" });
    setUploading(false);
    onUpdated();
  }

  const imgSrc = product.imagen
    ? `/api/product-images/${product.imagen}?t=${product.updated_at}`
    : null;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>Imagen</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            width: 72, height: 72, borderRadius: 8, border: `1px dashed ${BORD}`, overflow: "hidden",
            cursor: "pointer", background: BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          {imgSrc
            ? <img src={imgSrc} alt={product.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 20 }}>📷</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ fontSize: 11, padding: "5px 12px", background: "transparent", border: `1px solid ${BORD}`, color: TEXT, borderRadius: 6, cursor: "pointer" }}>
            {uploading ? "Subiendo..." : "Cambiar imagen"}
          </button>
          {product.imagen && (
            <button type="button" onClick={handleDelete} disabled={uploading}
              style={{ fontSize: 11, padding: "5px 12px", background: "transparent", border: `1px solid rgba(255,107,107,.3)`, color: RED, borderRadius: 6, cursor: "pointer" }}>
              Eliminar imagen
            </button>
          )}
          {msg && <span style={{ fontSize: 11, color: TEAL }}>{msg}</span>}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}

export function ProductosView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editErr, setEditErr] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function handleAdd(form: typeof EMPTY_FORM) {
    setAddSubmitting(true); setAddErr("");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, stock: Number(form.stock), precio: Number(form.precio) }),
    });
    setAddSubmitting(false);
    if (res.ok) {
      setShowAdd(false);
      load();
      flash("Producto creado");
    } else {
      const d = await res.json();
      setAddErr(d.error ?? "Error al crear");
    }
  }

  async function handleEdit(form: typeof EMPTY_FORM) {
    if (!editProduct) return;
    setEditSubmitting(true); setEditErr("");
    const res = await fetch(`/api/admin/products/${editProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, stock: Number(form.stock), precio: Number(form.precio) }),
    });
    setEditSubmitting(false);
    if (res.ok) {
      setEditProduct(null);
      load();
      flash("Producto actualizado");
    } else {
      const d = await res.json();
      setEditErr(d.error ?? "Error al actualizar");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    load();
    flash("Producto eliminado");
  }

  async function toggleActivo(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: p.activo === 1 ? 0 : 1 }),
    });
    load();
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return !q || p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q);
  });

  const totalActivos = products.filter(p => p.activo).length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORD}`, background: CARD, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Productos</h2>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
              {products.length} productos · {totalActivos} activos · stock total: {totalStock.toLocaleString("es-CU")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              style={{ ...inputStyle(focus), width: 180, fontSize: 12 }}
              onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            />
            <ActionBtn onClick={() => { setShowAdd(true); setAddErr(""); }}>+ Nuevo</ActionBtn>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>

        {/* Toast */}
        {toast && (
          <div style={{ background: "rgba(0,212,170,.08)", border: `1px solid rgba(0,212,170,.2)`, borderRadius: 8, padding: "10px 16px", fontSize: 13, color: TEAL, marginBottom: 16 }}>
            ✓ {toast}
          </div>
        )}

        {/* Table */}
        <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: MUTED, fontSize: 13 }}>
              {search ? "Sin resultados para esa búsqueda." : "Sin productos aún. Agrega el primero."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORD}` }}>
                    {["Imagen", "Nombre", "Categoría", "UDM", "Stock", "Precio", "Estado", "Acciones"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${BORD}` }}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", background: BG, border: `1px solid ${BORD}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {p.imagen
                            ? <img src={`/api/product-images/${p.imagen}?t=${p.updated_at}`} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span style={{ fontSize: 16 }}>📦</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: TEXT, maxWidth: 180 }}>{p.nombre}</td>
                      <td style={{ padding: "10px 14px", color: MUTED, fontSize: 12 }}>{p.categoria || "—"}</td>
                      <td style={{ padding: "10px 14px", color: MUTED, fontSize: 12 }}>{p.udm || "—"}</td>
                      <td style={{ padding: "10px 14px", color: p.stock <= 0 ? RED : TEXT, fontFamily: "monospace", fontSize: 12 }}>{p.stock.toLocaleString("es-CU")}</td>
                      <td style={{ padding: "10px 14px", color: YELLOW, fontFamily: "monospace", fontSize: 12 }}>{p.precio.toLocaleString("es-CU")}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <button onClick={() => toggleActivo(p)} style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, cursor: "pointer",
                          background: p.activo ? `${TEAL}1a` : `${MUTED}1a`,
                          color: p.activo ? TEAL : MUTED,
                          border: `1px solid ${p.activo ? `${TEAL}44` : `${MUTED}44`}`,
                        }}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => { setEditProduct(p); setEditErr(""); }}
                            style={{ background: "transparent", border: `1px solid ${BORD}`, color: MUTED, fontSize: 11, padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            style={{ background: "transparent", border: "1px solid rgba(255,107,107,.2)", color: RED, fontSize: 11, padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Nuevo producto" onClose={() => setShowAdd(false)}>
          <ProductForm
            initial={EMPTY_FORM}
            onSubmit={handleAdd}
            submitting={addSubmitting}
            error={addErr}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <Modal title={`Editar — ${editProduct.nombre}`} onClose={() => setEditProduct(null)}>
          <ImageUpload product={editProduct} onUpdated={load} />
          <ProductForm
            initial={{
              nombre: editProduct.nombre,
              categoria: editProduct.categoria,
              udm: editProduct.udm,
              stock: String(editProduct.stock),
              precio: String(editProduct.precio),
              activo: editProduct.activo,
            }}
            onSubmit={handleEdit}
            submitting={editSubmitting}
            error={editErr}
          />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Confirmar eliminación" onClose={() => setDeleteTarget(null)}>
          <p style={{ color: MUTED, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            ¿Eliminar <strong style={{ color: TEXT }}>{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <ActionBtn variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</ActionBtn>
            <ActionBtn variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </ActionBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}
