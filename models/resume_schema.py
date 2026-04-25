from pydantic import BaseModel, Field
from typing import List, Optional

class ContactInfo(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    location: Optional[str] = None

class Experience(BaseModel):
    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: List[str] = Field(default_factory=list)

class Education(BaseModel):
    institution: str
    degree: Optional[str] = None
    fieldOfStudy: Optional[str] = None
    graduationYear: Optional[str] = None
    minor: Optional[str] = None
    cgpa: Optional[float] = None
    score: Optional[float] = None

class Project(BaseModel):
    name: str
    description: str
    skills: List[str] = Field(default_factory=list)

class ResumeData(BaseModel):
    name: Optional[str] = None
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: Optional[str] = None
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
