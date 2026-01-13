import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-mutedForeground">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {actions ?? <Button variant="secondary">Create</Button>}
      </div>
    </div>
  );
}
