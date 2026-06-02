/** Read file as base64 for JSON upload (Netlify-safe, under 6 MB). */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file."));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

/** Keep under Netlify ~8MB POST limit (base64 expands ~33%). */
export const JSON_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
