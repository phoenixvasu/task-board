import React from 'react';
import { useSocket } from '../../api/socket';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { Wifi, WifiOff, Users, Clock } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { isConnected } = useSocket();
  const { activeUsers, isReceivingUpdates } = useCollaborationStore();

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {isConnected() ? (
          <Wifi size={14} className="text-green-500" />
        ) : (
          <WifiOff size={14} className="text-red-500" />
        )}
        <span className={isConnected() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {isConnected() ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Active Users */}
      {activeUsers.length > 0 && (
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Users size={14} />
          <span>{activeUsers.length} active</span>
        </div>
      )}

      {/* Real-time Updates Indicator */}
      {isReceivingUpdates && (
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <Clock size={14} className="animate-pulse" />
          <span>Live updates</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 