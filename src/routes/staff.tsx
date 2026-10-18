import { createFileRoute } from "@tanstack/react-router";
import { ListDetailPage, headFor } from "@/components/ListDetail";
import { Badge, DL } from "@/components/kit";
import { STAFF, type StaffMember } from "@/lib/staff";

export const Route = createFileRoute("/staff")({
  head: headFor("Staff", "Clinic staff directory."),
  component: Page,
});

function Page() {
  return (
    <ListDetailPage<StaffMember>
      title="Staff"
      sub="Everyone with access to this clinic."
      rows={STAFF}
      tabs={[{ value: "all", label: "All" }, { value: "Provider", label: "Providers" }, { value: "Front Desk", label: "Front Desk" }, { value: "Admin", label: "Admins" }]}
      tabFilter={(r, t) => t === "all" || r.group === t}
      search={(r) => `${r.name} ${r.role} ${r.email}`}
      searchPlaceholder="Name, role or email"
      columns={[
        { label: "Name", render: (r) => <span className="font-semibold">{r.name}</span> },
        { label: "Role", render: (r) => r.role },
        { label: "Access", render: (r) => r.group },
        { label: "Status", render: (r) => <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Active" : "Invited"}</Badge> },
      ]}
      previewTitle={(r) => r.name}
      preview={(r) => <DL items={[["Role", r.role], ["Access", r.group], ["Email", r.email], ["Works", r.days.join(", ")]]} />}
    />
  );
}
