
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Box, CheckCircle, Clock, HardDrive, Hash, Home, Power, Server, XCircle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface ContainerInfoPanelProps {
  info: any | null;
  onBack: () => void;
}

const InfoRow = ({ icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
  <div className="flex items-start justify-between p-3 rounded-lg hover:bg-accent/10 transition-colors">
    <div className="flex items-center gap-3">
      {React.createElement(icon, { className: "h-5 w-5 text-muted-foreground mt-1" })}
      <div className='flex flex-col'>
        <span className="font-medium text-sm text-muted-foreground">{label}</span>
        <div className="font-mono text-md text-foreground">{children}</div>
      </div>
    </div>
  </div>
);

const FlagBadge = ({ label, enabled }: { label: string, enabled: boolean }) => (
    <Badge variant={enabled ? "default" : "secondary"} className="gap-1.5 pl-2 pr-2.5 py-1 text-sm">
        {enabled ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
        {label}
    </Badge>
)


export function ContainerInfoPanel({ info, onBack }: ContainerInfoPanelProps) {

  const parsedInfo = useMemo(() => {
    if (!info) return null;

    const args = info.Config?.Cmd || [];
    const findArg = (arg: string) => {
        const index = args.indexOf(arg);
        return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
    }

    const hostHome = info.HostConfig?.Binds?.find((b: string) => b.includes(info.Config.Labels['distrobox.host_home']));
    const homeArg = findArg('--home');
    let homeStatus = "Shared with Host";
    if (homeArg && homeArg.trim() !== "" && homeArg.trim() !== info.Config.Labels['distrobox.host_home']) {
        homeStatus = `Isolated at ${homeArg}`;
    }

    const mounts = info.HostConfig?.Binds?.filter((bind: string) => {
        const parts = bind.split(':');
        // Filter out system and home binds to only show user-defined volumes
        return parts.length >= 2 && !parts[1].startsWith('/dev') && !parts[1].startsWith('/sys') && !parts[1].startsWith('/tmp') && !parts[1].includes('.distrobox') && !parts[1].includes(info.Config.Labels['distrobox.host_home']);
    }).map((bind: string) => {
        const parts = bind.split(':');
        return { host: parts[0], container: parts[1], options: parts.length > 2 ? parts[2] : 'rw' }
    }) || [];
    
    return {
      name: info.Name,
      id: info.Id.substring(0, 12),
      imageName: info.ImageName,
      status: info.State?.Status,
      created: info.Created ? formatDistanceToNow(new Date(info.Created), { addSuffix: true }) : 'N/A',
      startedAt: info.State?.StartedAt ? formatDistanceToNow(new Date(info.State.StartedAt), { addSuffix: true }) : 'N/A',
      home: homeStatus,
      privileged: info.HostConfig?.Privileged || false,
      autostart: info.HostConfig?.RestartPolicy?.Name === 'always',
      mounts: mounts,
    };
  }, [info]);

  if (!info || !parsedInfo) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
               {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-24" />
                           <Skeleton className="h-5 w-48" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline flex items-center gap-3">
                <Box className="h-6 w-6 text-primary" />
                Container: {parsedInfo.name}
              </CardTitle>
              <CardDescription>Detailed information and configuration for this container.</CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Apps
            </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <InfoRow icon={Hash} label="Container ID">
                <span>{parsedInfo.id}</span>
            </InfoRow>
            <InfoRow icon={Server} label="Base Image">
                <span>{parsedInfo.imageName}</span>
            </InfoRow>
             <InfoRow icon={Clock} label="Created">
                <span>{parsedInfo.created}</span>
            </InfoRow>
             <InfoRow icon={Power} label="Last Started">
                <span>{parsedInfo.startedAt}</span>
            </InfoRow>
             <InfoRow icon={Home} label="Home Directory">
                <span>{parsedInfo.home}</span>
            </InfoRow>
             <InfoRow icon={HardDrive} label="Mounted Volumes">
                {parsedInfo.mounts.length > 0 ? (
                    <div className="flex flex-col gap-1 text-sm">
                        {parsedInfo.mounts.map((mount: any, index: number) => (
                            <div key={index}>
                                <span className="font-semibold">{mount.host}</span>
                                <span className="text-muted-foreground mx-2">{`->`}</span>
                                <span>{mount.container}</span>
                                <Badge variant="outline" className='ml-2'>{mount.options}</Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                )}
            </InfoRow>
            <InfoRow icon={Shield} label="Flags">
                <div className='flex gap-2 flex-wrap mt-1'>
                    <FlagBadge label="Privileged" enabled={parsedInfo.privileged} />
                    <FlagBadge label="Autostart" enabled={parsedInfo.autostart} />
                </div>
            </InfoRow>
        </CardContent>
    </Card>
  );
}
