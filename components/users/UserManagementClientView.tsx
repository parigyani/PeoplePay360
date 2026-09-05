"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShieldAlert, Plus, Check } from "lucide-react";
import { Role } from "@prisma/client";
import Link from "next/link";

const ROLE_LABELS: Record<Role, string> = {
  [Role.EMPLOYEE]: "Employee",
  [Role.HR_MANAGER]: "HR Manager",
  [Role.HR_PAYROLL_USER]: "HR Payroll User",
  [Role.HR_PAYROLL_MANAGER]: "HR Payroll Admin",
  [Role.ADMIN]: "Admin",
};

export interface SerializedUser {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
  employeeId: number | null;
  employee: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

const userSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(Role),
  isActive: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserManagementClientViewProps {
  users: SerializedUser[];
  employees: { id: number; name: string }[];
  currentUserId: string;
}

export function UserManagementClientView({
  users,
  employees,
  currentUserId,
}: UserManagementClientViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<SerializedUser | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      employeeId: "",
      email: "",
      role: Role.EMPLOYEE,
      isActive: true,
    },
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employee?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateNew = () => {
    setSelectedUser(null);
    setTempPassword(null);
    setFormError(null);
    form.reset({
      employeeId: "",
      email: "",
      role: Role.EMPLOYEE,
      isActive: true,
    });
  };

  const handleSelectUser = (user: SerializedUser) => {
    setSelectedUser(user);
    setTempPassword(null);
    setFormError(null);
    form.reset({
      employeeId: user.employeeId?.toString() || "",
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleEmployeeChange = (employeeIdStr: string) => {
    form.setValue("employeeId", employeeIdStr);
    
    // Auto-fill email if it's a new user and email is empty
    if (!selectedUser && !form.getValues("email")) {
      const emp = employees.find(e => e.id.toString() === employeeIdStr);
      if (emp) {
        const generatedEmail = emp.name.toLowerCase().replace(/\s+/g, ".") + "@company.com";
        form.setValue("email", generatedEmail);
      }
    }
  };

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    setFormError(null);
    setTempPassword(null);
    
    try {
      const payload = {
        ...data,
        employeeId: parseInt(data.employeeId, 10),
      };

      const url = selectedUser ? `/api/users/${selectedUser.id}` : "/api/users";
      const method = selectedUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to save user");
      }

      if (!selectedUser && resData.tempPassword) {
        setTempPassword(resData.tempPassword);
        // Automatically select the newly created user
        setSelectedUser(resData.user);
      }

      router.refresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditingSelf = selectedUser?.id.toString() === currentUserId;

  return (
    <div className="flex gap-8 h-[calc(100vh-8rem)]">
      {/* Left Panel: Table */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/20">
            ADMIN ONLY
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-1.5 h-4 w-4" />
            New User
          </Button>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, employees or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/[0.08]"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px] bg-white/[0.03] border-white/[0.08]">
              <SelectValue placeholder="Role Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-[hsl(224,71%,4%)] z-10 shadow-sm border-b border-white/[0.06]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-muted-foreground/70">User</TableHead>
                  <TableHead className="text-muted-foreground/70">Employee</TableHead>
                  <TableHead className="text-muted-foreground/70">Work Email</TableHead>
                  <TableHead className="text-muted-foreground/70">Role</TableHead>
                  <TableHead className="text-muted-foreground/70">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow
                      key={u.id}
                      className={`cursor-pointer transition-colors ${
                        selectedUser?.id === u.id
                          ? "bg-primary/10 border-l-2 border-l-primary"
                          : "border-white/[0.04] hover:bg-white/[0.03] border-l-2 border-l-transparent"
                      }`}
                      onClick={() => handleSelectUser(u)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {u.employee?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {u.employee ? (
                          <Link
                            href={`/employees/${u.employeeId}`}
                            className="text-primary hover:underline text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {u.employee.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white/[0.03] border-white/[0.1] font-normal">
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`status-dot ${u.isActive ? "status-dot-active" : "status-dot-inactive"}`} />
                          <span className={`text-sm font-medium ${u.isActive ? "text-status-active" : "text-status-inactive"}`}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="text-xs text-muted-foreground/60 flex flex-col gap-1">
          <p>💡 Select a user to edit access, or create a new user.</p>
          <p>ℹ️ User accounts are separate from Employee records, but should be linked to an employee for access and ownership.</p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-[400px] shrink-0 border border-white/[0.08] bg-white/[0.02] rounded-2xl p-6 flex flex-col shadow-xl">
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-wide text-primary mb-1 uppercase">
            {selectedUser ? "Context: Edit User" : "Open on New User"}
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {selectedUser ? "Edit User Access" : "Create User"}
          </h2>
        </div>

        {formError && (
          <div className="mb-6 p-3 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium flex gap-2 items-start">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{formError}</p>
          </div>
        )}

        {tempPassword && (
          <div className="mb-6 p-4 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Check className="h-4 w-4" /> User Created Successfully
            </div>
            <p className="mb-2">Please securely share this temporary password with the user. It will only be shown once.</p>
            <div className="p-2 bg-emerald-950 rounded border border-emerald-500/30 font-mono text-center tracking-widest text-emerald-400 select-all">
              {tempPassword}
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 flex-1">
          <div className="space-y-1.5">
            <Label>Employee *</Label>
            <Select
              value={form.watch("employeeId")}
              onValueChange={handleEmployeeChange}
            >
              <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.employeeId && (
              <p className="text-xs text-destructive">{form.formState.errors.employeeId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Work Email *</Label>
            <Input
              type="email"
              {...form.register("email")}
              placeholder="name@company.com"
              className="bg-white/[0.03] border-white/[0.1]"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <Label>Roles *</Label>
            <div className="space-y-2 p-3 border border-white/[0.06] rounded-lg bg-white/[0.01]">
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <label
                  key={val}
                  className={`flex items-center gap-2 text-sm p-1.5 rounded transition-colors ${
                    isEditingSelf ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/[0.03]"
                  }`}
                >
                  <input
                    type="radio"
                    className="accent-primary w-4 h-4"
                    value={val}
                    checked={form.watch("role") === val}
                    onChange={() => form.setValue("role", val as Role)}
                    disabled={isEditingSelf}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {isEditingSelf && (
              <p className="text-xs text-amber-500/80">
                You cannot change your own role.
              </p>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            <Label>Account Status</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => form.setValue("isActive", true)}
                className={`flex-1 py-1.5 rounded text-sm font-medium border transition-colors ${
                  form.watch("isActive")
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:bg-white/[0.05]"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => form.setValue("isActive", false)}
                className={`flex-1 py-1.5 rounded text-sm font-medium border transition-colors ${
                  !form.watch("isActive")
                    ? "bg-zinc-500/20 border-zinc-500/40 text-zinc-300"
                    : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:bg-white/[0.05]"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          <div className="pt-6 mt-auto">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : selectedUser
                ? "Save Access"
                : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
