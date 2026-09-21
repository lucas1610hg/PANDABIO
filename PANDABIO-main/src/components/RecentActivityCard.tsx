import React, { useState, memo } from 'react';
import { ChevronDown, ArrowRight, Clock } from 'lucide-react';
import { ActivityItem } from '../types';
import { getActivityIcon, getActivityIconBg } from '../utils/iconMapper';
import { Card } from './Card';

interface RecentActivityCardProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

export const RecentActivityCard = memo<RecentActivityCardProps>(
  ({ activities, onViewAll }) => {
    const [filter, setFilter] = useState<'Hoje' | 'Ontem' | '7 dias'>('Hoje');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const matchesFilter = (item: ActivityItem): boolean => {
      const ts = item.date ?? Date.now();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const startToday = start.getTime();

      if (filter === 'Hoje') return ts >= startToday;
      if (filter === 'Ontem') return ts >= startToday - 86400000 && ts < startToday;
      return ts >= startToday - 6 * 86400000;
    };

    const visibleActivities = activities.filter(matchesFilter).slice(0, 4);

    return (
      <Card
        id="card-recent-activity"
        icon={<Clock aria-hidden="true" className="w-4 h-4" />}
        title="Atividade recente"
        subtitle="Tempo real"
        headerRight={
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1 text-[#464555] text-xs font-semibold hover:text-[#131b2e] cursor-pointer"
            >
              <span>{filter}</span>
              <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1 w-24 bg-white rounded-xl shadow-lg border border-black/5 py-1 z-20">
                {(['Hoje', 'Ontem', '7 dias'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFilter(opt);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#f2f3ff] cursor-pointer ${
                      filter === opt ? 'font-bold text-[#3525cd]' : 'text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
        footer={
          visibleActivities.length > 0 && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center justify-center gap-1 mt-4 text-xs text-[#3525cd] hover:underline font-bold text-center cursor-pointer"
            >
              <span>Ver todas as atividades</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          )
        }
      >
        <div className="flex flex-col gap-2.5 mt-2">
          {visibleActivities.length > 0 ? (
            visibleActivities.map((item) => {
              const Icon = getActivityIcon(item.type);
              return (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full ${getActivityIconBg(
                      item.type,
                    )} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#131b2e] leading-tight">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[#777587] truncate">{item.subtitle}</span>
                  </div>
                  <span className="text-[10px] text-[#777587] shrink-0">{item.timeAgo}</span>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center rounded-xl bg-[#faf8ff] border border-dashed border-[#eaedff] flex flex-col items-center">
              <span className="text-xs font-medium text-[#777587]">
                Nenhuma atividade registrada no período.
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.activities.length === nextProps.activities.length &&
      prevProps.activities.every((activity, i) => activity.id === nextProps.activities[i]?.id)
    );
  },
);
