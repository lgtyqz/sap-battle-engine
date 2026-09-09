import type { LogService } from '../integrations/log.service';
/** Runtime dependencies are explicit and mandatory in the extracted engine. */
export function coerceLogService(logService: LogService): LogService { return logService; }
