"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ruleSchema = z.object({
  structureId: z.string().min(1, "Structure is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").regex(/^[A-Z_]+$/, "Code must be uppercase and underscores only"),
  category: z.enum(["BASIC", "ALLOWANCE", "GROSS", "DEDUCTION", "NET"]),
  sequence: z.coerce.number().min(1, "Sequence must be at least 1"),
  method: z.enum(["FIXED", "PERCENTAGE", "FORMULA"]),
  value: z.coerce.number().optional().nullable(),
  formula: z.string().optional().nullable(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

export default function RuleFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";
  
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      structureId: "",
      name: "",
      code: "",
      category: "ALLOWANCE",
      sequence: 1,
      method: "FIXED",
      value: 0,
      formula: "",
    },
  });

  const methodValue = form.watch("method");

  useEffect(() => {
    fetch("/api/payroll/structures")
      .then((res) => res.json())
      .then((data) => setStructures(data));

    if (!isNew) {
      fetch(`/api/payroll/rules/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            form.reset({
              structureId: data.structureId.toString(),
              name: data.name,
              code: data.code,
              category: data.category,
              sequence: data.sequence,
              method: data.method,
              value: data.value,
              formula: data.formula || "",
            });
          }
        });
    }
  }, [id, isNew, form]);

  const onSubmit = async (data: RuleFormValues) => {
    setLoading(true);
    setServerError("");
    
    const payload = {
      structureId: data.structureId,
      name: data.name,
      code: data.code,
      category: data.category,
      sequence: data.sequence,
      method: data.method,
      value: (data.method === "FIXED" || data.method === "PERCENTAGE") ? data.value : null,
      formula: data.method === "FORMULA" ? data.formula : null,
    };

    const url = isNew ? "/api/payroll/rules" : `/api/payroll/rules/${id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    
    if (res.ok) {
      router.push("/payroll/rules");
      router.refresh();
    } else {
      const err = await res.json();
      setServerError(err.error || "Failed to save rule");
    }
  };

  return (
    <>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Create Salary Rule" : "Edit Salary Rule"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField control={form.control} name="structureId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary Structure</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a structure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {structures.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Basic Salary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BASIC" {...field} />
                    </FormControl>
                    <FormDescription>Unique short code (e.g. HRA, PF)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="ALLOWANCE">Allowance</SelectItem>
                        <SelectItem value="GROSS">Gross</SelectItem>
                        <SelectItem value="DEDUCTION">Deduction</SelectItem>
                        <SelectItem value="NET">Net</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sequence" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Execution Sequence</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Order of execution (e.g. 1)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="method" render={({ field }) => (
                <FormItem>
                  <FormLabel>Computation Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage of Wage</SelectItem>
                      <SelectItem value="FORMULA">Python Code</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {methodValue === "FIXED" && (
                <FormField control={form.control} name="value" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {methodValue === "PERCENTAGE" && (
                <FormField control={form.control} name="value" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {methodValue === "FORMULA" && (
                <FormField control={form.control} name="formula" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Python Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. result = categories['BASIC'] * 0.1" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>Use predefined variables like categories, contract, worked_days.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {serverError && <p className="text-red-500 text-sm font-medium">{serverError}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/payroll/rules")}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Rule"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Computation options from the source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Fixed Amount</h4>
              <p className="text-xs text-muted-foreground">A flat amount added or deducted from the payrun. Example: a fixed allowance of $500.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Percentage of Wage</h4>
              <p className="text-xs text-muted-foreground">Calculated as a percentage of the contract's base wage.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Python Code</h4>
              <p className="text-xs text-muted-foreground">Advanced formula evaluation.</p>
              <code className="block bg-muted/50 p-2 rounded text-xs text-muted-foreground mt-2 border border-border">
                Example expression:<br/>
                result = categories['BASIC'] * 0.1
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
