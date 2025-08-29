
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Wrench, Github, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SystemPage() {
  const handleRunDiagnostics = () => {
    // Placeholder for diagnostics logic
    alert("Running diagnostics...");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">System Information</CardTitle>
          </div>
           <CardDescription>
            Check the status of your environment and run diagnostics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div>
              <p className="font-semibold">Distrobox Status</p>
              <p className="text-sm text-muted-foreground">
                Distrobox and dependencies are installed and running correctly.
              </p>
            </div>
            <Button variant="outline" onClick={handleRunDiagnostics}>
              <Wrench className="mr-2 h-4 w-4" />
              Run Diagnostics
            </Button>
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Project Links</CardTitle>
            <CardDescription>
                Find more information about DistroWolf and Distrobox.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <Link href="https://distrobox.it/" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-primary"/>
                    <div>
                        <h3 className="font-semibold">Distrobox Official Site</h3>
                        <p className="text-sm text-muted-foreground">The official documentation and website for Distrobox.</p>
                    </div>
                </div>
            </Link>
            <Link href="https://github.com/noyzey/distrowolf" target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:bg-accent transition-colors">
                 <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-primary"/>
                    <div>
                        <h3 className="font-semibold">DistroWolf on GitHub</h3>
                        <p className="text-sm text-muted-foreground">View the source code, report issues, or contribute.</p>
                    </div>
                </div>
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
