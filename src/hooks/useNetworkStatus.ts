import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType?: string;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  });

  const updateOnlineStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    
    setStatus(prev => ({
      isOnline,
      wasOffline: !isOnline ? true : prev.wasOffline,
      effectiveType: (navigator as any).connection?.effectiveType,
    }));
  }, []);

  const clearWasOffline = useCallback(() => {
    setStatus(prev => ({ ...prev, wasOffline: false }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check connection type changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateOnlineStatus);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateOnlineStatus);
      }
    };
  }, [updateOnlineStatus]);

  return {
    ...status,
    clearWasOffline,
  };
}
