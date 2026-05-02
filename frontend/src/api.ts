const API_BASE = import.meta.env.VITE_API_URL ?? "";

export const api = (path: string) => `${API_BASE}${path}`;

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export class HttpError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
  }
}

export const jsonFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new HttpError(res.status);
  return res.json();
};
