"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [structureId, setStructureId] = useState<string>("all");

  useEffect(() => {
    fetch("/api/payroll/structures")
      .then((res) => res.json())
      .then((data) => setStructures(data));
  }, []);

  useEffect(() => {
    const query = structureId !== "all" ? `?structureId=${structureId}` : "";
    fetch(`/api/payroll/rules${query}`)
      .then((res) => res.json())
      .then((data) => setRules(data));
  }, [structureId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Salary Rules</h1>
        <Link href="/payroll/rules/new">
          <Button>Create Rule</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Rules</CardTitle>
          <div className="w-64">
            <Select value={structureId} onValueChange={setStructureId}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Structures</SelectItem>
                {structures.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Structure</TableHead>
                <TableHead>Sequence</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.structure?.name}</TableCell>
                  <TableCell>{r.sequence}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell><span className="font-mono text-sm">{r.code}</span></TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.method}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/payroll/rules/${r.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No rules found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
