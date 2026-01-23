import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  ClipboardList, 
  Check,
  Clock,
  SkipForward,
  AlertCircle,
  Zap
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { type SequenceEvent } from '@/hooks/useSequenceEvents';
import { type NurturingSequence, getSequenceTypeLabel } from '@/hooks/useNurturingSequences';

interface ActivityFeedProps {
  events: SequenceEvent[];
  sequence: NurturingSequence | null;
}

interface ActivityItem {
  id: string;
  type: 'sequence_started' | 'sms_sent' | 'email_sent' | 'call_reminder' | 'step_skipped' | 'sequence_completed';
  date: Date;
  title: string;
  subtitle?: string;
  status?: 'success' | 'pending' | 'skipped' | 'failed';
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'sequence_started':
      return Zap;
    case 'sms_sent':
      return MessageSquare;
    case 'email_sent':
      return Mail;
    case 'call_reminder':
      return Phone;
    case 'step_skipped':
      return SkipForward;
    case 'sequence_completed':
      return Check;
    default:
      return ClipboardList;
  }
}

function getStatusIcon(status?: ActivityItem['status']) {
  switch (status) {
    case 'success':
      return Check;
    case 'pending':
      return Clock;
    case 'skipped':
      return SkipForward;
    case 'failed':
      return AlertCircle;
    default:
      return null;
  }
}

function formatActivityDate(date: Date): string {
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  }
  const daysAgo = differenceInDays(new Date(), date);
  if (daysAgo < 7) {
    return format(date, 'EEEE, h:mm a');
  }
  return format(date, 'MMM d, h:mm a');
}

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const Icon = getActivityIcon(item.type);
  const StatusIcon = getStatusIcon(item.status);
  
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        item.status === 'success' && 'bg-emerald-500/20 text-emerald-400',
        item.status === 'pending' && 'bg-amber-500/20 text-amber-400',
        item.status === 'skipped' && 'bg-muted text-muted-foreground',
        item.status === 'failed' && 'bg-red-500/20 text-red-400',
        !item.status && 'bg-violet-500/20 text-violet-400',
      )}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {item.title}
          </span>
          {StatusIcon && (
            <StatusIcon className={cn(
              'w-3 h-3 shrink-0',
              item.status === 'success' && 'text-emerald-400',
              item.status === 'pending' && 'text-amber-400',
              item.status === 'skipped' && 'text-muted-foreground',
              item.status === 'failed' && 'text-red-400',
            )} />
          )}
        </div>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.subtitle}
          </p>
        )}
      </div>
      
      <span className="text-xs text-muted-foreground shrink-0">
        {formatActivityDate(item.date)}
      </span>
    </div>
  );
}

function buildActivityItems(
  events: SequenceEvent[], 
  sequence: NurturingSequence | null
): ActivityItem[] {
  const items: ActivityItem[] = [];
  
  // Add sequence started event
  if (sequence) {
    items.push({
      id: `seq-start-${sequence.id}`,
      type: 'sequence_started',
      date: sequence.startedAt,
      title: `Sequence started: ${getSequenceTypeLabel(sequence.sequenceType)}`,
      subtitle: `${sequence.totalSteps} steps`,
    });
  }
  
  // Add events
  for (const event of events) {
    if (event.status === 'pending') continue;
    
    const actionTypeMap: Record<string, ActivityItem['type']> = {
      sms: 'sms_sent',
      email: 'email_sent',
      call_reminder: 'call_reminder',
    };
    
    const type = event.status === 'skipped' 
      ? 'step_skipped' 
      : actionTypeMap[event.actionType] || 'sms_sent';
    
    const statusMap: Record<string, ActivityItem['status']> = {
      sent: 'success',
      pending: 'pending',
      skipped: 'skipped',
      failed: 'failed',
    };
    
    items.push({
      id: event.id,
      type,
      date: event.executedAt || event.scheduledAt,
      title: event.status === 'skipped'
        ? `Step ${event.stepNumber} skipped`
        : `${event.actionType === 'call_reminder' ? 'Call reminder' : event.actionType.toUpperCase()} sent`,
      subtitle: event.messageContent 
        ? `"${event.messageContent.slice(0, 50)}${event.messageContent.length > 50 ? '...' : ''}"`
        : undefined,
      status: statusMap[event.status],
    });
  }
  
  // Add completion event
  if (sequence?.status === 'completed' && sequence.completedAt) {
    items.push({
      id: `seq-complete-${sequence.id}`,
      type: 'sequence_completed',
      date: sequence.completedAt,
      title: 'Sequence completed',
      status: 'success',
    });
  }
  
  // Sort by date descending
  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function ActivityFeed({ events, sequence }: ActivityFeedProps) {
  const items = buildActivityItems(events, sequence);
  
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }
  
  // Group by date
  const today: ActivityItem[] = [];
  const yesterday: ActivityItem[] = [];
  const older: ActivityItem[] = [];
  
  for (const item of items) {
    if (isToday(item.date)) {
      today.push(item);
    } else if (isYesterday(item.date)) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  }
  
  return (
    <div className="divide-y divide-border">
      {today.length > 0 && (
        <div className="pb-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Today
          </h4>
          {today.map(item => (
            <ActivityItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
      
      {yesterday.length > 0 && (
        <div className="py-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 pt-2">
            Yesterday
          </h4>
          {yesterday.map(item => (
            <ActivityItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
      
      {older.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 pt-2">
            Earlier
          </h4>
          {older.map(item => (
            <ActivityItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
