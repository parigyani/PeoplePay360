"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Structure = { id: number; name: string };
type Employee = { id: number; name: string; department: string; status: string };

export function PayrunWizard({ structures, employees }: { structures: Structure[]; employees: Employee[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 state
  const [name, setName] = useState("");
  const [structureId, setStructureId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Step 2 state
  const [search, setSearch] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !structureId || !periodStart || !periodEnd) {
      setError("Please fill all fields.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleCreate = async () => {
    if (selectedEmployees.size === 0) {
      setError("Please select at least one employee.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payroll/payruns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          structureId: parseInt(structureId, 10),
          periodStart,
          periodEnd,
          employeeIds: Array.from(selectedEmployees),
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      router.push("/payroll/payruns");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const toggleEmployee = (id: number) => {
    const newSet = new Set(selectedEmployees);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEmployees(newSet);
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    (e.department && e.department.toLowerCase().includes(search.toLowerCase())) ||
    (e.status && e.status.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Card className="max-w-4xl mx-auto mt-6">
      <CardContent className="p-6">
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">{error}</div>}
        
        {step === 1 && (
          <form onSubmit={handleNext}>
            <h2 className="text-xl font-bold mb-4">Step 1: Payrun Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. October 2026 Salary" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Salary Structure</label>
                <Select value={structureId} onValueChange={setStructureId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {structures.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Period Start</label>
                  <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Period End</label>
                  <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit">Continue</Button>
            </div>
          </form>
        )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Step 2: Select Employees</h2>
          <div>
            <Input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name, dept, status..." 
            />
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-muted z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <input 
                      type="checkbox" 
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
                        } else {
                          setSelectedEmployees(new Set());
                        }
                      }}
                      checked={filteredEmployees.length > 0 && selectedEmployees.size === filteredEmployees.length}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map(emp => (
                  <TableRow key={emp.id} className="cursor-pointer" onClick={() => toggleEmployee(emp.id)}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedEmployees.has(emp.id)} 
                        onChange={() => toggleEmployee(emp.id)} 
                      />
                    </TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.status}</TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleCreate} disabled={loading || selectedEmployees.size === 0}>
              {loading ? "Creating..." : `Create Payrun (${selectedEmployees.size})`}
            </Button>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
