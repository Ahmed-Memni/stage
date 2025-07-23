export interface BootKPI {
  BootKpiName: string
  BootKpiSearchPattern: string
  SimplifiedPattern?: string
  target?: string
  shouldFail: boolean
  onlyFirst?: boolean
}

export interface KPIComponentProps {
  title: string
  kpis: BootKPI[]
  onRefresh?: () => Promise<BootKPI[]>
}

export interface KPIStatus {
  name: string
  status: "pass" | "fail" | "pending" | "unknown"
  actualValue?: string
  targetValue?: string
  lastChecked: string
  reason?: string
}
