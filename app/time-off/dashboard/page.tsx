import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Clock, Inbox, Users, Plane, CheckCircle2, ChevronRight, AlertCircle, Sparkles, Palmtree, Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

// Helper to get initials
function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

// Helper to map leave types to specific icons for visual flair
function getTypeIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("sick") || n.includes("medical")) return <Briefcase className="w-5 h-5" />;
  if (n.includes("annual") || n.includes("vacation") || n.includes("holiday")) return <Palmtree className="w-5 h-5" />;
  return <Plane className="w-5 h-5" />;
}

export default async function TimeOffDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const employeeId = (session.user as any).employeeId;
  
  if (!employeeId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-xl font-medium text-slate-300">No Employee Record Attached</h2>
          <p className="text-slate-500">Your user account isn't linked to an employee profile, so you have no personal balances.</p>
          <Link href="/time-off/requests">
            <Button variant="outline" className="mt-4 border-white/10">Go to Global Requests List</Button>
          </Link>
        </div>
      </div>
    );
  }

  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { name: true } });
  
  // 1. Fetch Balances
  const myAllocations = await prisma.allocation.findMany({
    where: { employeeId, status: "Approved" },
    include: { type: true },
    orderBy: { validFrom: 'desc' }
  });

  // Deduplicate allocations by typeId (show the most recent active one)
  const activeAllocationsMap = new Map();
  myAllocations.forEach(alloc => {
    if (!activeAllocationsMap.has(alloc.typeId)) {
      activeAllocationsMap.set(alloc.typeId, alloc);
    }
  });
  const activeAllocations = Array.from(activeAllocationsMap.values());

  // 2. Fetch Upcoming Leave (Personal)
  const myUpcoming = await prisma.timeOffRequest.findMany({
    where: { employeeId, status: "Approved", startDate: { gte: new Date() } },
    include: { type: true },
    orderBy: { startDate: 'asc' },
    take: 4
  });

  // 3. Manager Checks
  const isManager = await prisma.employee.findFirst({ where: { managerId: employeeId } });
  
  let teamPending: any[] = [];
  let teamOut: any[] = [];
  
  if (isManager) {
    teamPending = await prisma.timeOffRequest.findMany({
      where: { employee: { managerId: employeeId }, status: "To Approve" },
      include: { employee: true, type: true },
      orderBy: { createdAt: 'asc' },
      take: 5
    });

    teamOut = await prisma.timeOffRequest.findMany({
      where: { 
        employee: { managerId: employeeId }, 
        status: "Approved", 
        startDate: { lte: addDays(new Date(), 14) },
        endDate: { gte: new Date() }
      },
      include: { employee: true, type: true },
      orderBy: { startDate: 'asc' },
      take: 5
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-400" />
            Time Off Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Welcome back, {employee?.name?.split(" ")[0] || "there"}. Here's your overview.</p>
        </div>
        <Link href="/time-off/requests/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">
            <Plane className="w-4 h-4 mr-2" /> Request Time Off
          </Button>
        </Link>
      </div>

      {/* Balances Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">My Balances</h2>
        {activeAllocations.length === 0 ? (
          <Card className="bg-[#11141D] border-white/[0.05]">
            <CardContent className="flex items-center text-slate-400 py-6">
              <Calendar className="w-5 h-5 mr-3 opacity-50" />
              You have no active time-off allocations.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAllocations.map(alloc => {
              const pct = alloc.allocated > 0 ? (alloc.taken / alloc.allocated) * 100 : 0;
              const isLow = alloc.remaining <= 2 && alloc.allocated > 0;
              
              return (
                <Card key={alloc.id} className="bg-gradient-to-b from-[#151923] to-[#0d1017] border-white/[0.06] overflow-hidden group hover:border-white/[0.12] transition-colors relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                    {getTypeIcon(alloc.type.name)}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-200">{alloc.type.name}</CardTitle>
                    <CardDescription className="text-slate-500">{alloc.description || "Active Allocation"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 mb-3">
                      <span className={`text-4xl font-bold ${isLow ? 'text-amber-400' : 'text-white'}`}>
                        {alloc.remaining}
                      </span>
                      <span className="text-slate-400 font-medium pb-1 mb-0.5">{alloc.type.unit.toLowerCase()} left</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Taken: {alloc.taken}</span>
                        <span>Total: {alloc.allocated}</span>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Manager specific if applicable, otherwise takes up space) */}
        {isManager && (
          <div className="lg:col-span-2 space-y-8">
            {/* Team Inbox */}
            <Card className="bg-[#11141D] border-white/[0.05] shadow-md">
              <CardHeader className="border-b border-white/[0.05] bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-indigo-400" />
                    Manager Inbox
                  </CardTitle>
                  {teamPending.length > 0 && (
                    <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20">
                      {teamPending.length} Pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {teamPending.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-slate-600 opacity-50" />
                    <p>You're all caught up! No pending requests from your team.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {teamPending.map(req => (
                      <div key={req.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-900 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-inner">
                            {getInitials(req.employee.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{req.employee.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.type.color || '#64748b' }} />
                              {req.type.name} • {req.duration} {req.type.unit.toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-slate-300">{format(new Date(req.startDate), "MMM d")} - {format(new Date(req.endDate), "MMM d")}</p>
                          </div>
                          <Link href={`/time-off/requests/${req.id}`}>
                            <Button size="sm" variant="secondary" className="bg-white/5 hover:bg-white/10 text-white">Review</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {teamPending.length > 0 && (
                  <div className="p-3 border-t border-white/[0.05] bg-white/[0.01]">
                    <Link href="/time-off/requests" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center">
                      View all requests <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Who's Out */}
            <Card className="bg-[#11141D] border-white/[0.05] shadow-md">
              <CardHeader className="border-b border-white/[0.05] bg-white/[0.01]">
                <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  Team Calendar (Next 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {teamOut.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <p>No one on your team is scheduled to be out.</p>
                  </div>
                ) : (
                  <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {teamOut.map(req => (
                      <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-black/20">
                        <div className="w-8 h-8 rounded-full bg-teal-900/50 text-teal-400 flex items-center justify-center text-xs font-bold border border-teal-500/20">
                          {getInitials(req.employee.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{req.employee.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{format(new Date(req.startDate), "MMM d")} - {format(new Date(req.endDate), "MMM d")}</p>
                          <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider py-0 px-1.5 h-4 bg-white/5 border-white/10 text-slate-400">
                            {req.type.name}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right Column (Always visible: Personal Upcoming) */}
        <div className={`space-y-8 ${!isManager ? 'lg:col-span-3 lg:w-1/2' : 'lg:col-span-1'}`}>
          <Card className="bg-[#11141D] border-white/[0.05] shadow-md">
            <CardHeader className="border-b border-white/[0.05] bg-white/[0.01]">
              <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                My Upcoming Leave
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {myUpcoming.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>You have no upcoming time off approved.</p>
                  <Link href="/time-off/requests/new" className="text-sm text-blue-400 hover:underline mt-2 inline-block">
                    Plan some time away?
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {myUpcoming.map(req => (
                    <div key={req.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold leading-none mb-1">{format(new Date(req.startDate), "MMM")}</span>
                          <span className="text-sm text-slate-200 font-bold leading-none">{format(new Date(req.startDate), "d")}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{req.type.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{req.duration} {req.type.unit.toLowerCase()}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-none">
                        Approved
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card className="bg-gradient-to-br from-blue-900/10 to-transparent border-blue-500/10 shadow-md">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/time-off/requests" className="block text-sm text-slate-300 hover:text-white p-2 rounded hover:bg-white/5 transition-colors">
                  View full request history
                </Link>
                <Link href="/time-off/allocations" className="block text-sm text-slate-300 hover:text-white p-2 rounded hover:bg-white/5 transition-colors">
                  View all balance allocations
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
