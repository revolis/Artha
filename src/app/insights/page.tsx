import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const prompts = [
  "Summarize net performance this month",
  "Which category drives most profit?",
  "Any patterns in losing days?"
];

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Gemini Insights"
        description="Ask questions about your numbers and notes only."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/60 p-4 text-sm text-mutedForeground">
              Gemini responses will appear here. Attachments are never sent.
            </div>
            <div className="flex gap-3">
              <Input placeholder="Ask about net performance, categories, or trends..." />
              <Button>Send</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Suggested prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                className="w-full rounded-2xl border border-border px-4 py-3 text-left text-sm"
              >
                {prompt}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
