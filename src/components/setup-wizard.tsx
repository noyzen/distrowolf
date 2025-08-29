
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SetupWizardProps {
    dependencies: {
        distroboxInstalled: boolean;
        podmanInstalled: boolean;
    }
}

export function SetupWizard({ dependencies }: SetupWizardProps) {

  const DependencyStatus = ({ name, installed }: { name: string, installed: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
        <span className="font-semibold">{name}</span>
        <div className="flex items-center gap-2">
            {installed ? (
                <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-500">Installed</span>
                </>
            ) : (
                <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-destructive">Not Found</span>
                </>
            )}
        </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Welcome to DistroWolf!</CardTitle>
                <CardDescription>
                    It looks like some required dependencies are missing. Please install them to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <DependencyStatus name="Distrobox" installed={dependencies.distroboxInstalled} />
                <DependencyStatus name="Podman (or Docker)" installed={dependencies.podmanInstalled} />
                <p className="text-sm text-muted-foreground pt-4">
                    DistroWolf requires Distrobox and a container runtime like Podman or Docker to function. 
                    Please install the missing dependencies using your system's package manager, then restart the application.
                </p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh
                </Button>
                <Link href="https://distrobox.it/usage/installation/" passHref legacyBehavior>
                    <a target="_blank" rel="noopener noreferrer">
                        <Button>
                            <ExternalLink className="mr-2 h-4 w-4"/>
                            Installation Guide
                        </Button>
                    </a>
                </Link>
            </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

    