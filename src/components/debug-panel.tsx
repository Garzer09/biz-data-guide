/**
 * Debug utilities for development mode
 * Provides tools for performance monitoring and debugging
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bug, Download, Trash2, Activity } from 'lucide-react';
import { logger, LogLevel } from '@/lib/logger';

interface PerformanceMetrics {
  componentRenders: number;
  apiCalls: number;
  averageApiTime: number;
  memoryUsage: number;
  largestContentfulPaint?: number;
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    componentRenders: 0,
    apiCalls: 0,
    averageApiTime: 0,
    memoryUsage: 0
  });

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  useEffect(() => {
    // Update logs every 2 seconds
    const interval = setInterval(() => {
      setLogs([...logger.getLogs()]);
      updateMetrics();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    const recentLogs = logger.getLogs();
    const apiLogs = recentLogs.filter(log => log.context === 'API');
    const performanceLogs = recentLogs.filter(log => log.context === 'PERFORMANCE');

    // Calculate API metrics
    const apiTimes = performanceLogs
      .map(log => log.data as { duration?: number })
      .filter(data => data && typeof data.duration === 'number')
      .map(data => data.duration!);

    const avgApiTime = apiTimes.length > 0 
      ? apiTimes.reduce((sum, time) => sum + time, 0) / apiTimes.length 
      : 0;

    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    setMetrics({
      componentRenders: performanceLogs.length,
      apiCalls: apiLogs.length,
      averageApiTime: Math.round(avgApiTime),
      memoryUsage: Math.round(memoryUsage / 1024 / 1024) // MB
    });
  };

  const exportLogs = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR: return 'bg-red-500';
      case LogLevel.WARN: return 'bg-yellow-500';
      case LogLevel.INFO: return 'bg-blue-500';
      case LogLevel.DEBUG: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getLogLevelText = (level: LogLevel) => {
    return LogLevel[level];
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-background border-2 shadow-lg hover:shadow-xl"
            title="Debug Panel"
          >
            <Bug className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Debug Panel - Development Mode
            </DialogTitle>
            <DialogDescription>
              Performance metrics and debug logs for troubleshooting
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Component Renders:</span>
                  <Badge variant="outline">{metrics.componentRenders}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>API Calls:</span>
                  <Badge variant="outline">{metrics.apiCalls}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avg API Time:</span>
                  <Badge variant="outline">{metrics.averageApiTime}ms</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <Badge variant="outline">{metrics.memoryUsage}MB</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Log Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Log Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Logs:</span>
                  <Badge variant="outline">{logs.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={exportLogs}>
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearLogs}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logs Display */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-1 text-xs">
                  {logs.slice(-50).reverse().map((log, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded border">
                      <Badge 
                        className={`${getLogLevelColor(log.level)} text-white text-[10px] shrink-0`}
                      >
                        {getLogLevelText(log.level)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                          {log.context && ` [${log.context}]`}
                        </div>
                        <div className="break-words">{log.message}</div>
                        {log.data && (
                          <pre className="text-[10px] text-muted-foreground mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No logs available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}