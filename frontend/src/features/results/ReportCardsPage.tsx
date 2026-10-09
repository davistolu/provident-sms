import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Award, Search, Filter } from 'lucide-react';
import { api } from '@/services/api';
import { StudentTermResult, ClassArm, PaginatedResponse } from '@/types';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const ReportCardsPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');

  const { data: classesData } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => api.get<PaginatedResponse<ClassArm>>('/academics/class-arms/'),
  });

  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['term-results', selectedClass],
    queryFn: () =>
      api.get<PaginatedResponse<StudentTermResult>>('/results/term-results/', {
        class_arm: selectedClass || undefined,
      }),
  });

  const columns: Column<StudentTermResult>[] = [
    {
      header: 'Position',
      cell: (row) => (
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
            {row.position_in_class || '-'}
          </span>
          <span className="text-slate-400 font-normal">of {row.total_students_in_class}</span>
        </div>
      ),
    },
    {
      header: 'Student Name',
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.student_name}</p>
          <p className="text-[11px] font-mono text-slate-400">{row.admission_number}</p>
        </div>
      ),
    },
    {
      header: 'Class / Arm',
      accessorKey: 'class_arm_name',
    },
    {
      header: 'Total Marks',
      cell: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.total_marks_obtained} / {row.total_marks_possible}
        </span>
      ),
    },
    {
      header: 'Average %',
      cell: (row) => (
        <span className="font-bold text-indigo-700 text-xs px-2 py-0.5 bg-indigo-50 rounded">
          {row.average_score}%
        </span>
      ),
    },
    {
      header: 'Attendance',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.attendance_present} / {row.attendance_total} days
        </span>
      ),
    },
    {
      header: 'Report Card',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end">
          <a
            href={`/api/v1/results/term-results/${row.id}/report-card-pdf/`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="sm" icon={Download}>
              PDF Report
            </Button>
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Progress Report Cards</h1>
          <p className="text-xs text-slate-500">
            Official computed term summaries and downloadable PDF report cards with school crest
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={resultsData?.results || []}
        isLoading={isLoading}
        filterComponent={
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Class Arms</option>
            {classesData?.results?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
};
