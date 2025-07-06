import React from 'react';
import { useSocket } from '../../api/socket';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { Wifi, WifiOff, Users, Clock } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected: propIsConnected }) => {
  const { isConnected: socketIsConnected } = useSocket();
  const { activeUsers, isReceivingUpdates } = useCollaborationStore();
  
  // Use prop if provided, otherwise use socket status
  const connectionStatus = propIsConnected !== undefined ? propIsConnected : socketIsConnected();

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {connectionStatus ? (
          <Wifi size={14} className="text-green-500" />
        ) : (
          <WifiOff size={14} className="text-red-500" />
        )}
        <span className={connectionStatus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {connectionStatus ? 'Connected' : 'Disconnected'}
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