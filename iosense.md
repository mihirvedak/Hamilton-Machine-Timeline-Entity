# IOsense SDK - API Function Tracking

## Authentication Flow
| FunctionID | Method | Endpoint | Used In |
|---|---|---|---|
| `validateSSOToken` | GET | `/api/retrieve-sso-token/{token}` | `auth.service.ts` → `validateSSOToken()` |

## Device / Data Flow
| FunctionID | Method | Endpoint | Used In |
|---|---|---|---|
| `findUserDevices` | PUT | `/api/account/devices/{skip}/{limit}` | `iosense.service.ts` → `findUserDevices()` |
| `getDeviceSpecificMetadata` | GET | `/api/account/ai-sdk/metaData/device/{devID}` | `iosense.service.ts` → `getDeviceMetadata()` |
| `getWidgetData` | PUT | `/api/account/ioLensWidget/getWidgetData` | `iosense.service.ts` → `getWidgetData()` |

## Event Flow
| FunctionID | Method | Endpoint | Used In |
|---|---|---|---|
| `getAllEventCategory` | GET | `/api/account/enms/eventCategory` | `iosense.service.ts` → `getAllEventCategories()` |
| `getEventLogsByTimeRange` | PUT | `/api/account/enms/eventLogger/{page}/{count}` | `iosense.service.ts` → `getEventLogs()` |

## Custom Table Flow
| FunctionID | Method | Endpoint | Used In |
|---|---|---|---|
| `getCustomTableDeviceRow` | POST | `/api/account/table/getRows3` | `iosense.service.ts` → `getCustomTableRows()` |

**Usage in MachineTimeline.tsx:**
1. `getCustomTableRows("Hamilton_Master", 1, 100)` → D3 = machine name, D4 = device ID → populate dropdown
2. On machine select → D4 device ID → `getDeviceMetadata(D4)` → filter sensors where `params[sensor].t = "1"` → dynamic column headers
3. `getCustomTableRows(D4, page, limit)` → populate table rows with server-side pagination

## Integration Flows
1. **Auth → Devices → Widget Data**: `validateSSOToken` → `findUserDevices` → `getDeviceSpecificMetadata` → `getWidgetData`
2. **Auth → Events**: `validateSSOToken` → `getAllEventCategory` → `getEventLogsByTimeRange`
3. **Auth → Machine Timeline**: `validateSSOToken` → `getCustomTableDeviceRow(Hamilton_Master)` → D3/D4 mapping → `getDeviceSpecificMetadata(D4)` → `getCustomTableDeviceRow(D4, page, limit)`
