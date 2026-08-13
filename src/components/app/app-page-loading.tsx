import { PageContainer } from "@/components/app/mobile-ui";

export function AppPageLoading() {
  return (
    <PageContainer aria-busy="true" className="grid gap-7" role="status">
      <div className="animate-pulse">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="mt-3 h-8 w-52 rounded bg-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 animate-pulse rounded-[var(--radius-card)] bg-muted" />
        <div className="h-28 animate-pulse rounded-[var(--radius-card)] bg-muted" />
      </div>
      <div className="h-52 animate-pulse rounded-[var(--radius-card)] bg-muted" />
    </PageContainer>
  );
}
