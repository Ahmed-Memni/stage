"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
interface ProtocolTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}
export function ProtocolTabs({ activeTab, onTabChange }: ProtocolTabsProps) {
  return (
    <div className="mb-6">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid grid-cols-3 grid-rows-2 gap-2 w-full">
          <TabsTrigger value="monitor" className="flex items-center gap-2 row-start-1 col-start-1">
            🔴 Monitor & Sequence
          </TabsTrigger>

          <TabsTrigger value="topology" className="flex items-center gap-2 row-start-1 col-start-2">
            🌐 Network & Flow Analysis
          </TabsTrigger>

          <TabsTrigger value="messages" className="flex items-center gap-2 row-start-1 col-start-3">
            📋 Message History
          </TabsTrigger>

          <TabsTrigger value="Kpi" className="flex items-center gap-2 row-start-2 col-start-2 justify-self-center">
            🚨 KPI
          </TabsTrigger>
        </TabsList>

      </Tabs>
    </div>
  )
}