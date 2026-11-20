import { CalendarClock, MessageSquareText, Phone, UserPlus, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionForm, ConfirmAction, SelectField, SubmitButton, TextareaField, TextField } from "@/components/admin/forms";
import { AccessDenied, Badge, Card, CardHeader, DescriptionList, PageHeader } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import {
  BOOKING_STATUSES,
  bookingReference,
  bookingStatus,
  formatDateTime,
  formatPhone,
  formatVisitDate,
  nowMs,
  OPEN_STATUSES,
  relativeDays,
  type BookingStatus,
} from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { addBookingNote, assignBooking, deleteBooking, setFollowUp, updateBookingStatus } from "../actions";

export const metadata: Metadata = { title: "Booking" };

/** datetime-local value in India time. */
function toLocalInput(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function BookingPage({ params }: PageProps<"/admin/bookings/[id]">) {
  const user = await requireAdminPage();
  if (!can(user, "BOOKINGS")) return <AccessDenied feature="bookings" />;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = getDb();
  const [b, staff] = await Promise.all([
    db.siteVisitRequest.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { fullName: true } } } },
      },
    }),
    db.staffMember.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
  ]);
  if (!b) notFound();

  const ref = bookingReference(b.id);
  const status = bookingStatus[b.status];
  const waDigits = b.phone.replace(/\D/g, "");
  const firstName = b.name.split(" ")[0];
  const waText = encodeURIComponent(`Hello ${firstName}, this is the Aurelia Enclave team regarding your site-visit request (ref ${ref}).`);
  const overdue = b.followUpAt && b.followUpAt.getTime() < nowMs() && OPEN_STATUSES.includes(b.status);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/bookings", label: "All bookings" }}
        title={b.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            <span>Reference #{ref}</span>
            <span aria-hidden>·</span>
            <span>Received {formatDateTime(b.createdAt)}</span>
          </span>
        }
        actions={
          <>
            <a href={`tel:${b.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-pine px-4 text-sm font-semibold text-ivory hover:bg-pine-soft">
              <Phone className="size-4" aria-hidden /> Call
            </a>
            <a
              href={`https://wa.me/${waDigits}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-field/60 bg-white px-4 text-sm font-semibold text-ink hover:border-ink/60"
            >
              <WhatsAppIcon className="size-4 text-[#128c4b]" /> WhatsApp<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Request details" />
            <div className="p-5">
              <DescriptionList
                items={[
                  { label: "Phone", value: <a className="tabular-nums underline-offset-2 hover:underline" href={`tel:${b.phone}`}>{formatPhone(b.phone)}</a> },
                  { label: "Preferred visit date", value: formatVisitDate(b.visitDate) },
                  { label: "Villa of interest", value: b.villa ?? "Not sure yet" },
                  { label: "Submitted from", value: b.sourcePath ?? "—" },
                  { label: "Assigned to", value: b.assignedTo?.fullName ?? "Unassigned" },
                  {
                    label: "Next follow-up",
                    value: b.followUpAt ? (
                      <span className={overdue ? "font-semibold text-danger" : undefined}>
                        {formatDateTime(b.followUpAt)} ({overdue ? "overdue" : relativeDays(b.followUpAt)})
                      </span>
                    ) : (
                      "Not scheduled"
                    ),
                  },
                ]}
              />
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs font-semibold tracking-wide text-stone uppercase">Customer&apos;s message</p>
                <p className="mt-1 whitespace-pre-line text-[0.9375rem]">{b.message ?? <span className="text-stone">No message.</span>}</p>
              </div>
              <p className="mt-4 text-xs text-stone">
                Consent to be contacted given {formatDateTime(b.consentAt)} (wording version {b.consentVersion}).
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Notes & activity" description="Visible to everyone with access to bookings." />
            <div className="p-5">
              <ActionForm action={addBookingNote} resetOnSuccess className="space-y-3">
                <input type="hidden" name="id" value={b.id} />
                <TextareaField name="note" label="Add a note" rows={3} maxLength={2000} placeholder="e.g. Called — prefers a Saturday morning visit with family." />
                <SubmitButton pendingLabel="Adding…">Add note</SubmitButton>
              </ActionForm>
              <ol className="mt-6 space-y-4 border-l border-line pl-5">
                {b.activities.map((a) => (
                  <TimelineItem
                    key={a.id}
                    icon={a.type === "NOTE" ? MessageSquareText : a.type === "ASSIGNED" ? UserPlus : CalendarClock}
                    who={a.actor?.fullName ?? "Former staff member"}
                    when={a.createdAt}
                  >
                    {a.type === "NOTE" ? (
                      <p className="mt-1 whitespace-pre-line text-[0.9375rem] text-ink">{a.body}</p>
                    ) : a.type === "STATUS_CHANGED" ? (
                      <>changed status from {bookingStatus[a.fromValue as BookingStatus]?.label ?? a.fromValue} to {bookingStatus[a.toValue as BookingStatus]?.label ?? a.toValue}</>
                    ) : a.type === "ASSIGNED" ? (
                      <>assigned this booking to {a.toValue}</>
                    ) : a.type === "FOLLOW_UP_SET" ? (
                      <>scheduled a follow-up for {a.toValue ? formatDateTime(new Date(a.toValue)) : "—"}</>
                    ) : (
                      <>cleared the follow-up</>
                    )}
                  </TimelineItem>
                ))}
                <TimelineItem icon={CalendarClock} who="Website" when={b.createdAt}>
                  request received through the booking form
                </TimelineItem>
              </ol>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <ActionForm action={updateBookingStatus} className="space-y-3 p-5">
              <input type="hidden" name="id" value={b.id} />
              <SelectField
                name="status"
                label="Booking status"
                defaultValue={b.status}
                options={BOOKING_STATUSES.map((s) => ({ value: s, label: bookingStatus[s].label }))}
                hint={BOOKING_STATUSES.map((s) => `${bookingStatus[s].label}: ${bookingStatus[s].help.toLowerCase()}`).join(" · ")}
              />
              <SubmitButton className="w-full">Update status</SubmitButton>
            </ActionForm>
          </Card>

          <Card>
            <CardHeader title="Assignment" />
            <ActionForm action={assignBooking} className="space-y-3 p-5">
              <input type="hidden" name="id" value={b.id} />
              <SelectField
                name="assignee"
                label="Responsible team member"
                defaultValue={b.assignedTo?.id ?? ""}
                options={[{ value: "", label: "Unassigned" }, ...staff.map((s) => ({ value: s.id, label: s.id === user.id ? `${s.fullName} (me)` : s.fullName }))]}
              />
              <SubmitButton className="w-full" variant="secondary">
                Save assignment
              </SubmitButton>
            </ActionForm>
          </Card>

          <Card>
            <CardHeader title="Follow-up" description="India time." />
            <ActionForm action={setFollowUp} className="space-y-3 p-5">
              <input type="hidden" name="id" value={b.id} />
              <TextField name="followUpAt" label="Next follow-up" type="datetime-local" defaultValue={b.followUpAt ? toLocalInput(b.followUpAt) : ""} />
              <div className="flex gap-2">
                <SubmitButton className="flex-1" variant="secondary">
                  Schedule
                </SubmitButton>
                {b.followUpAt ? (
                  <SubmitButton name="clear" value="1" variant="ghost" pendingLabel="Clearing…">
                    Clear
                  </SubmitButton>
                ) : null}
              </div>
            </ActionForm>
          </Card>

          {can(user, "OWNER") ? (
            <Card>
              <CardHeader title="Delete booking" description="For a customer's request to erase their data. This cannot be undone." />
              <div className="p-5">
                <ConfirmAction
                  action={deleteBooking}
                  hidden={{ id: b.id }}
                  trigger="Delete permanently"
                  triggerVariant="secondary"
                  title={`Delete booking #${ref}?`}
                  body="The customer's name, phone number, message and all notes for this booking will be permanently erased. The audit log keeps only the reference number."
                  confirmLabel="Delete permanently"
                />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function TimelineItem({ icon: Icon, who, when, children }: { icon: LucideIcon; who: string; when: Date; children: React.ReactNode }) {
  return (
    <li className="relative">
      <span className="absolute top-0.5 -left-[1.95rem] inline-flex size-6 items-center justify-center rounded-full border border-line bg-white text-stone">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="text-sm text-stone">
        <span className="font-semibold text-ink">{who}</span> {children}
      </div>
      <p className="text-xs text-stone/80">{formatDateTime(when)}</p>
    </li>
  );
}
