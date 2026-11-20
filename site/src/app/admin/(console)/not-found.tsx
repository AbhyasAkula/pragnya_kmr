import { SearchX } from "lucide-react";
import { Card, EmptyState, LinkButton } from "@/components/admin/ui";

export default function AdminNotFound() {
  return (
    <Card className="mx-auto mt-6 max-w-xl">
      <EmptyState icon={<SearchX className="size-8" aria-hidden />} title="Not found" action={<LinkButton href="/admin" variant="secondary">Back to dashboard</LinkButton>}>
        It may have been deleted, or the link is incorrect.
      </EmptyState>
    </Card>
  );
}
