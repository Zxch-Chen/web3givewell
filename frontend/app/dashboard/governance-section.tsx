'use client';

import GovernanceTokens from "../components/GovernanceTokens";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GovernanceSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Governance</h2>
        <p className="text-muted-foreground">
          Manage governance tokens and participate in project governance.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <GovernanceTokens />
        
        <Card>
          <CardHeader>
            <CardTitle>Governance Activity</CardTitle>
            <CardDescription>
              Recent votes and governance activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Forest Conservation Proposal</div>
                  <div className="text-sm text-muted-foreground">3 days ago</div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  You voted: <span className="text-green-600 font-medium">Approve</span>
                </div>
              </div>
              
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Milestone 2 Funding</div>
                  <div className="text-sm text-muted-foreground">1 week ago</div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Active vote: <span className="text-amber-600 font-medium">Ends in 2 days</span>
                </div>
              </div>
              
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Clean Water Initiative</div>
                  <div className="text-sm text-muted-foreground">2 weeks ago</div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Proposal passed: <span className="text-green-600 font-medium">92% approval</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
