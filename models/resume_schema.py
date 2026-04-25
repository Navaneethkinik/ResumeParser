from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class ContactInfo(BaseModel):
    model_config = ConfigDict(extra='ignore')
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None

class Experience(BaseModel):
    model_config = ConfigDict(extra='ignore')
    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: List[str] = Field(default_factory=list)

class Education(BaseModel):
    model_config = ConfigDict(extra='ignore')
    institution: str
    degree: Optional[str] = None
    fieldOfStudy: Optional[str] = None
    graduationYear: Optional[str] = None
    minor: Optional[str] = None
    cgpa: Optional[float] = None
    score: Optional[float] = None

class Project(BaseModel):
    model_config = ConfigDict(extra='ignore')
    name: str
    description: str = ""

class ResumeData(BaseModel):
    model_config = ConfigDict(extra='ignore')
    name: Optional[str] = None
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: Optional[str] = None
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
