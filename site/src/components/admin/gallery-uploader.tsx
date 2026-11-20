"use client";

import { CheckCircle2, ImagePlus, Loader2, X, XCircle } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/admin/action-result";
import { FormMessage } from "./forms";
import { ACCEPTED_IMAGE_TYPES, altFromFileName, uploadImage } from "./media-input";
import { btn, inputClass, Label } from "./ui";

type Row = { key: string; name: string; status: "uploading" | "done" | "error"; error?: string; mediaId?: string; url?: string; caption: string; alt: string };

/**
 * Upload several images at once. Each file is uploaded (and re-encoded on
 * the server) immediately; nothing is added to the gallery until "Add to
 * gallery" succeeds.
 */
export function GalleryUploader({ addItems }: { addItems: (input: unknown) => Promise<ActionResult> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [category, setCategory] = useState("VILLAS");
  const [source, setSource] = useState("PHOTO");
  const [publish, setPublish] = useState(false);
  const [result, setResult] = useState<ActionResult>(null);
  const [saving, startSaving] = useTransition();

  const patch = (key: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  function onFiles(files: FileList | null) {
    if (!files) return;
    setResult(null);
    for (const file of Array.from(files).slice(0, 30)) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`;
      const guess = altFromFileName(file.name);
      setRows((rs) => [...rs, { key, name: file.name, status: "uploading", caption: guess.slice(0, 120), alt: "" }]);
      uploadImage(file)
        .then((a) => patch(key, { status: "done", mediaId: a.id, url: a.url }))
        .catch((e: Error) => patch(key, { status: "error", error: e.message }));
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const ready = rows.filter((r) => r.status === "done");
  const uploading = rows.some((r) => r.status === "uploading");

  function submit() {
    startSaving(async () => {
      const res = await addItems({
        category,
        source,
        publish,
        items: ready.map((r) => ({ mediaId: r.mediaId, caption: r.caption.trim(), alt: r.alt.trim() })),
      });
      setResult(res);
      if (res?.ok) setRows((rs) => rs.filter((r) => r.status !== "done"));
    });
  }

  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="up-category">Category</Label>
          <select id="up-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="VILLAS">Villas</option>
            <option value="INTERIORS">Interiors</option>
            <option value="AMENITIES">Amenities</option>
            <option value="COMMUNITY">Community</option>
          </select>
        </div>
        <div>
          <Label htmlFor="up-source">Type</Label>
          <select id="up-source" value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
            <option value="PHOTO">Photograph (real place)</option>
            <option value="RENDER">Render (artist&apos;s impression)</option>
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-3 self-end pb-2.5 text-sm font-semibold text-ink">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="size-5 accent-pine" />
          Publish immediately
        </label>
      </div>

      <div>
        <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES} multiple className="sr-only" id="gallery-files" onChange={(e) => onFiles(e.target.files)} />
        <label
          htmlFor="gallery-files"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-field/50 bg-canvas/50 px-4 py-8 text-center hover:border-gold/60 focus-within:outline-2 focus-within:outline-gold"
        >
          <ImagePlus className="size-7 text-stone" aria-hidden />
          <span className="font-semibold text-ink">Choose images to upload</span>
          <span className="text-sm text-stone">JPEG, PNG, WebP or AVIF · up to 15 MB each · location data is removed automatically</span>
        </label>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.key} className="flex flex-col gap-3 rounded-lg border border-line p-3 sm:flex-row sm:items-start">
              <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-sand">
                {r.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- upload preview
                  <img src={r.url} alt="" className="h-full w-full object-cover" />
                ) : r.status === "uploading" ? (
                  <Loader2 className="size-5 animate-spin text-stone" aria-label="Uploading" />
                ) : (
                  <XCircle className="size-5 text-danger" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="flex items-center gap-2 truncate text-sm text-stone">
                  {r.status === "done" ? <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden /> : null}
                  {r.name}
                  {r.status === "uploading" ? " — uploading…" : ""}
                </p>
                {r.status === "error" ? (
                  <p className="text-sm text-danger" role="alert">
                    {r.error}
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input aria-label={`Caption for ${r.name}`} placeholder="Caption" value={r.caption} maxLength={120} onChange={(e) => patch(r.key, { caption: e.target.value })} className={inputClass} />
                    <input aria-label={`Alt text for ${r.name}`} placeholder="Alt text (what the image shows)" value={r.alt} maxLength={200} onChange={(e) => patch(r.key, { alt: e.target.value })} className={inputClass} />
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className={btn({ variant: "ghost", size: "sm", className: "self-end sm:self-start" })} aria-label={`Remove ${r.name} from this upload`}>
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <FormMessage state={result} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving || uploading || ready.length === 0 || ready.some((r) => !r.caption.trim())}
          className={btn()}
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Add {ready.length || ""} to gallery
        </button>
        {ready.some((r) => !r.caption.trim()) ? <p className="text-sm text-stone">Every image needs a caption.</p> : null}
      </div>
    </div>
  );
}
