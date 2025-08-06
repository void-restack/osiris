"use client"

import { useQuery } from "@tanstack/react-query"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { packageQueries } from "@/lib/queries"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    downloads: {
        label: "Downloads",
        color: "hsl(142, 76%, 36%)", // Green color matching the image
    },
} satisfies ChartConfig

interface WeeklyDownloadsChartProps {
    packageId: string
}

export function WeeklyDownloadsChart({ packageId }: WeeklyDownloadsChartProps) {
    // Calculate date range for last 8 weeks
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - (8 * 7)) // 8 weeks ago

    const { data: downloadsData, isLoading } = useQuery({
        ...packageQueries.weeklyDownloadsOptions(packageId, {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        })
    })

    if (isLoading || !downloadsData) {
        return (
            <div className="h-[60px] w-full animate-pulse bg-primary-50 rounded" />
        )
    }

    // Transform data to expected format
    const chartData = Array.isArray(downloadsData)
        ? downloadsData.map((item: any, index: number) => ({
            week: `W${index + 1}`,
            downloads: typeof item === 'number' ? item : (item.downloads || item.count || item.value || 0),
        }))
        : downloadsData && typeof downloadsData === 'object' && 'data' in downloadsData && Array.isArray(downloadsData.data)
            ? downloadsData.data.map((item: any, index: number) => ({
                week: `W${index + 1}`,
                downloads: typeof item === 'number' ? item : (item.downloads || item.count || item.value || 0),
            }))
            : []

    // Calculate current week downloads and change
    const currentDownloads = chartData[chartData.length - 1]?.downloads || 0
    const previousDownloads = chartData[chartData.length - 2]?.downloads || 0
    const change = previousDownloads > 0
        ? Math.round(((currentDownloads - previousDownloads) / previousDownloads) * 100)
        : 0

    // Get current date for display
    const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="space-y-3">
            {/* Header with downloads info */}
            <div className="flex items-baseline justify-between">
                <span className="text-primary-400 text-sm">Weekly Downloads</span>
                <div className="text-right">
                    <span className="text-lg font-medium text-primary-800">
                        {currentDownloads.toLocaleString()}
                    </span>
                    {change !== 0 && (
                        <span className={`ml-1 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({change > 0 ? '+' : ''}{change})
                        </span>
                    )}
                    <span className="text-primary-400 text-sm ml-1">/ {currentDate}</span>
                </div>
            </div>

            {/* Minimal chart */}
            <div className="h-[60px] w-full">
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        data={chartData}
                        margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="fillDownloads" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-downloads)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-downloads)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Area
                            dataKey="downloads"
                            type="monotone"
                            fill="url(#fillDownloads)"
                            fillOpacity={1}
                            stroke="var(--color-downloads)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </AreaChart>
                </ChartContainer>
            </div>
        </div>
    )
}