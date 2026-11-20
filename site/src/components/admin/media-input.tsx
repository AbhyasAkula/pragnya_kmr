"use client";

import { ImageIcon, ImagePlus, Library, Loader2, X } from "lucide-react";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { btn, FieldError, Hint, inputClass, Label } from "./ui";

export type UploadedAsset = { id: string; url: string; width: number; height: number; originalName: string };
type ImageValue = { src: string; alt: string };

export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif";
export const MAX_UPLOAD_MB = 15;

/** Uploads one image through the authenticated media endpoint. */
export async function uploadImage(file: File): Promise<UploadedAsset> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Images must be under ${MAX_UPLOAD_MB} MB.`);
  const body = new FormData();
  body.append("file", file);
  let res: Response;
  try {
    res = await fetch("/api/admin/media", { method: "POST", body });
  } catch {
    throw new Error("Upload failed: check your connection and try again.");
  }
  const data = (await res.json().catch(() => null)) as { asset?: UploadedAsset; error?: string } | null;
  if (!res.ok || !data?.asset) throw new Error(data?.error ?? "Upload failed. Please try again.");
  return data.asset;
}

/** Alt text suggestion from a file name ("pool-deck_01.jpg" → "Pool deck 01"). */
export function altFromFileName(name: string) {
  const base = name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "";
}

export function ImageInput({
  label,
  value,
  onChange,
  optional,
  allowEmpty,
  errors,
  hint,
}: {
  label: string;
  value: ImageValue | undefined;
  onChange: (v: ImageValue | undefined) => void;
  optional?: boolean;
  allowEmpty?: boolean;
  errors?: { src?: string; alt?: string };
  hint?: ReactNode;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      const asset = await uploadImage(file);
      onChange({ src: asset.url, alt: value?.alt || altFromFileName(asset.originalName) });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-stone">(optional)</span> : null}
      </p>
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-canvas/40 p-3 sm:flex-row">
        <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-sand sm:w-44">
          {value?.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an allowed URL, any size
            <img src={value.src} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="size-8 text-stone/60" aria-hidden />
          )}
          {busy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="size-6 animate-spin text-ink" aria-label="Uploading" />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="sr-only"
              id={`${id}-file`}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button type="button" className={btn({ variant: "secondary", size: "sm" })} disabled={busy} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-4" aria-hidden />
              {value?.src ? "Replace" : "Upload"}
            </button>
            <button type="button" className={btn({ variant: "secondary", size: "sm" })} disabled={busy} onClick={() => setLibraryOpen(true)}>
              <Library className="size-4" aria-hidden /> Library
            </button>
            {allowEmpty && value?.src ? (
              <button type="button" className={btn({ variant: "ghost", size: "sm", className: "text-danger" })} onClick={() => onChange(undefined)}>
                <X className="size-4" aria-hidden /> Remove
              </button>
            ) : null}
          </div>
          <div>
            <Label htmlFor={`${id}-alt`} className="text-xs">
              Description for screen readers (alt text)
            </Label>
            <input
              id={`${id}-alt`}
              value={value?.alt ?? ""}
              disabled={!value?.src}
              onChange={(e) => onChange({ src: value?.src ?? "", alt: e.target.value })}
              maxLength={200}
              placeholder="e.g. Villa facade with timber screens at dusk"
              aria-invalid={Boolean(errors?.alt)}
              className={inputClass}
            />
            <FieldError id={`${id}-alt-err`} message={errors?.alt} />
          </div>
          {hint ? <Hint>{hint}</Hint> : null}
          <FieldError id={`${id}-src-err`} message={uploadError ?? errors?.src} />
        </div>
      </div>
      {libraryOpen ? (
        <MediaLibraryDialog
          onClose={() => setLibraryOpen(false)}
          onSelect={(asset) => {
            onChange({ src: asset.url, alt: value?.alt || altFromFileName(asset.originalName) });
            setLibraryOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

type LibraryPage = { assets: UploadedAsset[]; nextCursor: string | null };

export function MediaLibraryDialog({ onClose, onSelect }: { onClose: () => void; onSelect: (a: UploadedAsset) => void }) {
  const titleId = useId();
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async (after: string | null) => {
    setState("loading");
    try {
      const res = await fetch(`/api/admin/media${after ? `?cursor=${encodeURIComponent(after)}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as LibraryPage;
      setAssets((cur) => (after ? [...cur, ...data.assets] : data.assets));
      setCursor(data.nextCursor);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  const dialogRef = useCallback(
    (node: HTMLDialogElement | null) => {
      if (node && !node.open) {
        node.showModal();
        void load(null);
      }
    },
    [load],
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto max-h-[85vh] w-[min(56rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 id={titleId} className="font-sans text-base font-semibold">
          Media library
        </h2>
        <button type="button" className={btn({ variant: "ghost", size: "sm" })} onClick={onClose} aria-label="Close media library">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="max-h-[calc(85vh-4rem)] overflow-y-auto p-5">
        {state === "error" ? <p className="text-sm text-danger">Couldn&apos;t load the library. Close and try again.</p> : null}
        {state === "ready" && assets.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone">No uploaded images yet. Use “Upload” to add one.</p>
        ) : null}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onSelect(a)}
                className="group block w-full overflow-hidden rounded-lg border border-line text-left focus-visible:outline-2 focus-visible:outline-gold"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail grid */}
                <img src={a.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-opacity group-hover:opacity-85" />
                <span className="block truncate px-2 py-1.5 text-xs text-stone">{a.originalName}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className={cn("mt-4 flex justify-center", state !== "loading" && !cursor && "hidden")}>
          {state === "loading" ? (
            <Loader2 className="size-5 animate-spin text-stone" aria-label="Loading" />
          ) : cursor ? (
            <button type="button" className={btn({ variant: "secondary", size: "sm" })} onClick={() => load(cursor)}>
              Load more
            </button>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
