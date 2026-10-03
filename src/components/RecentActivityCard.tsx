import React, { useState } from 'react';
import {
  Clock,
  UserPlus,
  MousePointerClick,
  ShoppingBag,
  Camera,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { ActivityItem } from '../types';

interface RecentActivityCardProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  activities,
  onViewAll,
}) => {
  const [filter, setFilter] = useState<'Hoje' | 'Ontem' | '7 dias'>('Hoje');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <UserPlus className="w-3.5 h-3.5 text-[#006e4b]" />;
      case 'clicks':
        return <MousePointerClick className="w-3.5 h-3.5 text-[#3525cd]" />;
      case 'order':
        return <ShoppingBag className="w-3.5 h-3.5 text-[#FF7A00]" />;
      case 'visits':
        return <Camera className="w-3.5 h-3.5 text-[#4953bc]" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-[#3525cd]" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'lead':
        return 'bg-[#6ffbbe]/40';
      case 'clicks':
        return 'bg-[#dae2fd]';
      case 'order':
        return 'bg-[#FFF3E6]';
      case 'visits':
        return 'bg-[#e0e0ff]';
      default:
        return 'bg-[#eaedff]';
    }
  };

  return (
    <div
      id="card-recent-activity"
      className="flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60"
    >
      <div>
        <div className="flex items-center justify-between pb-2 relative">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#eaedff] text-[#3525cd] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-[#131b2e] leading-tight">
                Atividade recente
              </h4>
              <span className="text-[11px] text-[#464555]">Tempo real</span>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1 text-[#464555] text-xs font-semibold hover:text-[#131b2e] cursor-pointer"
            >
              <span>{filter}</span>
              <ChevronDown className="w-3.5 h-3.5" />
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
        </div>

        {/* Activity Feed List */}
        <div className="flex flex-col gap-2.5 mt-2">
          {activities.length > 0 ? (
            activities.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-start gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full ${getIconBg(
                    item.type
                  )} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  {getIcon(item.type)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#131b2e] leading-tight">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-[#777587] truncate">
                    {item.subtitle}
                  </span>
                </div>
                <span className="text-[10px] text-[#777587] shrink-0">
                  {item.timeAgo}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center rounded-xl bg-[#faf8ff] border border-dashed border-[#eaedff] flex flex-col items-center">
              <span className="text-xs font-medium text-[#777587]">
                Nenhuma atividade registrada no período.
              </span>
              <span className="text-[10px] text-[#969cb0] mt-0.5">
                As interações na sua página aparecerão aqui em tempo real.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Link */}
      {activities.length > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center justify-center gap-1 mt-4 text-xs text-[#3525cd] hover:underline font-bold text-center cursor-pointer"
        >
          <span>Ver todas as atividades</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
