export interface ResumeData {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    linkedin?: string;
    location?: string;
  };
  experience: Array<{
    company: string;
    title: string;
    start_date?: string;
    end_date?: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree?: string;
    fieldOfStudy?: string | null;
    graduationYear?: string;
    cgpa?: number | string;
    score?: number | string;
    minor?: string;
  }>;
  skills: string[];
  certifications?: string[];
  projects?: Array<{
    name: string;
    description: string;
    skills?: string[];
    url?: string;
  }>;
  languages?: string[];
  summary?: string;
}

export interface ParseResponse {
  status: string;
  data: ResumeData;
}

export interface BatchResult {
  filename: string;
  status: 'success' | 'error';
  data?: ResumeData;
  message?: string;
}

export interface BatchResponse {
  status: string;
  results: BatchResult[];
}

export const api = {
  parseResume: async (file: File, provider?: string, model?: string): Promise<ParseResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    let url = '/api/v1/parse-resume';
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (model) params.append('model', model);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || 'Failed to parse resume');
    }

    return response.json();
  },

  parseBatch: async (files: File[], provider?: string, model?: string): Promise<BatchResponse> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    let url = '/api/v1/parse-batch';
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (model) params.append('model', model);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || 'Failed to parse batch');
    }

    return response.json();
  }
};
