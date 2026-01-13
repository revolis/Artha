import { PageHeader } from "@/components/page-header";
import { ChartCard } from "@/components/chart-card";
import { NetPLChart } from "@/components/charts/net-pl-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { netSeries, categorySeries } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Break down performance by period, category, source, and volatility."
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="source">By Source</TabsTrigger>
          <TabsTrigger value="tags">By Tags</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <ChartCard title="Net performance" subtitle="Grouped by month">
              <NetPLChart data={netSeries} />
            </ChartCard>
            <ChartCard title="Contribution mix" subtitle="Category share">
              <CategoryDonut data={categorySeries} />
            </ChartCard>
          </div>
        </TabsContent>
        <TabsContent value="category">
          <ChartCard title="Category breakdown" subtitle="Profit vs loss by category">
            <CategoryDonut data={categorySeries} />
          </ChartCard>
        </TabsContent>
        <TabsContent value="source">
          <ChartCard title="Sources" subtitle="Top performing platforms">
            <NetPLChart data={netSeries} />
          </ChartCard>
        </TabsContent>
        <TabsContent value="tags">
          <ChartCard title="Tags" subtitle="Most influential labels">
            <NetPLChart data={netSeries} />
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
