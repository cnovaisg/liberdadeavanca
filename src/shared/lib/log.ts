type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, string | number | boolean | undefined | null>;

/**
 * Structured JSON logs for Vercel Runtime Logs / drains.
 * Stable `event` names make alerting and log search reliable.
 */
function emit(level: LogLevel, event: string, fields?: LogFields) {
	const payload = {
		level,
		event,
		...fields,
		ts: new Date().toISOString(),
	};
	const line = JSON.stringify(payload);
	if (level === "error") console.error(line);
	else if (level === "warn") console.warn(line);
	else console.info(line);
}

export const log = {
	info: (event: string, fields?: LogFields) => emit("info", event, fields),
	warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
	error: (event: string, fields?: LogFields) => emit("error", event, fields),
};
