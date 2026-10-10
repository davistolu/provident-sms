import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, User, Activity, Clock, ShieldAlert, Globe, Eye, Copy, Check, FileText } from 'lucide-react';
import { api } from '@/services/api';
import { AuditLog, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

export const AuditLogsPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: logsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['audit-logs', actionFilter],
    queryFn: () =>
      api.get<PaginatedResponse<AuditLog>>('/audit/logs/', {
        action: actionFilter || undefined,
      }),
  });

  const getActionBadge = (action: string, display?: string) => {
    const text = display || action;
    if (action.includes('DELETE') || action.includes('REJECT')) {
      return <Badge variant="danger">{text}</Badge>;
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return <Badge variant="gold">{text}</Badge>;
    }
    if (action.includes('PAYMENT') || action.includes('APPROVE') || action.includes('PUBLISH')) {
      return <Badge variant="success">{text}</Badge>;
    }
    return <Badge variant="evergreen">{text}</Badge>;
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = (logsData?.results || []).filter((log) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.entity_type?.toLowerCase().includes(term) ||
      log.actor_name?.toLowerCase().includes(term) ||
      log.actor_email?.toLowerCase().includes(term) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(term)
    );
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Event / Action',
      accessorKey: 'action',
      cell: (row) => (
        <div>
          {getActionBadge(row.action, row.action_display)}
          {row.details?.message && (
            <p className="text-[11px] text-[#52606d] mt-1 line-clamp-1">{row.details.message}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Target Entity',
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-[#141d24]">{row.entity_type}</p>
          <p className="text-[10px] font-mono text-[#8896a4]">ID: {row.entity_id}</p>
        </div>
      ),
    },
    {
      header: 'Authorizing Actor',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#064e3b]/10 text-[#064e3b] flex items-center justify-center text-xs font-bold">
            {row.actor_name?.[0] || 'S'}
          </div>
          <div>
            <p className="font-semibold text-[#141d24] text-xs">{row.actor_name || 'System / Automated'}</p>
            <p className="text-[10px] font-mono text-[#8896a4]">{row.actor_email || 'system@core'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Network IP',
      cell: (row) => (
        <span className="text-xs text-[#52606d] font-mono flex items-center gap-1">
          <Globe className="w-3 h-3 text-[#8896a4]" />
          {row.ip_address || '127.0.0.1'}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'created_at',
      cell: (row) => (
        <span className="text-xs text-[#52606d] font-mono flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#8896a4]" />
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            size="xs"
            icon={Eye}
            onClick={() => setSelectedLog(row)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-[#141d24]">Institutional Audit Trail</h1>
            <Badge variant="evergreen">{filteredLogs.length} Events</Badge>
          </div>
          <p className="text-xs text-[#52606d] mt-0.5">
            Immutable security ledger tracking administrative actions, score moderations, and financial activities
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        searchPlaceholder="Filter events by entity, actor, or details..."
        searchValue={search}
        onSearchChange={setSearch}
        filterComponent={
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-[#d8d5cb] rounded-lg text-[#141d24]"
          >
            <option value="">All Event Types</option>
            <option value="CREATE">Create Record</option>
            <option value="UPDATE">Update Record</option>
            <option value="DELETE">Delete Record</option>
            <option value="SUBMIT">Score Submission</option>
            <option value="APPROVE">Approve Scores</option>
            <option value="REJECT">Reject Scores</option>
            <option value="PUBLISH">Publish Results</option>
            <option value="PAYMENT">Payment Recorded</option>
          </select>
        }
      />

      {/* Log Detail Inspector Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
        subtitle={`Event ID: ${selectedLog?.id}`}
        maxWidth="2xl"
      >
        {selectedLog && (
          <div className="space-y-5">
            {/* Overview Banner */}
            <div className="p-4 bg-[#fbfbfa] border border-[#e8e6df] rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getActionBadge(selectedLog.action, selectedLog.action_display)}
                  <span className="text-xs font-bold text-[#141d24]">{selectedLog.entity_type}</span>
                </div>
                <p className="text-xs text-[#52606d] font-mono">Entity ID: {selectedLog.entity_id}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#52606d] font-mono flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5 text-[#8896a4]" />
                  {new Date(selectedLog.created_at).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#8896a4] font-mono mt-0.5 block">
                  IP: {selectedLog.ip_address || '127.0.0.1'}
                </span>
              </div>
            </div>

            {/* Authorizing Actor */}
            <div className="p-3.5 bg-white border border-[#e8e6df] rounded-xl">
              <h4 className="text-[11px] font-bold text-[#8896a4] uppercase tracking-wider mb-2">
                Authorizing Actor
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#064e3b] text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  {selectedLog.actor_name?.[0] || 'S'}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#141d24]">
                    {selectedLog.actor_name || 'System Engine / Automated Process'}
                  </p>
                  <p className="text-[11px] font-mono text-[#52606d]">
                    {selectedLog.actor_email || 'system@core'}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-[#8896a4] uppercase tracking-wider">
                  Event Data Payload (JSON)
                </h4>
                <Button
                  variant="ghost"
                  size="xs"
                  icon={copied ? Check : Copy}
                  onClick={handleCopyJson}
                >
                  {copied ? 'Copied' : 'Copy JSON'}
                </Button>
              </div>

              <div className="p-3.5 bg-[#141d24] text-[#ecfdf5] rounded-xl font-mono text-xs overflow-x-auto max-h-60 border border-[#222e38]">
                <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e8e6df] flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

