"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="bg-white p-6 shadow rounded-lg border border-gray-200 max-w-4xl mx-auto">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      
      {step === 1 && (
        <form onSubmit={handleNext}>
          <h2 className="text-xl font-bold mb-4">Step 1: Payrun Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" placeholder="e.g. October 2026 Salary" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Salary Structure</label>
              <select value={structureId} onChange={e => setStructureId(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2">
                <option value="">Select a structure</option>
                {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Period Start</label>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Period End</label>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm border p-2" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Continue</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Step 2: Select Employees</h2>
          <div className="mb-4">
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name, dept, status..." 
              className="block w-full border-gray-300 rounded-md shadow-sm border p-2"
            />
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">
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
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleEmployee(emp.id)}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedEmployees.has(emp.id)} 
                        onChange={() => toggleEmployee(emp.id)} 
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{emp.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{emp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300">Back</button>
            <button onClick={handleCreate} disabled={loading || selectedEmployees.size === 0} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Creating..." : `Create Payrun (${selectedEmployees.size})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
