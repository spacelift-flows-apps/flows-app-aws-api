// Recursively convert string timestamp fields to Date objects for AWS SDK compatibility
export function convertTimestamps(obj: any, fields: Set<string>): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj))
    return obj.map((item) => convertTimestamps(item, fields));
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      fields.has(k) && typeof v === "string"
        ? new Date(v)
        : typeof v === "object"
          ? convertTimestamps(v, fields)
          : v,
    ]),
  );
}
