// lib/api.ts
// Central place for backend API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'; // Use env var or default to relative path

/**
 * Generic fetch wrapper to handle common cases like JSON parsing and error handling
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorBody: any = null;
      try {
        // Attempt to parse error body, might be empty or non-JSON
        errorBody = await response.json();
      } catch (parseError) {
        // Ignore if parsing fails, body might not be JSON
      }
      // Ensure the status code is always part of the thrown error message
      const baseMessage = errorBody?.message || response.statusText;
      const fullErrorMessage = `API Error (${response.status}): ${baseMessage || 'Unknown Error'}`;
      console.error(`API Error (${response.status}) on ${endpoint}:`, errorBody || baseMessage);
      throw new Error(fullErrorMessage); // Throw error with status embedded
    }

    // Handle cases where the response might be empty (e.g., 204 No Content)
    const contentType = response.headers.get("content-type");
    if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
        return undefined as T; // Or handle as appropriate for non-JSON/empty responses
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Network or fetch error on ${endpoint}:`, error);
    // Re-throw the error so TanStack Query can handle it
    throw error;
  }
}

// --- API Function Definitions ---

// Example structure for NPO data (adjust based on actual backend response)
export interface NpoData {
  npoId: string;
  name: string; // Assuming name is part of metadata or fetched separately
  metadataCid: string;
  walletAddress: string;
  reputation?: number; // Optional fields from GET /api/npo/:npoId
  kycStatus?: string;
}

/**
 * Fetch a list of NPOs.
 * Assumes GET /api/npo returns an array of NpoData.
 * Adjust endpoint if needed (e.g., /api/npos).
 */
export const fetchNpos = (): Promise<NpoData[]> => {
  return apiFetch<NpoData[]>('/npo', { method: 'GET' });
};

/**
 * Fetch details for a specific NPO.
 */
export const fetchNpoById = (npoId: string): Promise<NpoData> => {
    return apiFetch<NpoData>(`/npo/${npoId}`, { method: 'GET' });
};

// --- User Role Management ---

export interface UserRoleResponse {
  role: string | null;
}

/**
 * DEVELOPMENT MODE: Mock implementation using localStorage instead of backend API
 * In production, this would call the actual API endpoint
 */
export const fetchUserRole = async (address: string): Promise<UserRoleResponse> => {
  // Check if we're running in a browser environment
  if (typeof window === 'undefined') {
    console.log('Server-side rendering detected, returning null role');
    return { role: null };
  }

  // DEV MODE: Use localStorage to mock user roles
  try {
    // Try to get role from localStorage
    const storedRoles = localStorage.getItem('userRoles');
    if (storedRoles) {
      const roles = JSON.parse(storedRoles);
      if (roles[address]) {
        console.log(`DEV MODE: Found role for ${address} in localStorage:`, roles[address]);
        return { role: roles[address] };
      }
    }
    console.log(`DEV MODE: No role found for ${address} in localStorage`);
    return { role: null }; // No role found for this address
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return { role: null }; // Default to null on any error
  }

  // PRODUCTION MODE would use this:
  // try {
  //   return await apiFetch<UserRoleResponse>(`/user/role/${address}`, { method: 'GET' });
  // } catch (error: any) {
  //   if (error instanceof Error && error.message.startsWith('API Error (404)')) { 
  //     return { role: null }; 
  //   }
  //   throw error;
  // }
};

/**
 * DEVELOPMENT MODE: Mock implementation using localStorage instead of backend API
 * In production, this would call the actual API endpoint
 */
export const setUserRole = async (
    address: string,
    role: string,
    signature: string // Not used in dev mode but kept for API compatibility
): Promise<void> => {
  // Check if we're running in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Cannot set role during server-side rendering');
  }

  // DEV MODE: Use localStorage to store roles
  try {
    // Get existing roles or initialize empty object
    const storedRoles = localStorage.getItem('userRoles');
    const roles = storedRoles ? JSON.parse(storedRoles) : {};
    
    // Set the new role
    roles[address] = role;
    
    // Save back to localStorage
    localStorage.setItem('userRoles', JSON.stringify(roles));
    
    console.log(`DEV MODE: Set role for ${address} to ${role} in localStorage`);
    return; // Success
  } catch (error) {
    console.error("Error setting role in localStorage:", error);
    throw new Error(`Failed to set role in development mode: ${error}`);
  }

  // PRODUCTION MODE would use this:
  // const message = `Assign role: ${role} to address: ${address}`;
  // return apiFetch<void>('/user/role', {
  //   method: 'POST',
  //   body: JSON.stringify({ address, role, message, signature }),
  //   headers: {
  //     'Content-Type': 'application/json'
  //   }
  // });
};

// --- Donation API ---

export interface DonationRequest {
  npoId: string;
  milestoneId?: string; // Optional - if donating to a specific milestone
  amount: string; // Amount in DOT as string
  amountUsd: string; // USD equivalent for reference
  donorAddress: string;
  signature: string;
  message: string; // The message that was signed
}

export interface DonationResponse {
  success: boolean;
  transactionHash?: string;
  message: string;
}

/**
 * Submit a donation to an NPO or a specific milestone
 * Requires a signed message to verify the donation authorization
 */
export const submitDonation = async (params: DonationRequest): Promise<DonationResponse> => {
  // For development mode, simulate a successful donation with localStorage
  if (typeof window !== 'undefined') {
    try {
      // Get existing donations from localStorage or initialize empty array
      const storedDonations = localStorage.getItem('donations');
      const donations = storedDonations ? JSON.parse(storedDonations) : [];
      
      // Create mock transaction hash
      const mockTxHash = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // Add the new donation
      const newDonation = {
        ...params,
        timestamp: new Date().toISOString(),
        transactionHash: mockTxHash
      };
      
      donations.push(newDonation);
      
      // Save back to localStorage
      localStorage.setItem('donations', JSON.stringify(donations));
      
      console.log(`DEV MODE: Recorded donation of ${params.amount} DOT to NPO ${params.npoId}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        transactionHash: mockTxHash,
        message: `Donation of ${params.amount} DOT successfully processed!`
      };
    } catch (error) {
      console.error("Error processing donation in dev mode:", error);
      throw new Error(`Failed to process donation: ${error}`);
    }
  }

  // Handle server-side rendering case
  return {
    success: false,
    message: "Donations cannot be processed during server-side rendering."
  };

  // PRODUCTION MODE would use this:
  // return apiFetch<DonationResponse>('/donation', {
  //   method: 'POST',
  //   body: JSON.stringify(params),
  //   headers: {
  //     'Content-Type': 'application/json'
  //   }
  // });
};

// TODO: Add functions for other endpoints from fronttoback.txt
// E.g., createNpo, createMilestone, fetchMilestones, etc.
// Remember to handle required signatures for POST/PUT/DELETE requests.

export default apiFetch;
