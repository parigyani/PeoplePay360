"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function StructureFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";
  
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/payroll/structures/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setName(data.name);
            setActive(data.active ?? true);
            setRules(data.rules || []);
          }
        });
    }
  }, [id, isNew]);

  const onSave = async () => {
    setLoading(true);
    const url = isNew ? "/api/payroll/structures" : `/api/payroll/structures/${id}`;
    const method = isNew ? "POST" : "PUT";
    
    const body = isNew ? { name, active } : { name, active, rules: rules.map(r => ({ id: r.id, sequence: r.sequence })) };
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    setLoading(false);
    if (res.ok) {
      router.push("/payroll/structures");
      router.refresh();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isNew ? "Create Salary Structure" : `Salary Structure / ${name || 'Loading...'}`}
          </CardTitle>
          {!isNew && (
            <p className="text-sm text-muted-foreground mt-1">
              Form view with its salary rules
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="name">Structure Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard 2024" />
            </div>

            <div className="flex items-center gap-3 border rounded-md px-4 h-10 w-full md:w-auto shrink-0 bg-muted/20">
              <Switch id="active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="active" className="cursor-pointer">Active</Label>
            </div>
          </div>

          {!isNew && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Salary Rules</h3>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground italic">
                          No rules linked to this structure yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-mono font-medium text-muted-foreground">
                            {rule.sequence}
                          </TableCell>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs font-normal">
                              {rule.code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-muted-foreground">
                              {rule.category || "General"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                <p><strong>Note:</strong> Rule order matters (computed in sequence).</p>
                <p>Rules created here are just for reference display in this form. Sequence editing happens on the Rule's own record.</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6 bg-muted/10">
          <Button variant="outline" onClick={() => router.push("/payroll/structures")}>Cancel</Button>
          <Button onClick={onSave} disabled={loading || !name}>{loading ? "Saving..." : "Save Structure"}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
