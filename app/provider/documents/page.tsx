"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Eye, FileUp, Loader2, ShieldCheck, XCircle } from "lucide-react";
import ProviderShell, { btnPrimary, btnSecondary, Card, inputCls, Notice } from "@/components/provider/ProviderShell";
import { apiError } from "@/lib/api";
import { providerApi, type MyDocument } from "@/lib/providerApi";

const STATUS = {
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  pending: { label: "Under review", cls: "bg-amber-50 text-amber-700", icon: Clock3 },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700", icon: XCircle },
} as const;

const MAX_BYTES = 5 * 1024 * 1024;

export default function ProviderDocumentsPage() {
  return (
    <ProviderShell title="Verification documents" subtitle="Verified providers get a badge and rank higher in search.">
      <Documents />
    </ProviderShell>
  );
}

function Documents() {
  const [docs, setDocs] = useState<MyDocument[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [type, setType] = useState("Aadhaar");
  const [number, setNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await providerApi.myDocuments();
      setDocs(r.verification);
      setTypes(r.document_types);
    } catch (e) {
      setError(apiError(e, "Could not load your documents."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasAadhaar = docs.some((d) => d.document_type === "Aadhaar");
  const byType = new Map(docs.map((d) => [d.document_type, d]));
  const canUpload = (t: string) => !byType.has(t) || byType.get(t)!.status === "rejected";
  const uploadable = types.filter(canUpload).filter((t) => t === "Aadhaar" || hasAadhaar);

  // Jo type upload nahi ho sakta, use select mein mat rakho
  const effectiveType = uploadable.includes(type) ? type : uploadable[0] ?? "";

  function pickFile(f: File | null) {
    setError("");
    if (f && f.size > MAX_BYTES) {
      setError("File is larger than 5 MB. Please upload a smaller photo or PDF.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !effectiveType) return;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const fd = new FormData();
      fd.append("document_type", effectiveType);
      fd.append("document_number", number);
      fd.append("document", file);
      const r = await providerApi.uploadDocument(fd);
      setNotice(r.message || "Document uploaded.");
      setNumber("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(apiError(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  }

  async function view(id: number) {
    try {
      const blob = await providerApi.documentFile(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(apiError(e, "Could not open the file."));
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}

        <Card className="p-0">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-950">Your documents</h2>
          </div>
          {docs.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">No documents yet. Start with your Aadhaar card.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {docs.map((d) => {
                const s = STATUS[d.status] ?? STATUS.pending;
                return (
                  <li key={d.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-950">{d.document_type}</p>
                      <p className="text-sm text-gray-500">
                        {d.document_number || "No number"}
                        {d.file_name ? ` · ${d.file_name}` : ""}
                      </p>
                      {d.status === "rejected" && d.rejection_reason && (
                        <p className="mt-1 text-sm text-rose-700">Reason: {d.rejection_reason}. Please upload again.</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
                        <s.icon size={13} /> {s.label}
                      </span>
                      {d.has_file && (
                        <button type="button" onClick={() => void view(d.id)} className={btnSecondary + " px-3 py-1.5 text-xs"}>
                          <Eye size={14} /> View
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="h-fit">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
          <FileUp size={19} /> Upload a document
        </h2>
        {uploadable.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">All documents are submitted. We&apos;ll notify you after review.</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-semibold text-gray-800">Document</label>
              <select id="type" value={effectiveType} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {uploadable.map((t) => (
                  <option key={t} value={t}>
                    {t}
                    {byType.get(t)?.status === "rejected" ? " (re-upload)" : ""}
                  </option>
                ))}
              </select>
              {!hasAadhaar && <p className="mt-1 text-xs text-gray-500">Aadhaar is required first. Other documents unlock after it.</p>}
            </div>
            <div>
              <label htmlFor="number" className="mb-1.5 block text-sm font-semibold text-gray-800">
                {effectiveType === "Aadhaar" ? "Aadhaar number" : effectiveType === "PAN" ? "PAN number" : "Document number (optional)"}
              </label>
              <input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                inputMode={effectiveType === "Aadhaar" ? "numeric" : "text"}
                placeholder={effectiveType === "Aadhaar" ? "1234 5678 9012" : effectiveType === "PAN" ? "ABCDE1234F" : ""}
                className={inputCls}
                autoComplete="off"
                required={effectiveType === "Aadhaar" || effectiveType === "PAN"}
              />
            </div>
            <div>
              <label htmlFor="file" className="mb-1.5 block text-sm font-semibold text-gray-800">File</label>
              <input
                id="file"
                ref={fileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                required
              />
              <p className="mt-1 text-xs text-gray-500">PDF, JPG or PNG, up to 5 MB. Make sure all text is readable.</p>
            </div>
            <button type="submit" disabled={uploading || !file} className={btnPrimary + " w-full"}>
              {uploading && <Loader2 size={16} className="animate-spin" />} Upload
            </button>
          </form>
        )}
        <p className="mt-5 flex items-start gap-2 text-xs text-gray-500">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          Documents are stored privately and only our verification team can see them. We show only the last 4 digits of your ID number.
        </p>
      </Card>
    </div>
  );
}
