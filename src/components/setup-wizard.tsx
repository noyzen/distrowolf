
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ExternalLink, Loader, Shield, LogOut, Terminal, AlertTriangle, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useSystemCheck } from "@/hooks/use-system-check";

export function SetupWizard() {
  const { dependencies, checkSystemDependencies, setSkipped, installAlacritty, isInstallingAlacritty } = useSystemCheck();

  const handleManualInstallClick = () => {
    window.open('https://distrobox.it/', '_blank');
  };

  const hasTerminal = dependencies?.alacrittyInstalled || !!dependencies?.detectedTerminal;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-2xl p-4"
    >
      <Card>
          <CardHeader className="text-center">
              <div className="mx-auto flex justify-center items-center gap-3 mb-4">
                  <Shield className="h-10 w-10 text-primary" />
                  <CardTitle className="font-headline text-3xl">DistroWolf Setup</CardTitle>
              </div>
              <CardDescription>
                  Welcome! It looks like some required dependencies are missing. 
                  Please install them to continue.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-4">
                      {dependencies?.podmanInstalled ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-destructive" />}
                      <div className="flex flex-col">
                          <span className="font-semibold">Podman</span>
                          <span className="text-sm text-muted-foreground">The recommended container runtime.</span>
                      </div>
                  </div>
                  <span className={`text-sm font-semibold ${dependencies?.podmanInstalled ? 'text-green-500' : 'text-destructive'}`}>
                      {dependencies?.podmanInstalled ? "Installed" : "Not Found"}
                  </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-4">
                      {dependencies?.distroboxInstalled ? <CheckCircle className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-destructive" />}
                      <div className="flex flex-col">
                          <span className="font-semibold">Distrobox</span>
                          <span className="text-sm text-muted-foreground">The core container management tool.</span>
                      </div>
                  </div>
                   <span className={`text-sm font-semibold ${dependencies?.distroboxInstalled ? 'text-green-500' : 'text-destructive'}`}>
                      {dependencies?.distroboxInstalled ? "Installed" : "Not Found"}
                  </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-4">
                      {hasTerminal ? <CheckCircle className="h-6 w-6 text-green-500" /> : <AlertTriangle className="h-6 w-6 text-yellow-500" />}
                      <div className="flex flex-col">
                          <span className="font-semibold">Terminal Emulator</span>
                          <span className="text-sm text-muted-foreground">For entering containers directly. (Optional)</span>
                      </div>
                  </div>
                   <div className="flex flex-col items-end gap-2">
                     <span className={`text-sm font-semibold ${hasTerminal ? 'text-green-500' : 'text-yellow-500'}`}>
                        {dependencies?.detectedTerminal ? `Detected: ${dependencies.detectedTerminal}` : (dependencies?.alacrittyInstalled ? 'Alacritty Installed' : 'Not Found')}
                     </span>
                      {!hasTerminal && (
                        <Button size="sm" onClick={installAlacritty} disabled={isInstallingAlacritty}>
                            {isInstallingAlacritty ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Install Alacritty
                        </Button>
                      )}
                   </div>
              </div>
              
              <div className="pt-4 text-center text-sm text-muted-foreground">
                  <p>If dependencies are not found after installation, please restart DistroWolf.</p>
              </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setSkipped(true)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Skip for now
                  </Button>
                  <Button variant="secondary" onClick={() => checkSystemDependencies()}>
                      Re-check Dependencies
                  </Button>
              </div>
              <Button onClick={handleManualInstallClick}>
                  <ExternalLink className="mr-2 h-4 w-4"/>
                  Guide
              </Button>
          </CardFooter>
      </Card>
    </motion.div>
  );
}

export default SetupWizard;
