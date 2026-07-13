import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { AssistantChat } from "./assistant-chat";

export const metadata = { title: "AI Assistant" };

export default async function AssistantPage() {
  const profile = await requireProfile();
  const configured = Boolean(process.env.GEMINI_API_KEY);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="AI Assistant"
        subtitle="Ask questions about your orders, inventory and demand forecasts — powered by Google Gemini"
      />
      <AssistantChat configured={configured} role={profile.role} />
    </div>
  );
}
