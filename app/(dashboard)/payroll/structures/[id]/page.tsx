"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function StructureFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";
  
  const [name, setName] = useState("");
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/payroll/structures/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setName(data.name);
            setRules(data.rules || []);
          }
        });
    }
  }, [id, isNew]);

  const moveRule = (index: number, direction: 'up' | 'down') => {
    const newRules = [...rules];
    if (direction === 'up' && index > 0) {
      [newRules[index - 1], newRules[index]] = [newRules[index], newRules[index - 1]];
    } else if (direction === 'down' && index < newRules.length - 1) {
      [newRules[index + 1], newRules[index]] = [newRules[index], newRules[index + 1]];
    }
    
    const updated = newRules.map((r, i) => ({ ...r, sequence: i + 1 }));
    setRules(updated);
  };

  const onSave = async () => {
    setLoading(true);
    const url = isNew ? "/api/payroll/structures" : `/api/payroll/structures/${id}`;
    const method = isNew ? "POST" : "PUT";
    
    const body = isNew ? { name } : { name, rules: rules.map(r => ({ id: r.id, sequence: r.sequence })) };
    
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
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Create Salary Structure" : "Edit Salary Structure"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Structure Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard 2024" />
          </div>

          {!isNew && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Rules Execution Order</h3>
              </div>
              
              <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                {rules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rules linked to this structure yet. Create rules first.</p>
                ) : (
                  rules.map((rule, idx) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-background border rounded shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-muted-foreground w-6 text-right">{rule.sequence}.</span>
                        <span className="font-medium">{rule.name}</span>
                        <span className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground">{rule.code}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => moveRule(idx, 'up')}>
                          ↑
                        </Button>
                        <Button variant="outline" size="sm" disabled={idx === rules.length - 1} onClick={() => moveRule(idx, 'down')}>
                          ↓
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/payroll/structures")}>Cancel</Button>
          <Button onClick={onSave} disabled={loading || !name}>{loading ? "Saving..." : "Save Structure"}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
