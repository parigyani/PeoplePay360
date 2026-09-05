'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  departments: string[];
}

export function PayrollDashboardFilters({ departments }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get('period') || 'all';
  const currentDepartment = searchParams.get('department') || 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Period:</span>
          <Select value={currentPeriod} onValueChange={(val) => updateFilter('period', val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              <SelectItem value="2026-09">September 2026</SelectItem>
              <SelectItem value="2026-08">August 2026</SelectItem>
              <SelectItem value="2026-07">July 2026</SelectItem>
              <SelectItem value="2026-06">June 2026</SelectItem>
              <SelectItem value="2026-05">May 2026</SelectItem>
              <SelectItem value="2026-04">April 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Department:</span>
          <Select value={currentDepartment} onValueChange={(val) => updateFilter('department', val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
