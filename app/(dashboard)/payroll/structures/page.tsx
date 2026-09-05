"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StructuresPage() {
  const [structures, setStructures] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/payroll/structures")
      .then((res) => res.json())
      .then((data) => setStructures(data));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Salary Structures</h1>
        <Link href="/payroll/structures/new">
          <Button>Create Structure</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Structures</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Linked Rules</TableHead>
                <TableHead>Active Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s._count?.rules || 0}</TableCell>
                  <TableCell>{s._count?.contracts || 0}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/payroll/structures/${s.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {structures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No structures found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
