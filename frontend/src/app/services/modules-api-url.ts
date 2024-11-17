import { HttpHeaders } from "@angular/common/http";

const MOCK_API_DOMAIN = "http://localhost:3000/api";
const BACKEND_API_DOMAIN = "http://127.0.0.1:5000/api";

export function mockApiUrl(path: string) {
    return MOCK_API_DOMAIN + path;
}

export function backApiUrl(path: string) {
    return BACKEND_API_DOMAIN + path;
}

// Helper method to create authorization headers with the stored token
export function createAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }
