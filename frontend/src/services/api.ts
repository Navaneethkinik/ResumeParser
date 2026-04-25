export interface ResumeData {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    location?: string;
    website?: string;
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

export interface JobResponse {
  status: 'processing' | 'completed' | 'failed' | 'PENDING' | 'SUCCESS' | 'FAILURE';
  job_id: string;
  results?: BatchResult[];
  error?: string;
  message?: string;
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

  parseBatch: async (files: File[], provider?: string, model?: string): Promise<JobResponse> => {
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
      throw new Error(errorData?.detail || 'Failed to start batch processing');
    }

    return response.json();
  },

  checkBatchStatus: async (jobId: string): Promise<JobResponse> => {
    const response = await fetch(`/api/v1/batch/${jobId}`);
    if (!response.ok) {
      throw new Error('Failed to check job status');
    }
    return response.json();
  }
};
