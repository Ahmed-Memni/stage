"use client"

import { useState } from "react"
import KPICard from "./kpi-card"
import type { BootKPI, KPIStatus } from "./types/kpi-types"

export default function Component() {
  const [mode, setMode] = useState<"mode1" | "mode2">("mode1")

  // State to preserve KPI status for each mode
  const [mode1Statuses, setMode1Statuses] = useState<{
    qnx: KPIStatus[],
    carOS: KPIStatus[],
    android: KPIStatus[]
  }>({ qnx: [], carOS: [], android: [] })

  const [mode2Statuses, setMode2Statuses] = useState<{
    qnx: KPIStatus[],
    carOS: KPIStatus[],
    android: KPIStatus[]
  }>({ qnx: [], carOS: [], android: [] })

  const mode1qnxSystemKPIs: BootKPI[] = [
    { BootKpiName: "SYS_KERNEL_START", BootKpiSearchPattern: "ifs1_exit", SimplifiedPattern: "ifs1_exit", target: "0.7", shouldFail: true },
    { BootKpiName: "SYS_Ethernet0_Ready", BootKpiSearchPattern: "EMAC0 DRIVER Attach Ready: INTERMEDIATE", SimplifiedPattern: "EMAC0 DRIVER Attach Ready: INTERMEDIATE", target: "", shouldFail: true },
    { BootKpiName: "SYS_BOOT_UFS_INIT_START", BootKpiSearchPattern: "devb-ufs-qualcomm: LAUNCH", SimplifiedPattern: "devb-ufs-qualcomm: LAUNCH", target: "", shouldFail: true },
    { BootKpiName: "SYS_GPU_Ready", BootKpiSearchPattern: "kgsl: READY", SimplifiedPattern: "kgsl: READY", target: "", shouldFail: true },
    { BootKpiName: "SYS_BOOT_UFS_INIT_END", BootKpiSearchPattern: "devb-ufs-qualcomm: READY", SimplifiedPattern: "devb-ufs-qualcomm: READY", target: "", shouldFail: true },
    { BootKpiName: "SYS_Display1_Ready", BootKpiSearchPattern: "openwfd_server_1: READY", SimplifiedPattern: "openwfd_server_1: READY", target: "", shouldFail: true },
    { BootKpiName: "SYS_Video_Ready", BootKpiSearchPattern: "videoCore: READY", SimplifiedPattern: "videoCore: READY", target: "", shouldFail: true },
    { BootKpiName: "SYS_Audio_Ready", BootKpiSearchPattern: "/dev/audio_service", SimplifiedPattern: "/dev/audio_service", target: "READY", shouldFail: true },
    { BootKpiName: "SYS_Rootfs_Ready", BootKpiSearchPattern: "/mnt/scripts/startup.sh", SimplifiedPattern: "/mnt/scripts/startup.sh", target: "LAUNCH", shouldFail: true },
    { BootKpiName: "SYS_QVM_Launch", BootKpiSearchPattern: "vmm_service: LAUNCH", SimplifiedPattern: "vmm_service: LAUNCH", target: "", shouldFail: true },
    { BootKpiName: "Startup OEM_PM", BootKpiSearchPattern: "oem_pm: START", SimplifiedPattern: "oem_pm: START", target: "", shouldFail: true },
    { BootKpiName: "Startup QNX VM RBVM", BootKpiSearchPattern: "launch qvm -name:la1,", SimplifiedPattern: "launch qvm -name:la1,", target: "1.7", shouldFail: true },
    { BootKpiName: "Startup QNX VM FVM", BootKpiSearchPattern: "launch qvm -name:la,", SimplifiedPattern: "launch qvm -name:la,", target: "1.7", shouldFail: true }
  ]

  const mode1carOSKPIs: BootKPI[] = [
    { BootKpiName: "Kernel Booting Linux", BootKpiSearchPattern: "Booting Linux on physical CPU", SimplifiedPattern: "Booting Linux on physical CPU", target: "1.7", shouldFail: true },
    { BootKpiName: "Kernel and driver loaded", BootKpiSearchPattern: "Freeing unused kernel memory", SimplifiedPattern: "Freeing unused kernel memory", target: "", shouldFail: true },
    { BootKpiName: "CarOS init first stage started", BootKpiSearchPattern: "init first stage started!", SimplifiedPattern: "init first stage started!", target: "", shouldFail: true },
    { BootKpiName: "CarOS boot complete", BootKpiSearchPattern: "VIRTUAL_DEVICE_BOOT_COMPLETED", SimplifiedPattern: "VIRTUAL_DEVICE_BOOT_COMPLETED", target: "", shouldFail: true },
    { BootKpiName: "CarOS Application Start", BootKpiSearchPattern: "sdv_vpm_agent: sdv_vpm::power_service: Successfully notified all callbacks, notifying OEM for ON!", SimplifiedPattern: "sdv_vpm_agent: sdv_vpm::power_service: Successfully notified all callbacks, notifying OEM for ON!", target: "3.2", shouldFail: true },
    { BootKpiName: "CarOS full operationnal", BootKpiSearchPattern: "disco_app: impeller_renderer::renderer::impeller: External image", SimplifiedPattern: "disco_app: impeller_renderer::renderer::impeller: External image", target: "4.3", shouldFail: true }
  ]

  const mode1androidKPIs: BootKPI[] = [
    { BootKpiName: "Kernel Booting Linux", BootKpiSearchPattern: "Booting Linux on physical CPU", SimplifiedPattern: "Booting Linux on physical CPU", target: "1.7", shouldFail: true },
    { BootKpiName: "Kernel and driver loaded", BootKpiSearchPattern: "Freeing unused kernel memory", SimplifiedPattern: "Freeing unused kernel memory", target: "", shouldFail: true },
    { BootKpiName: "Init first stage started", BootKpiSearchPattern: "init first stage started!", SimplifiedPattern: "init first stage started!", target: "", shouldFail: true },
    { BootKpiName: "User Android Boot Complete", BootKpiSearchPattern: "K - USER Android Boot Complete", SimplifiedPattern: "K - USER Android Boot Complete", target: "19.83", shouldFail: true },
    { BootKpiName: "no name", BootKpiSearchPattern: "^(?!.*Android).*boot_kpi: (.*)$", SimplifiedPattern: "boot_kpi", onlyFirst: false, target: "", shouldFail: true },
    { BootKpiName: "no name1", BootKpiSearchPattern: "KPI\\.STARTUP\\.([A-Z_]+)", SimplifiedPattern: "KPI.STARTUP", onlyFirst: false, target: "", shouldFail: true }
  ]

  // Duplicating for mode2
  const mode2qnxSystemKPIs = mode1qnxSystemKPIs.map(k => ({ ...k }))
  const mode2carOSKPIs = mode1carOSKPIs.map(k => ({ ...k }))
  const mode2androidKPIs = mode1androidKPIs.map(k => ({ ...k }))

  const qnxKPIs = mode === "mode1" ? mode1qnxSystemKPIs : mode2qnxSystemKPIs
  const carOSKPIs = mode === "mode1" ? mode1carOSKPIs : mode2carOSKPIs
  const androidKPIs = mode === "mode1" ? mode1androidKPIs : mode2androidKPIs

  const currentStatuses = mode === "mode1" ? mode1Statuses : mode2Statuses

  const handleQnxUpdate = (updated: KPIStatus[]) => {
    if (mode === "mode1") setMode1Statuses(prev => ({ ...prev, qnx: updated }))
    else setMode2Statuses(prev => ({ ...prev, qnx: updated }))
  }

  const handleCarOSUpdate = (updated: KPIStatus[]) => {
    if (mode === "mode1") setMode1Statuses(prev => ({ ...prev, carOS: updated }))
    else setMode2Statuses(prev => ({ ...prev, carOS: updated }))
  }

  const handleAndroidUpdate = (updated: KPIStatus[]) => {
    if (mode === "mode1") setMode1Statuses(prev => ({ ...prev, android: updated }))
    else setMode2Statuses(prev => ({ ...prev, android: updated }))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-center space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${mode === "mode1" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          onClick={() => setMode("mode1")}
        >
          Sleep to run
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === "mode2" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          onClick={() => setMode("mode2")}
        >
          Shutdown
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Boot KPI Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor system boot performance indicators</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
        <KPICard title="QNX System Boot KPIs" kpis={qnxKPIs} currentStatuses={currentStatuses.qnx} onStatusesUpdate={handleQnxUpdate} />
        <KPICard title="CarOS Boot KPIs" kpis={carOSKPIs} currentStatuses={currentStatuses.carOS} onStatusesUpdate={handleCarOSUpdate} />
        <KPICard title="Android Boot KPIs" kpis={androidKPIs} currentStatuses={currentStatuses.android} onStatusesUpdate={handleAndroidUpdate} />
      </div>
    </div>
  )
}
