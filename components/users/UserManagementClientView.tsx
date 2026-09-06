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
  [Role.HR_PAYROLL_MANAGER]: "Payroll Manager",
  [Role.ADMIN]: "Admin",
};

export interface SerializedUser {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
  employeeId: number | null;
  employee: { id: number; name: string; jobPosition?: string } | null;
  createdAt: string;
  updatedAt: string;
}

const userSchema = z.object({
  isNewEmployee: z.boolean(),
  employeeId: z.string().optional(),
  newEmployeeName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(Role),
  isActive: z.boolean(),
}).refine(
  (data) => {
    if (data.isNewEmployee) return !!data.newEmployeeName && data.newEmployeeName.trim().length > 0;
    return !!data.employeeId && data.employeeId.length > 0;
  },
  {
    message: "Employee selection or name is required",
    path: ["employeeId"],
  }
);

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
      isNewEmployee: false,
      employeeId: "",
      newEmployeeName: "",
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

  const generateUserId = (u: SerializedUser) => {
    if (u.employee && u.employee.jobPosition) {
      const initials = u.employee.jobPosition.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').toUpperCase();
      return `${initials}${u.employee.id}`;
    }
    const roleMap: Record<Role, string> = {
      [Role.ADMIN]: "AD",
      [Role.EMPLOYEE]: "EM",
      [Role.HR_MANAGER]: "HRM",
      [Role.HR_PAYROLL_MANAGER]: "HRPA",
    };
    return `${roleMap[u.role] || "U"}${u.id}`;
  };

  const handleCreateNew = () => {
    setSelectedUser(null);
    setTempPassword(null);
    setFormError(null);
    form.reset({
      isNewEmployee: true,
      employeeId: "",
      newEmployeeName: "",
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
      isNewEmployee: false,
      employeeId: user.employeeId?.toString() || "",
      newEmployeeName: "",
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
        employeeId: data.employeeId ? parseInt(data.employeeId, 10) : undefined,
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

  const isEditingSelf = !!selectedUser && selectedUser.id.toString() === currentUserId;

  return (
    <div className="flex gap-8 min-h-[calc(100vh-8rem)] container mx-auto max-w-7xl pt-6">
      {/* Left Panel: Table */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 shadow-none">
            ADMIN ONLY
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreateNew} className="font-medium shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New User
          </Button>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, employees or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px] bg-background border-border text-foreground focus:ring-primary focus:border-primary">
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

        <div className="flex-1 premium-card flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 z-10 shadow-sm border-b border-border">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">User ID</TableHead>
                  <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Employee</TableHead>
                  <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Work Email</TableHead>
                  <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Role</TableHead>
                  <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
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
                      className={`cursor-pointer transition-colors border-none ${selectedUser?.id === u.id
                          ? "bg-primary/10 border-l-2 border-l-primary"
                          : "hover:bg-muted border-l-2 border-l-transparent"
                        }`}
                      onClick={() => handleSelectUser(u)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {generateUserId(u)}
                      </TableCell>
                      <TableCell>
                        {u.employee ? (
                          <Link
                            href={`/employees/${u.employeeId}`}
                            className="text-primary hover:text-primary/80 font-medium text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {u.employee.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-secondary border-border text-secondary-foreground font-normal">
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`status-dot ${u.isActive ? "status-dot-active" : "status-dot-inactive"}`} />
                          <span className={`text-sm font-medium ${u.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
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

        <div className="text-xs text-muted-foreground flex flex-col gap-1.5 pt-2">
          <p className="flex items-center gap-1.5"><span className="text-lg">💡</span> Select a user to edit access, or create a new user.</p>
          <p className="flex items-center gap-1.5"><span className="text-lg">ℹ️</span> User accounts are separate from Employee records, but should be linked to an employee for access and ownership.</p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-[420px] shrink-0 premium-card p-8 flex flex-col h-fit sticky top-24">
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-wide text-primary mb-1 uppercase">
            {selectedUser ? "Context: Edit User" : "Open on New User"}
          </div>
          <h2 className="text-xl text-foreground font-bold tracking-tight">
            {selectedUser ? "Edit User Access" : "Create User"}
          </h2>
        </div>

        {formError && (
          <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex gap-2 items-start">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{formError}</p>
          </div>
        )}

        {tempPassword && (
          <div className="mb-6 p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Check className="h-4 w-4" /> User Created Successfully
            </div>
            <p className="mb-2 text-emerald-600/90">Please securely share this temporary password with the user. It will only be shown once.</p>
            <div className="p-2 bg-background rounded border border-emerald-500/20 font-mono text-center tracking-widest select-all font-medium shadow-sm">
              {tempPassword}
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 flex-1">
          {!selectedUser && (
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                <input
                  type="radio"
                  checked={form.watch("isNewEmployee") === true}
                  onChange={() => {
                    form.setValue("isNewEmployee", true);
                    form.setValue("employeeId", "");
                  }}
                  className="accent-primary"
                />
                Create New Employee
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                <input
                  type="radio"
                  checked={form.watch("isNewEmployee") === false}
                  onChange={() => {
                    form.setValue("isNewEmployee", false);
                    form.setValue("newEmployeeName", "");
                  }}
                  className="accent-primary"
                />
                Link Existing
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-foreground">{form.watch("isNewEmployee") ? "New Employee Name *" : "Employee *"}</Label>
            {form.watch("isNewEmployee") ? (
              <Input
                placeholder="John Doe"
                {...form.register("newEmployeeName")}
                onChange={(e) => {
                  form.register("newEmployeeName").onChange(e);
                  if (!selectedUser && !form.getValues("email") && e.target.value) {
                    const generatedEmail = e.target.value.toLowerCase().replace(/\s+/g, ".") + "@company.com";
                    form.setValue("email", generatedEmail);
                  }
                }}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary"
              />
            ) : (
              <Select
                value={form.watch("employeeId")}
                onValueChange={handleEmployeeChange}
              >
                <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary focus:border-primary">
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
            )}
            {form.formState.errors.employeeId && (
              <p className="text-xs text-destructive">{form.formState.errors.employeeId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground">Work Email *</Label>
            <Input
              type="email"
              {...form.register("email")}
              placeholder="name@company.com"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <Label className="text-foreground">Roles *</Label>
            <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/50">
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <label
                  key={val}
                  className={`flex items-center gap-2 text-sm text-foreground p-1.5 rounded transition-colors ${isEditingSelf ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted"
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
              <p className="text-xs text-amber-600">
                You cannot change your own role.
              </p>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-foreground">Account Status</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => form.setValue("isActive", true)}
                className={`flex-1 py-1.5 rounded text-sm font-medium border transition-colors ${form.watch("isActive")
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => form.setValue("isActive", false)}
                className={`flex-1 py-1.5 rounded text-sm font-medium border transition-colors ${!form.watch("isActive")
                    ? "bg-muted border-border text-foreground"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  }`}
              >
                Inactive
              </button>
            </div>
          </div>

          <div className="pt-6 mt-auto">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
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
