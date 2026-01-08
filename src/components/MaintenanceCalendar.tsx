import { Calendar, Droplets, Shield, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface MaintenanceTask {
  id: string;
  type: 'flush' | 'anode' | 'inspection';
  label: string;
  dueInMonths: number;
  lastPerformed?: string;
  technician?: string;
  status: 'upcoming' | 'due-soon' | 'overdue';
}

interface MaintenanceCalendarProps {
  monthsToFlush: number | null;
  monthsToAnode: number;
  lastFlushDate?: string;
  lastAnodeDate?: string;
  onScheduleEarly?: (type: string) => void;
}

function getTaskConfig(type: string) {
  switch (type) {
    case 'flush':
      return {
        icon: Droplets,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        label: 'Tank Flush'
      };
    case 'anode':
      return {
        icon: Shield,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        label: 'Anode Rod Check'
      };
    case 'inspection':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        label: 'Annual Inspection'
      };
    default:
      return {
        icon: Calendar,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
        borderColor: 'border-border',
        label: 'Maintenance'
      };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'overdue':
      return {
        text: 'Overdue',
        className: 'bg-red-500/20 text-red-400 border-red-500/30'
      };
    case 'due-soon':
      return {
        text: 'Due Soon',
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      };
    default:
      return {
        text: 'On Track',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      };
  }
}

function formatDueDate(months: number): string {
  if (months <= 0) return 'Now';
  if (months < 1) return 'This month';
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = months / 12;
  if (years === 1) return '1 year';
  return `${years.toFixed(1)} years`;
}

function getMonthLabel(monthsFromNow: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsFromNow);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function MaintenanceCalendar({
  monthsToFlush,
  monthsToAnode,
  lastFlushDate,
  lastAnodeDate,
  onScheduleEarly
}: MaintenanceCalendarProps) {
  // Build task list
  const tasks: MaintenanceTask[] = [];
  
  if (monthsToFlush !== null) {
    const status = monthsToFlush <= 0 ? 'overdue' : monthsToFlush <= 3 ? 'due-soon' : 'upcoming';
    tasks.push({
      id: 'flush',
      type: 'flush',
      label: 'Tank Flush',
      dueInMonths: monthsToFlush,
      lastPerformed: lastFlushDate,
      technician: 'Mike T.',
      status
    });
  }
  
  if (monthsToAnode > 0) {
    const status = monthsToAnode <= 0 ? 'overdue' : monthsToAnode <= 6 ? 'due-soon' : 'upcoming';
    tasks.push({
      id: 'anode',
      type: 'anode',
      label: 'Anode Rod Check',
      dueInMonths: monthsToAnode,
      lastPerformed: lastAnodeDate,
      technician: 'Mike T.',
      status
    });
  }
  
  // Sort by due date
  tasks.sort((a, b) => a.dueInMonths - b.dueInMonths);
  
  // Timeline calculations
  const maxMonths = Math.max(...tasks.map(t => t.dueInMonths), 24);
  const timelineMonths = Math.min(maxMonths + 6, 36);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Maintenance Timeline</h3>
          <p className="text-[10px] text-muted-foreground">Upcoming service schedule</p>
        </div>
      </div>
      
      {/* Visual Timeline */}
      <div className="relative clean-card p-4 overflow-hidden">
        {/* Timeline track */}
        <div className="relative">
          {/* Track line */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-muted/50 rounded-full" />
          
          {/* Today marker */}
          <div className="absolute top-2.5 left-4 flex flex-col items-center z-10">
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-lg" />
            <span className="text-[8px] text-primary font-medium mt-1">Today</span>
          </div>
          
          {/* Task markers */}
          {tasks.map((task, index) => {
            const config = getTaskConfig(task.type);
            const position = Math.min((task.dueInMonths / timelineMonths) * 100, 95);
            const statusBadge = getStatusBadge(task.status);
            
            return (
              <div 
                key={task.id}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `calc(${position}% + 16px)`, transform: 'translateX(-50%)' }}
              >
                <div className={`w-6 h-6 rounded-full ${config.bgColor} border-2 border-background flex items-center justify-center shadow-md`}>
                  <config.icon className={`w-3 h-3 ${config.color}`} />
                </div>
                <span className="text-[8px] text-muted-foreground mt-1 whitespace-nowrap">
                  {getMonthLabel(task.dueInMonths)}
                </span>
              </div>
            );
          })}
          
          {/* Spacer for timeline height */}
          <div className="h-12" />
        </div>
      </div>
      
      {/* Task Cards */}
      <div className="space-y-2">
        {tasks.map((task, index) => {
          const config = getTaskConfig(task.type);
          const statusBadge = getStatusBadge(task.status);
          
          return (
            <div 
              key={task.id}
              className={`p-3 rounded-lg bg-muted/30 border ${config.borderColor} maintenance-card`}
              style={{ '--index': index } as React.CSSProperties}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <config.icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-foreground text-sm">{task.label}</p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${statusBadge.className}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    {task.lastPerformed && (
                      <p className="text-[10px] text-muted-foreground">
                        Last: {task.lastPerformed} {task.technician && `by ${task.technician}`}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-foreground">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="font-mono font-semibold text-sm">
                      {formatDueDate(task.dueInMonths)}
                    </span>
                  </div>
                  {onScheduleEarly && task.status === 'upcoming' && (
                    <button
                      onClick={() => onScheduleEarly(task.type)}
                      className="text-[10px] text-primary hover:underline mt-1"
                    >
                      Schedule Early
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-[10px]">No upcoming maintenance scheduled</p>
        </div>
      )}
    </div>
  );
}
