import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, User } from 'lucide-react';
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
      header: 'Action',
      accessorKey: 'action',
      cell: (row) => <Badge variant="indigo">{row.action}</Badge>,
    },
    {
      header: 'Entity / Target',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.entity_type}</p>
          <p className="text-[11px] font-mono text-slate-400">ID: {row.entity_id}</p>
        </div>
      ),
    },
    {
      header: 'Performed By',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-xs">{row.actor_name || 'System'}</p>
            <p className="text-[10px] text-slate-400">{row.actor_email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'created_at',
      cell: (row) => (
        <span className="text-xs text-slate-600 font-mono">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Security & Compliance Audit Trail</h1>
          <p className="text-xs text-slate-500">Immutable ledger of administrative actions, grade changes, and financial records</p>
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
