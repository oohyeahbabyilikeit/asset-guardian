import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Eye, 
  MousePointerClick, 
  PartyPopper, 
  PlayCircle, 
  StopCircle,
  ArrowRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentActivity, type ActivityType } from '@/hooks/useRecentActivity';
import { getSequenceTypeLabel } from '@/hooks/useNurturingSequences';
import { formatDistanceToNow } from 'date-fns';

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'opened':
      return Eye;
    case 'clicked':
      return MousePointerClick;
    case 'booked':
      return PartyPopper;
    case 'started':
      return PlayCircle;
    case 'stopped':
      return StopCircle;
    default:
      return ClipboardList;
  }
}

function getActivityColor(type: ActivityType): string {
  switch (type) {
    case 'opened':
      return 'text-sky-400 bg-sky-500/20';
    case 'clicked':
      return 'text-violet-400 bg-violet-500/20';
    case 'booked':
      return 'text-emerald-400 bg-emerald-500/20';
    case 'started':
      return 'text-amber-400 bg-amber-500/20';
    case 'stopped':
      return 'text-rose-400 bg-rose-500/20';
    default:
      return 'text-muted-foreground bg-muted';
  }
}

function getActivityText(type: ActivityType): string {
  switch (type) {
    case 'opened':
      return 'opened email';
    case 'clicked':
      return 'clicked link';
    case 'booked':
      return 'booked job!';
    case 'started':
      return 'sequence started';
    case 'stopped':
      return 'sequence stopped';
    default:
      return 'activity';
  }
}

export function RecentActivityFeed() {
  const navigate = useNavigate();
  const { data: activities, isLoading } = useRecentActivity(8);

  return (
    <div className={cn(
      'rounded-xl p-5 border border-border bg-card',
      'shadow-sm'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        </div>
        <button
          onClick={() => navigate('/contractor/sequences')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </>
        ) : activities && activities.length > 0 ? (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClasses = getActivityColor(activity.type);
            const [iconColor, bgColor] = colorClasses.split(' ');
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 py-1 group"
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  bgColor
                )}>
                  <Icon className={cn('w-4 h-4', iconColor)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.customerName}</span>
                    {' '}
                    <span className="text-muted-foreground">{getActivityText(activity.type)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.propertyAddress} · {getSequenceTypeLabel(activity.sequenceType)}
                  </p>
                </div>
                
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Start a sequence to see engagement here</p>
          </div>
        )}
      </div>
    </div>
  );
}
