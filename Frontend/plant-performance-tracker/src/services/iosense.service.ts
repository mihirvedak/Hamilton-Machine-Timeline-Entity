/**
 * IOsense API Service
 * Wraps IOsense SDK connector endpoints.
 * All methods require a valid Bearer token from AuthService.
 *
 * FunctionIDs used (tracked in iosense.md):
 *  - validateSSOToken
 *  - findUserDevices
 *  - getDeviceSpecificMetadata
 *  - getWidgetData
 *  - getAllEventCategory
 *  - getEventLogsByTimeRange
 *  - getCustomTableDeviceRow
 */

import { authService } from "./auth.service";

const BASE_URL = "https://connector.iosense.io";

// ── Types ──────────────────────────────────────────────────────────

export interface Device {
  _id: string;
  devID: string;
  devName: string;
  devTypeID: string;
  devTypeName: string;
  iconURL?: string;
  location?: { latitude: number; longitude: number };
  tags?: string[];
  sensors?: { sensorId: string; sensorName: string }[];
  params?: Record<string, unknown>;
  unitSelected?: Record<string, string>;
  properties?: unknown[];
  star?: boolean;
  isHidden?: boolean;
  addedOn?: string;
  timeCreated?: string;
}

export interface DevicesResponse {
  success: boolean;
  totalCount: number;
  order: string;
  sort: string;
  data: Device[];
}

export interface WidgetDataConfig {
  type: "device" | "cluster" | "compute";
  devID?: string;
  sensor?: string;
  operator: string;
  key: string;
  downscale?: number;
  dataPrecision?: number;
  clusterID?: string;
  clusterOperator?: string;
}

export interface WidgetDataRequest {
  startTime: number;
  endTime: number;
  timezone: string;
  timeBucket: string[];
  timeFrame: string;
  type?: string;
  cycleTime?: string;
  config: WidgetDataConfig[];
}

export interface WidgetDataResponse {
  success: boolean;
  data: Record<string, Record<string, Array<{
    type: string;
    devID: string;
    sensor: string;
    operator: string;
    key: string;
    data: string | number;
    shift?: number;
  }>>>;
  comparisonData?: Record<string, unknown>;
  errors?: string[];
}

export interface EventCategory {
  _id: string;
  name: string;
  [key: string]: unknown;
}

export interface EventLog {
  _id: string;
  isRead: string;
  eventTags: string[];
  remarks: unknown[];
  devID: string;
  message: string;
  notifExp: unknown | null;
  triggerDuration: number;
  createdOn: string;
  day: string;
  date: string;
  time: string;
  remark: unknown[];
  idleFrom: string;
  idleTill: string;
}

export interface EventLogsResponse {
  success: boolean;
  data: {
    totalCount: number;
    data: EventLog[];
  };
}

export interface CustomTableRow {
  _id: string;
  devID: string;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomTableResponse {
  success: boolean;
  data: {
    totalCount: number;
    rows: CustomTableRow[];
  };
}

// ── Helper ─────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  const org = authService.getOrganisation();

  return {
    "Content-Type": "application/json",
    Authorization: token,
    "ngsw-bypass": "true",
    ...(org ? { organisation: org } : {}),
  };
}

async function request<T>(
  url: string,
  method: "GET" | "PUT" | "POST",
  body?: unknown
): Promise<T> {
  const headers = getAuthHeaders();

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IOsense API error ${res.status}: ${text}`);
  }

  return res.json();
}

// ── API Methods ────────────────────────────────────────────────────

/**
 * findUserDevices — Retrieves paginated list of user devices.
 * FunctionID: findUserDevices
 */
export async function findUserDevices(
  skip = 1,
  limit = 50,
  search?: { all?: string[]; devName?: string[]; tags?: string[] },
  sort: "AtoZ" | "ZtoA" | "timeCreated" = "AtoZ"
): Promise<DevicesResponse> {
  return request<DevicesResponse>(
    `${BASE_URL}/api/account/devices/${skip}/${limit}`,
    "PUT",
    {
      search: search || {},
      sort,
      order: "default",
      isHidden: false,
    }
  );
}

/**
 * getDeviceSpecificMetadata — Retrieves detailed metadata for a device.
 * FunctionID: getDeviceSpecificMetadata
 */
export interface DeviceMetadataResponse {
  success: boolean;
  data: {
    _id: string;
    devID: string;
    devName: string;
    devTypeID: string;
    devTypeName: string;
    sensors: Array<{ sensorId: string; sensorName: string }>;
    params: Record<string, Array<{ paramName: string; paramValue: unknown }>>;
    unitSelected?: Record<string, string>;
    tags?: string[];
    [key: string]: unknown;
  };
}

export async function getDeviceMetadata(devID: string): Promise<DeviceMetadataResponse> {
  return request<DeviceMetadataResponse>(
    `${BASE_URL}/api/account/ai-sdk/metaData/device/${devID}`,
    "GET"
  );
}

/**
 * getWidgetData — Retrieves aggregated time-series data.
 * FunctionID: getWidgetData
 */
export async function getWidgetData(
  params: WidgetDataRequest
): Promise<WidgetDataResponse> {
  return request<WidgetDataResponse>(
    `${BASE_URL}/api/account/ioLensWidget/getWidgetData`,
    "PUT",
    params
  );
}

/**
 * getAllEventCategory — Gets all event categories.
 * FunctionID: getAllEventCategory
 */
export async function getAllEventCategories(): Promise<{
  success: boolean;
  data: EventCategory[];
}> {
  return request(
    `${BASE_URL}/api/account/enms/eventCategory`,
    "GET"
  );
}

/**
 * getEventLogsByTimeRange — Gets triggered events in a time range.
 * FunctionID: getEventLogsByTimeRange
 */
export async function getEventLogs(
  page: number,
  count: number,
  startTime: string,
  endTime: string,
  timezone = "Asia/Calcutta"
): Promise<EventLogsResponse> {
  return request<EventLogsResponse>(
    `${BASE_URL}/api/account/enms/eventLogger/${page}/${count}`,
    "PUT",
    { startTime, endTime, timezone }
  );
}

/**
 * getCustomTableDeviceRow — Retrieves rows from a CUSTOM_TABLE03 device.
 * FunctionID: getCustomTableDeviceRow
 */
export async function getCustomTableRows(
  devID: string,
  page = 1,
  limit = 100,
  dateRange?: { startTime: string; endTime: string }
): Promise<CustomTableResponse> {
  return request<CustomTableResponse>(
    `${BASE_URL}/api/account/table/getRows3`,
    "PUT",
    {
      devID,
      page,
      limit,
      rawData: true,
      ...(dateRange ? { startTime: dateRange.startTime, endTime: dateRange.endTime } : {}),
    }
  );
}
