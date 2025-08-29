
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ExternalLink, Loader, Shield } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSystemCheck } from "@/hooks/use-system-check";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { installDistrobox, installPodman } from "@/lib/distrobox";

type InstallState = "idle" | "installing" | "success" | "error";

export function SetupWizard() {
  const { dependencies, checkSystemDependencies } = useSystemCheck();
  const [podmanInstallState, setPodmanInstallState] = useState<InstallState>("idle");
  const [distroboxInstallState, setDistroboxInstallState] = useState<InstallState>("idle");
  const { toast } = useToast();

  const handleInstallPodman = async () => {
    setPodmanInstallState("installing");
    toast({ title: "Installing Podman...", description: "This may take a few moments. Please approve the password prompt." });
    try {
      await installPodman();
      setPodmanInstallState("success");
      toast({ title: "Podman Installed Successfully!", description: "Please re-check dependencies." });
      checkSystemDependencies();
    } catch (error: any) {
      setPodmanInstallState("error");
      toast({ variant: "destructive", title: "Podman Installation Failed", description: error.message });
    }
  };

  const handleInstallDistrobox = async () => {
    setDistroboxInstallState("installing");
    toast({ title: "Installing Distrobox...", description: "Please approve the password prompt if it appears." });
    try {
      await installDistrobox();
      setDistroboxInstallState("success");
      toast({ title: "Distrobox Installed Successfully!", description: "Please re-check dependencies." });
      checkSystemDependencies();
    } catch (error: any) {
      setDistroboxInstallState("error");
      toast({ variant: "destructive", title: "Distrobox Installation Failed", description: error.message });
    }
  };

  const DependencyStatus = ({ name, installed, onInstall, installState }: { name: string, installed: boolean, onInstall: () => void, installState: InstallState }) => (
    <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
      <div className="flex items-center gap-4">
        {installed ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <XCircle className="h-6 w-6 text-destructive" />
        )}
        <div className="flex flex-col">
            <span className="font-semibold">{name}</span>
            <span className="text-sm text-muted-foreground">{installed ? "Installed" : "Not Found"}</span>
        </div>
      </div>
      {!installed && (
        <Button onClick={onInstall} disabled={installState === 'installing'}>
            {installState === 'installing' ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
            Install
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-3 mb-4">
                    <Shield className="h-10 w-10 text-primary" />
                    <CardTitle className="font-headline text-3xl">DistroWolf Setup</CardTitle>
                </div>
                <CardDescription>
                    Welcome to DistroWolf! It looks like some required dependencies are missing. 
                    Please install them to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 rounded-lg border bg-muted/20 text-center">
                    <p className="font-semibold">Detected Host OS</p>
                    <p className="text-primary">{dependencies?.distroInfo?.name || 'Loading...'}</p>
                </div>
                <DependencyStatus name="Podman" installed={dependencies?.podmanInstalled || false} onInstall={handleInstallPodman} installState={podmanInstallState} />
                <DependencyStatus name="Distrobox" installed={dependencies?.distroboxInstalled || false} onInstall={handleInstallDistrobox} installState={distroboxInstallState} />
                
                <div className="pt-4 text-center text-sm text-muted-foreground">
                    <p>DistroWolf requires Podman as its container runtime. Docker is not supported for automatic installation.</p>
                    <p>If installation fails, please install the dependencies manually and then re-check.</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => checkSystemDependencies()}>
                    Re-check Dependencies
                </Button>
                <Link href="https://distrobox.it/usage/installation/" passHref legacyBehavior>
                    <a target="_blank" rel="noopener noreferrer">
                        <Button>
                            <ExternalLink className="mr-2 h-4 w-4"/>
                            Manual Installation Guide
                        </Button>
                    </a>
                </Link>
            </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default SetupPage;

    