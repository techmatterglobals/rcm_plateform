import {
  AlertTriangleIcon,
  ClipboardCheckIcon,
  ConciergeBellIcon,
  FileEditIcon,
  FileTextIcon,
  HashIcon,
  MessageCircleIcon,
  ReceiptIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  "message-circle": MessageCircleIcon,
  hash: HashIcon,
  receipt: ReceiptIcon,
  "shield-check": ShieldCheckIcon,
  "clipboard-check": ClipboardCheckIcon,
  "alert-triangle": AlertTriangleIcon,
  "file-edit": FileEditIcon,
  "file-text": FileTextIcon,
  "scan-search": ScanSearchIcon,
  "concierge-bell": ConciergeBellIcon,
  sparkles: SparklesIcon,
};

export function AssistantIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || SparklesIcon;
  return <Icon className={className} />;
}
