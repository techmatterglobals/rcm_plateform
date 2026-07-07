"use client";

import { useState } from "react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/use-admin";

function truncate(value: string | null, length = 8) {
  if (!value) return "—";
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

export default function AdminAuditLogsPage() {
  const [actionInput, setActionInput] = useState("");
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const { data: logs, isLoading } = useAuditLogs(actionFilter);

  const applyFilter = () => setActionFilter(actionInput.trim() || undefined);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every sensitive action, who did it, and when.
        </p>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Filter by action (e.g. auth.login)…"
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyFilter();
          }}
          onBlur={applyFilter}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="rounded-xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.resource_type} · {truncate(log.resource_id)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{truncate(log.actor_id)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.ip_address || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No audit log entries yet.
        </div>
      )}
    </div>
  );
}
