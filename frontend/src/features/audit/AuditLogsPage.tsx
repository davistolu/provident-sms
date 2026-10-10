import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, User, Activity, Clock, ShieldAlert } from 'lucide-react';
import { api } from '@/services/api';
import { AuditLog, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get<PaginatedResponse<AuditLog>>('/audit/logs/'),
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Operation / Event',
      accessorKey: 'action',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              row.action.includes('DELETE') || row.action.includes('REJECT')
                ? 'danger'
                : row.action.includes('UPDATE') || row.action.includes('EDIT')
                ? 'gold'
                : 'evergreen'
            }
          >
            {row.action}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Target Entity',
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-[#141d24]">{row.entity_type}</p>
          <p className="text-[11px] font-mono text-[#52606d]">ID: {row.entity_id}</p>
        </div>
      ),
    },
    {
      header: 'Authorizing Actor',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#f4f3ef] border border-[#e5e3dc] text-[#064e3b] flex items-center justify-center text-xs font-semibold">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-semibold text-[#141d24] text-xs">{row.actor_name || 'System Engine'}</p>
            <p className="text-[11px] font-mono text-[#52606d]">{row.actor_email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'created_at',
      cell: (row) => (
        <span className="text-xs text-[#52606d] font-mono flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#8c9ba5]" />
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e3dc]">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#141d24]">
            Institutional Security & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-[#52606d] mt-1 font-sans">
            Immutable system audit ledger recording administrative events, score moderations, and financial activities
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logsData?.results || []}
        isLoading={isLoading}
      />
    </div>
  );
};

