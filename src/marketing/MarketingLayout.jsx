import AppShell from "../app/AppShell";
import PageMeta from "../shared/ui/PageMeta";

export default function MarketingLayout({ meta, actions, children }) {
  return (
    <>
      <PageMeta {...meta} />
      <AppShell actions={actions}>{children}</AppShell>
    </>
  );
}
