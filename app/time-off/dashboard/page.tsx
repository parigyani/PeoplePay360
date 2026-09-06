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
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-medium text-foreground">No Employee Record Attached</h2>
          <p className="text-muted-foreground">Your user account isn't linked to an employee profile, so you have no personal balances.</p>
          <Link href="/time-off/requests">
            <Button variant="outline" className="mt-4 border-border">Go to Global Requests List</Button>
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Time Off Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, {employee?.name?.split(" ")[0] || "there"}. Here's your overview.</p>
        </div>
        <Link href="/time-off/requests/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plane className="w-4 h-4 mr-2" /> Request Time Off
          </Button>
        </Link>
      </div>

      {/* Balances Section */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">My Balances</h2>
        {activeAllocations.length === 0 ? (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="flex items-center text-muted-foreground py-6">
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
                <Card key={alloc.id} className="bg-card border-border hover:border-primary/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-primary transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                    {getTypeIcon(alloc.type.name)}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-foreground">{alloc.type.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{alloc.description || "Active Allocation"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 mb-3">
                      <span className={`text-4xl font-bold ${isLow ? 'text-amber-500' : 'text-foreground'}`}>
                        {alloc.remaining}
                      </span>
                      <span className="text-muted-foreground font-medium pb-1 mb-0.5">{alloc.type.unit.toLowerCase()} left</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Taken: {alloc.taken}</span>
                        <span>Total: {alloc.allocated}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                        <div 
                          className={`h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-primary'}`} 
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
            {/* Team Inbox */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-indigo-500" />
                    Manager Inbox
                  </CardTitle>
                  {teamPending.length > 0 && (
                    <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20">
                      {teamPending.length} Pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {teamPending.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-muted-foreground opacity-50" />
                    <p>You're all caught up! No pending requests from your team.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {teamPending.map(req => (
                      <div key={req.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-semibold text-sm">
                            {getInitials(req.employee.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{req.employee.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.type.color || '#64748b' }} />
                              {req.type.name} • {req.duration} {req.type.unit.toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-muted-foreground">{format(new Date(req.startDate), "MMM d")} - {format(new Date(req.endDate), "MMM d")}</p>
                          </div>
                          <Link href={`/time-off/requests/${req.id}`}>
                            <Button size="sm" variant="secondary" className="bg-background border-border text-foreground hover:bg-muted">Review</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {teamPending.length > 0 && (
                  <div className="p-3 border-t border-border bg-muted/50">
                    <Link href="/time-off/requests" className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center justify-center">
                      View all requests <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Who's Out */}
            {/* Who's Out */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="border-b border-border bg-muted/50">
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Team Calendar (Next 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {teamOut.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>No one on your team is scheduled to be out.</p>
                  </div>
                ) : (
                  <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {teamOut.map(req => (
                      <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center text-xs font-bold border border-teal-500/20">
                          {getInitials(req.employee.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{req.employee.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(req.startDate), "MMM d")} - {format(new Date(req.endDate), "MMM d")}</p>
                          <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider py-0 px-1.5 h-4 bg-background border-border text-muted-foreground">
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
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/50">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                My Upcoming Leave
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {myUpcoming.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>You have no upcoming time off approved.</p>
                  <Link href="/time-off/requests/new" className="text-sm text-primary hover:underline mt-2 inline-block">
                    Plan some time away?
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {myUpcoming.map(req => (
                    <div key={req.id} className="p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex flex-col items-center justify-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold leading-none mb-1">{format(new Date(req.startDate), "MMM")}</span>
                          <span className="text-sm text-foreground font-bold leading-none">{format(new Date(req.startDate), "d")}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{req.type.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{req.duration} {req.type.unit.toLowerCase()}</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-none">
                        Approved
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card className="bg-primary/5 border-primary/10 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/time-off/requests" className="block text-sm text-primary hover:text-primary/90 p-2 rounded hover:bg-primary/10 transition-colors">
                  View full request history
                </Link>
                <Link href="/time-off/allocations" className="block text-sm text-primary hover:text-primary/90 p-2 rounded hover:bg-primary/10 transition-colors">
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
