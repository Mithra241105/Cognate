export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    
    const headers = new Headers(options.headers || {});
    
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    
    const response = await fetch(url, {
        ...options,
        "headers": headers
    });
    
    if (response.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        }
    }
    
    return response;
}
