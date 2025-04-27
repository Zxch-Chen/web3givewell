"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Users, Calendar } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = change >= 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">{icon}</div>
          <div className={`flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}>
            <span className="text-sm font-medium">{change}%</span>
            {isPositive ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
      </CardContent>
    </Card>
  )
}

interface PerformanceMetricsProps {
  userType: "npo" | "auditor" | "donor"
}

export function PerformanceMetrics({ userType }: PerformanceMetricsProps) {
  // Mock data - in a real app, this would come from an API
  const npoMetrics = {
    funds: { value: "$12,450", change: 8.2 },
    projects: { value: "7", change: 16.7 },
    milestones: { value: "12", change: 25 },
    completionRate: { value: "83%", change: 5.3 },
  }

  const auditorMetrics = {
    earnings: { value: "$2,850", change: 12.4 },
    verifications: { value: "24", change: 33.3 },
    approvalRate: { value: "92%", change: 2.1 },
    disputeRate: { value: "3%", change: -1.5 },
  }

  const donorMetrics = {
    donated: { value: "$5,750", change: 15.8 },
    projects: { value: "9", change: 28.6 },
    impact: { value: "High", change: 10.2 },
    roi: { value: "2.4x", change: 6.7 },
  }

  let metrics
  let chartData

  switch (userType) {
    case "npo":
      metrics = npoMetrics
      chartData = [
        { month: "Jan", funds: 2100 },
        { month: "Feb", funds: 3200 },
        { month: "Mar", funds: 2800 },
        { month: "Apr", funds: 4500 },
        { month: "May", funds: 5100 },
        { month: "Jun", funds: 4800 },
      ]
      break
    case "auditor":
      metrics = auditorMetrics
      chartData = [
        { month: "Jan", earnings: 350 },
        { month: "Feb", earnings: 420 },
        { month: "Mar", earnings: 380 },
        { month: "Apr", earnings: 510 },
        { month: "May", earnings: 620 },
        { month: "Jun", earnings: 570 },
      ]
      break
    case "donor":
      metrics = donorMetrics
      chartData = [
        { month: "Jan", donated: 800 },
        { month: "Feb", donated: 1200 },
        { month: "Mar", donated: 950 },
        { month: "Apr", donated: 1400 },
        { month: "May", donated: 1800 },
        { month: "Jun", donated: 1600 },
      ]
      break
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userType === "npo" && (
          <>
            <MetricCard
              title="Total Funds Raised"
              value={metrics.funds.value}
              change={metrics.funds.change}
              icon={<DollarSign className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Active Projects"
              value={metrics.projects.value}
              change={metrics.projects.change}
              icon={<TrendingUp className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Total Milestones"
              value={metrics.milestones.value}
              change={metrics.milestones.change}
              icon={<Calendar className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Completion Rate"
              value={metrics.completionRate.value}
              change={metrics.completionRate.change}
              icon={<Users className="w-6 h-6 text-primary-600" />}
            />
          </>
        )}

        {userType === "auditor" && (
          <>
            <MetricCard
              title="Total Earnings"
              value={metrics.earnings.value}
              change={metrics.earnings.change}
              icon={<DollarSign className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Verifications"
              value={metrics.verifications.value}
              change={metrics.verifications.change}
              icon={<TrendingUp className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Approval Rate"
              value={metrics.approvalRate.value}
              change={metrics.approvalRate.change}
              icon={<Calendar className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Dispute Rate"
              value={metrics.disputeRate.value}
              change={metrics.disputeRate.change}
              icon={<Users className="w-6 h-6 text-primary-600" />}
            />
          </>
        )}

        {userType === "donor" && (
          <>
            <MetricCard
              title="Total Donated"
              value={metrics.donated.value}
              change={metrics.donated.change}
              icon={<DollarSign className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Projects Supported"
              value={metrics.projects.value}
              change={metrics.projects.change}
              icon={<TrendingUp className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Impact Score"
              value={metrics.impact.value}
              change={metrics.impact.change}
              icon={<Calendar className="w-6 h-6 text-primary-600" />}
            />
            <MetricCard
              title="Social ROI"
              value={metrics.roi.value}
              change={metrics.roi.change}
              icon={<Users className="w-6 h-6 text-primary-600" />}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            {userType === "npo"
              ? "Your fundraising performance over time"
              : userType === "auditor"
                ? "Your earnings over time"
                : "Your donation impact over time"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart">
            <TabsList className="mb-4">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="h-80">
              <div className="w-full h-full flex items-center justify-center bg-primary-50/50 rounded-md">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Interactive Chart</p>
                  <p className="text-primary-600 font-medium">
                    {userType === "npo"
                      ? "Funds Raised by Month"
                      : userType === "auditor"
                        ? "Earnings by Month"
                        : "Donations by Month"}
                  </p>
                  <div className="mt-4 flex justify-center space-x-2">
                    {chartData.map((data, index) => (
                      <div
                        key={index}
                        className="w-8 bg-primary-600 rounded-t-sm"
                        style={{
                          height: `${
                            userType === "npo"
                              ? (data.funds / 5100) * 150
                              : userType === "auditor"
                                ? (data.earnings / 620) * 150
                                : (data.donated / 1800) * 150
                          }px`,
                        }}
                      ></div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-center space-x-2">
                    {chartData.map((data, index) => (
                      <div key={index} className="w-8 text-xs text-muted-foreground">
                        {data.month}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="breakdown">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 font-medium text-sm border-b pb-2">
                  <div>Period</div>
                  <div>Amount</div>
                  <div>Change</div>
                </div>
                {chartData.map((data, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 text-sm">
                    <div>{data.month}</div>
                    <div>
                      $
                      {userType === "npo"
                        ? data.funds.toLocaleString()
                        : userType === "auditor"
                          ? data.earnings.toLocaleString()
                          : data.donated.toLocaleString()}
                    </div>
                    <div
                      className={
                        index > 0
                          ? userType === "npo"
                            ? data.funds > chartData[index - 1].funds
                              ? "text-green-600"
                              : "text-red-600"
                            : userType === "auditor"
                              ? data.earnings > chartData[index - 1].earnings
                                ? "text-green-600"
                                : "text-red-600"
                              : data.donated > chartData[index - 1].donated
                                ? "text-green-600"
                                : "text-red-600"
                          : ""
                      }
                    >
                      {index > 0
                        ? (userType === "npo"
                            ? (((data.funds - chartData[index - 1].funds) / chartData[index - 1].funds) * 100).toFixed(
                                1,
                              )
                            : userType === "auditor"
                              ? (
                                  ((data.earnings - chartData[index - 1].earnings) / chartData[index - 1].earnings) *
                                  100
                                ).toFixed(1)
                              : (
                                  ((data.donated - chartData[index - 1].donated) / chartData[index - 1].donated) *
                                  100
                                ).toFixed(1)) + "%"
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
