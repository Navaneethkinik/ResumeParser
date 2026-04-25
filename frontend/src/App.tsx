import React, { useState, useRef } from 'react';
import { api, ResumeData, BatchResult } from './services/api';
import { UploadCloud, FileText, Settings, Download, Loader2, CheckCircle, AlertCircle, File, LayoutDashboard, Database, Briefcase, GraduationCap, Code, Eye, Plus, X } from 'lucide-react';

export default function App() {
  const [provider, setProvider] = useState<string>('');
  const [model, setModel] = useState<string>('');
  
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [singleResult, setSingleResult] = useState<ResumeData | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [selectedBatchResult, setSelectedBatchResult] = useState<ResumeData | null>(null);
  const [showRaw, setShowRaw] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    setSingleResult(null);
    setBatchResults([]);
    setSelectedBatchResult(null);

    try {
      if (files.length === 1) {
        const res = await api.parseResume(files[0], provider || undefined, model || undefined);
        setSingleResult(res.data);
        setIsLoading(false);
      } else {
        const initialRes = await api.parseBatch(files, provider || undefined, model || undefined);
        const jobId = initialRes.job_id;
        
        // Polling logic
        const poll = async () => {
          try {
            const statusRes = await api.checkBatchStatus(jobId);
            if (statusRes.status === 'completed' || statusRes.status === 'SUCCESS') {
              setBatchResults(statusRes.results || []);
              setIsLoading(false);
            } else if (statusRes.status === 'failed' || statusRes.status === 'FAILURE') {
              throw new Error(statusRes.error || 'Batch processing failed');
            } else {
              // Still processing, poll again in 1s
              setTimeout(poll, 1000);
            }
          } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
          }
        };
        
        poll();
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <header className="header-content" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.75rem', borderRadius: '12px' }}>
            <FileText size={28} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>ResumeParser AI</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Extract structured data instantly</p>
          </div>
        </div>
      </header>

      <div className="app-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        
        {/* Sidebar Controls */}
        <aside className="side-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <Database size={18} /> Stats
            </h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Files selected: {files.length}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <Settings size={18} /> Configuration
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Provider Override</label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                title="Select which AI provider to use for parsing (overrides your environment settings)"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
              >
                <option value="">Default (Settings)</option>
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq Llama</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Model Override</label>
              <input 
                type="text" 
                placeholder="e.g. gemini-1.5-flash"
                title="Enter a specific model ID (e.g., gemini-1.5-pro) to override the default"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
              />
            </div>
          </div>

        </aside>

        {/* Main Content Area */}
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Upload Zone */}
          <div 
            className={`glass-panel upload-zone ${isDragging ? 'animate-pulse-border' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            title="Click to select files from your computer, or drag and drop them here"
            style={{ 
              textAlign: 'center', 
              border: isDragging ? '2px dashed var(--accent-1)' : '2px dashed var(--glass-border)',
              transition: 'var(--transition)',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              multiple
              accept=".pdf,.docx,.txt"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            
            {files.length === 0 ? (
              <>
                <UploadCloud size={48} color="var(--accent-1)" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Drag & Drop Resumes Here</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>or click to browse files (.pdf, .docx, .txt)</p>
              </>
            ) : (
              <div style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FileText size={18} /> {files.length} Files Ready to Parse
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                  {files.map((f, i) => (
                    <div key={i} className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--glass-border)' }}>
                      <File size={14} color="var(--text-secondary)" /> 
                      <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <button 
                        onClick={() => removeFile(i)} 
                        title="Remove this file"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  <div 
                    style={{ 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '12px', 
                      fontSize: '0.85rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      border: '1px dashed var(--accent-1)',
                      color: 'var(--accent-1)',
                      cursor: 'pointer'
                    }}
                    title="Add more resumes to the batch"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus size={14} /> Add more
                  </div>
                </div>
              </div>
            )}
            
            {files.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <button 
                  className="btn btn-primary animate-fade-in" 
                  onClick={(e) => { e.stopPropagation(); handleProcess(); }}
                  disabled={isLoading}
                  title={isLoading ? "Processing files..." : "Upload and analyze all selected resumes"}
                  style={{ padding: '1rem 4rem', fontSize: '1.1rem', borderRadius: '12px' }}
                >
                  {isLoading ? <><Loader2 className="animate-spin" /> Processing...</> : 'Start AI Analysis'}
                </button>
                <button 
                  className="btn" 
                  onClick={(e) => { e.stopPropagation(); setFiles([]); setSingleResult(null); setBatchResults([]); }}
                  disabled={isLoading}
                  style={{ marginLeft: '1rem', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="animate-fade-in glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '4px solid #ef4444' }}>
              <AlertCircle color="#ef4444" />
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Results Area */}
          {(singleResult || batchResults.length > 0) && (
            <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
              <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Database color="var(--accent-2)" /> Extraction Results
                </h2>                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedBatchResult && (
                    <button 
                      className="btn" 
                      onClick={() => setSelectedBatchResult(null)}
                      title="Return to the list of all processed resumes"
                    >
                      Back to List
                    </button>
                  )}
                  <button 
                    className="btn"
                    title="Download the full extraction data as a JSON file"
                    onClick={() => downloadJson(selectedBatchResult || (batchResults.length > 0 ? batchResults : singleResult), `resume_data_${Date.now()}.json`)}
                  >
                    <Download size={18} /> Export JSON
                  </button>
                </div>
              </div>

              <div className="results-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Raw JSON View (Default & Left Column) */}
                <div className="animate-fade-in" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'auto', maxHeight: '800px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Raw Response</h3>
                    <Code size={16} color="var(--accent-1)" />
                  </div>
                  <pre style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-1)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(selectedBatchResult || (batchResults.length > 0 ? batchResults : singleResult), null, 2)}
                  </pre>
                </div>

                {/* Visual View (Right Column) */}
                <div className="animate-fade-in">
                  {/* Detailed Visual View (Used for single parse OR when a batch item is selected) */}
                  {(singleResult || selectedBatchResult) && (() => {
                    const currentResult = selectedBatchResult || singleResult;
                    if (!currentResult) return null;

                    return (
                      <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Candidate Name & Contact Info Card */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <h1 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem', color: 'var(--accent-1)' }}>{currentResult.name || 'Anonymous'}</h1>
                          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Contact Information</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {(() => {
                              const c = currentResult.contact || {};
                              const linkKeys = ['linkedin', 'github', 'website'];
                              const labelMap: Record<string, string> = { linkedin: 'LinkedIn', github: 'GitHub', website: 'Website', email: 'Email', phone: 'Phone', location: 'Location' };
                              return (Object.entries(c) as [string, string][])
                                .filter(([, v]) => !!v)
                                .map(([key, val]) => (
                                  <div key={key}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem 0' }}>{labelMap[key] || key}</p>
                                    {linkKeys.includes(key) ? (
                                      <a
                                        href={val.startsWith('http') ? val : `https://${val}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ margin: 0, fontWeight: 500, fontSize: '0.85rem', color: 'var(--accent-1)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
                                      >
                                        {val}
                                      </a>
                                    ) : (
                                      <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</p>
                                    )}
                                  </div>
                                ));
                            })()}
                          </div>
                        </div>

                      {/* Experience */}
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Briefcase size={14} /> Experience
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          {Array.isArray(currentResult.experience) && currentResult.experience.length > 0 ? (
                            currentResult.experience.map((exp, i) => (
                              <div key={i}>
                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent-1)', fontSize: '0.95rem' }}>{exp.title}</p>
                                <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>{exp.company} • <span style={{ color: 'var(--text-secondary)' }}>{exp.start_date || 'N/A'} - {exp.end_date || 'Present'}</span></p>
                                {Array.isArray(exp.description) && exp.description.length > 0 && (
                                  <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {exp.description.map((desc, di) => <li key={di}>{desc}</li>)}
                                  </ul>
                                )}
                              </div>
                            ))
                          ) : <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No experience listed.</p>}
                        </div>
                      </div>

                      {/* Education */}
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <GraduationCap size={14} /> Education
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {Array.isArray(currentResult.education) && currentResult.education.map((edu, i) => (
                            <div key={i}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{edu.degree || 'Degree'}</p>
                              <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: 'var(--accent-2)' }}>{edu.institution}</p>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {edu.fieldOfStudy} {edu.graduationYear ? `(${edu.graduationYear})` : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                        {/* Skills */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Skills</h3>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {Array.isArray(currentResult.skills) && currentResult.skills.map((skill, i) => (
                              <span key={i} style={{ background: 'var(--bg-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--glass-border)' }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Projects */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Projects</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Array.isArray(currentResult.projects) && currentResult.projects.map((proj: any, i) => (
                              <div key={i}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-1)' }}>{typeof proj === 'object' ? proj.name : String(proj)}</p>
                                {typeof proj === 'object' && proj.description && <p style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>{proj.description}</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Certifications */}
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Certifications</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {Array.isArray(currentResult.certifications) && currentResult.certifications.map((cert, i) => (
                              <p key={i} style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {cert}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Batch Result List View (Shown when multiple files processed and NO single result is selected) */}
                  {batchResults.length > 0 && !selectedBatchResult && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {batchResults.map((res, i) => (
                        <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {res.status === 'success' ? <CheckCircle size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{res.filename}</p>
                              {res.status === 'success' && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Successfully Extracted</p>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {res.status === 'success' && (
                              <button 
                                className="btn" 
                                style={{ padding: '0.4rem', borderRadius: '8px' }}
                                title="View detailed analysis for this resume"
                                onClick={() => setSelectedBatchResult(res.data || null)}
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            <button 
                              className="btn" 
                              style={{ padding: '0.4rem', borderRadius: '8px' }}
                              title="Download JSON for this resume"
                              onClick={() => downloadJson(res.data, `${res.filename}.json`)}
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
