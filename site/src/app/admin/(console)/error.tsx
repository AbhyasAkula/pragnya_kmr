"use client";

import { AlertTriangle } from "lucide-react";
import { btn, Card, EmptyState } from "@/components/admin/ui";

/** Shown if a dashboard page fails to load (e.g. the database is unreachable). */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-6 max-w-xl">
      <EmptyState
        icon={<AlertTriangle className="size-8 text-warning" aria-hidden />}
        title="This page couldn't be loaded"
        action={
          <button type="button" onClick={reset} className={btn()}>
            Try again
          </button>
        }
      >
        The database may be briefly unavailable. Nothing was changed. If this keeps happening, contact your website administrator.
      </EmptyState>
    </Card>
  );
}
