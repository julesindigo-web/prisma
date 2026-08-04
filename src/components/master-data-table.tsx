'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Column = {
  key: string;
  label: string;
  type?: 'text' | 'select';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  editable?: boolean;
};

type Row = Record<string, unknown> & { id: string };

type Props = {
  columns: Column[];
  rows: Row[];
  action: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  title?: string;
};

export default function MasterDataTable({ columns, rows, action, deleteAction }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const editableCols = columns.filter((c) => c.editable !== false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await action(fd);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const fd = new FormData();
    fd.set('id', id);
    await deleteAction(fd);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-graphite/50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="py-1 pr-4">{c.label}</th>
            ))}
            <th className="py-1 pr-4">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-graphite/5">
              {editingId === row.id ? (
                <td colSpan={columns.length + 1} className="py-2">
                  <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    {editableCols.map((col) => (
                      <div key={col.key} className="flex flex-col">
                        <label className="text-[10px] text-graphite/50">{col.label}</label>
                        {col.type === 'select' && col.options ? (
                          <select name={col.key} defaultValue={String(row[col.key] ?? '')} className="field-input text-xs" required={col.required !== false}>
                            {col.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            name={col.key}
                            defaultValue={String(row[col.key] ?? '')}
                            placeholder={col.placeholder}
                            className="field-input text-xs"
                            required={col.required !== false}
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <button type="submit" className="text-xs text-green-600 hover:underline">Simpan</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-xs text-graphite/40 hover:underline">Batal</button>
                    </div>
                  </form>
                </td>
              ) : deletingId === row.id ? (
                <td colSpan={columns.length + 1} className="py-2">
                  <span className="text-xs text-red-600">Yakin hapus? </span>
                  <button onClick={() => handleDelete(row.id)} className="text-xs text-red-600 font-semibold hover:underline">Ya, Hapus</button>
                  <button onClick={() => setDeletingId(null)} className="text-xs text-graphite/40 hover:underline ml-2">Batal</button>
                </td>
              ) : (
                <>
                  {columns.map((col) => (
                    <td key={col.key} className="py-1 pr-4">{String(row[col.key] ?? '—')}</td>
                  ))}
                  <td className="py-1 pr-4 flex gap-2">
                    <button onClick={() => setEditingId(row.id)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => setDeletingId(row.id)} className="text-xs text-red-600 hover:underline">Hapus</button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length + 1} className="py-3 text-center text-graphite/40">Tidak ada data.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
