type FetchOptions = RequestInit & {
    data?: any;
};

async function fetchAPI(endpoint: string, { data, headers: customHeaders, ...customConfig }: FetchOptions = {}) {
    // Automatically set JSON headers
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    const config: RequestInit = {
        method: data ? 'POST' : 'GET',
        body: data ? JSON.stringify(data) : undefined,
        headers,
        ...customConfig,
    };

    try {
        const response = await fetch(endpoint, config);

        // Handle empty responses (like 204 No Content)
        if (response.status === 204) return null;

        // Safely parse JSON
        const responseData = await response.json().catch(() => null);

        // Handle HTTP errors
        if (!response.ok) {
            throw new Error(responseData?.error || responseData?.message || 'An error occurred during the request');
        }

        return responseData;
    } catch (error: any) {
        // Catch network errors or parsing errors and throw a clean message for TanStack Query
        throw new Error(error.message || 'Network error occurred');
    }
}

export const apiClient = {
    get: (endpoint: string, options?: FetchOptions) => fetchAPI(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, data: any, options?: FetchOptions) => fetchAPI(endpoint, { ...options, data, method: 'POST' }),
    put: (endpoint: string, data: any, options?: FetchOptions) => fetchAPI(endpoint, { ...options, data, method: 'PUT' }),
    delete: (endpoint: string, options?: FetchOptions) => fetchAPI(endpoint, { ...options, method: 'DELETE' }),
};
