import { WorkbenchShell } from "@/components/workbench/shell";
import { RecordingProvider } from "@/providers/RecordingProvider";

export default function WorkbenchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RecordingProvider>
            <WorkbenchShell>{children}</WorkbenchShell>
        </RecordingProvider>
    );
}
