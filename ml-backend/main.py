from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Leasing CRM ML Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "https://leasing-crm.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Pydantic models for request/response
class LeadData(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    status: str
    moveInDate: str
    unitType: str
    occupants: Optional[int] = 1
    pets: Optional[str] = ""
    notes: Optional[str] = ""
    employer: Optional[str] = ""
    moveReason: Optional[str] = ""
    createdAt: Optional[str] = None

class LeadScore(BaseModel):
    lead_id: str
    score: int
    priority: str
    recommended_action: str
    factors: Dict[str, float]

class FollowUpRecommendation(BaseModel):
    lead_id: str
    best_call_times: List[str]
    response_window: str
    recommended_method: str
    urgency_level: str

# Feature engineering functions
def extract_features(lead: LeadData) -> Dict:
    """Extract ML features from lead data"""
    features = {}
    
    # Time-based features
    try:
        move_date = datetime.fromisoformat(lead.moveInDate)
        days_until_move = (move_date - datetime.now()).days
        features['days_until_move'] = max(0, days_until_move)
        features['urgency_score'] = 100 if days_until_move < 30 else 50 if days_until_move < 60 else 20
    except:
        features['days_until_move'] = 90
        features['urgency_score'] = 20
    
    # Status progression features
    status_scores = {
        'New Inquiry': 10,
        'Contacted': 20,
        'Tour Scheduled': 40,
        'Tour Completed': 60,
        'Application Submitted': 80,
        'Approved': 90
    }
    features['status_score'] = status_scores.get(lead.status, 5)
    
    # Engagement features
    features['has_notes'] = 1 if lead.notes and len(lead.notes) > 10 else 0
    features['has_employer'] = 1 if lead.employer else 0
    features['has_move_reason'] = 1 if lead.moveReason else 0
    features['occupants'] = lead.occupants or 1
    
    # Unit type demand (2BR typically the highest demand)
    unit_demand = {
        'Studio': 0.7,
        '1 Bedroom': 0.8,
        '2 Bedroom': 0.9,
        '3 Bedroom': 0.6
    }
    features['unit_demand_factor'] = unit_demand.get(lead.unitType, 0.5)
    
    return features

@app.get("/")
async def root():
    return {"message": "Leasing CRM ML Service", "status": "online"}

@app.post("/api/score-lead", response_model=LeadScore)
async def score_lead(lead: LeadData):
    """
    Score a lead based on multiple factors
    Returns score 0-100 with priority and recommendations
    """
    try:
        features = extract_features(lead)
        
        # Calculate composite score
        score_components = {
            'urgency': features['urgency_score'] * 0.35,
            'engagement': features['status_score'] * 0.30,
            'completeness': (features['has_notes'] + features['has_employer'] + 
                           features['has_move_reason']) * 10 * 0.20,
            'demand': features['unit_demand_factor'] * 100 * 0.15
        }
        
        total_score = int(sum(score_components.values()))
        total_score = min(100, max(0, total_score))  # Clamp between 0-100
        
        # Determine priority
        if total_score >= 75:
            priority = "High"
            action = f"🔥 Hot lead! Call immediately - {lead.name} is ready to move"
        elif total_score >= 50:
            priority = "Medium"
            action = f"📞 Schedule tour ASAP for {lead.unitType}"
        else:
            priority = "Low"
            action = "📧 Send welcome email and add to nurture campaign"
        
        # Specific action refinement based on status
        if lead.status == 'Tour Scheduled':
            action = "📅 Send tour reminder 24hrs before + parking instructions"
        elif lead.status == 'Tour Completed' and total_score > 60:
            action = "📝 Send application link with fee waiver (limited time)"
        elif lead.status == 'Application Submitted':
            action = "⚡ Fast-track application review - high conversion probability"
        
        return LeadScore(
            lead_id=lead.id,
            score=total_score,
            priority=priority,
            recommended_action=action,
            factors=score_components
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimal-followup", response_model=FollowUpRecommendation)
async def get_optimal_followup(lead: LeadData):
    """
    Determine optimal follow-up timing based on inquiry patterns
    """
    try:
        # Get current time info
        now = datetime.now()
        inquiry_time = datetime.fromisoformat(lead.createdAt) if lead.createdAt else now
        inquiry_hour = inquiry_time.hour
        inquiry_day = inquiry_time.weekday()  # 0=Monday, 6=Sunday
        
        # Calculate days since inquiry
        days_since_inquiry = (now - inquiry_time).days
        
        # Determine urgency based on move date
        move_date = datetime.fromisoformat(lead.moveInDate)
        days_until_move = (move_date - now).days
        
        # Urgency classification
        if days_until_move < 30:
            urgency = "Critical"
            response_window = "Within 1 hour"
        elif days_until_move < 60:
            urgency = "High"
            response_window = "Within 2-4 hours"
        else:
            urgency = "Standard"
            response_window = "Within 24 hours"
        
        # Determine best contact times based on patterns
        if inquiry_day >= 5:  # Weekend inquiry
            best_times = [
                "Today 11:00 AM - 1:00 PM",
                "Today 3:00 PM - 6:00 PM"
            ]
            method = "Call directly - weekend inquirers are usually ready to talk"
        elif 9 <= inquiry_hour <= 12:  # Morning inquiry
            best_times = [
                "Today 12:00 PM - 1:00 PM (lunch break)",
                "Today 5:30 PM - 7:00 PM (after work)"
            ]
            method = "Email immediately, call at suggested times"
        elif 12 <= inquiry_hour <= 17:  # Afternoon inquiry
            best_times = [
                "Today 5:00 PM - 7:00 PM",
                "Tomorrow 10:00 AM - 11:00 AM"
            ]
            method = "Email with virtual tour link, follow up with call"
        else:  # Evening/night inquiry
            best_times = [
                "Next business day 10:00 AM - 12:00 PM",
                "Next business day 5:00 PM - 7:00 PM"
            ]
            method = "Email immediately (they're researching), call next day"
        
        # Adjust for lead status
        if lead.status == 'Tour Scheduled':
            best_times = ["24 hours before tour", "Morning of tour"]
            method = "Text reminder preferred, email backup"
        elif lead.status == 'Tour Completed':
            best_times = ["Within 2 hours of tour", "Next morning if evening tour"]
            method = "Thank you text, then call for feedback"
        
        return FollowUpRecommendation(
            lead_id=lead.id,
            best_call_times=best_times,
            response_window=response_window,
            recommended_method=method,
            urgency_level=urgency
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/conversion-factors")
async def get_conversion_factors():
    """
    Analyze which factors correlate most with successful conversions
    """
    try:
        # Fetch historical data from Firestore
        leads_ref = db.collection('leads')
        all_leads = leads_ref.stream()
        
        conversion_analysis = {
            'by_status': {},
            'by_days_until_move': {},
            'by_unit_type': {},
            'total_leads': 0,
            'conversion_rate': 0
        }
        
        status_counts = {}
        unit_counts = {}
        converted_count = 0
        
        for doc in all_leads:
            lead = doc.to_dict()
            conversion_analysis['total_leads'] += 1
            
            # Track by status
            status = lead.get('status', 'Unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Track by unit type
            unit_type = lead.get('unitType', 'Unknown')
            unit_counts[unit_type] = unit_counts.get(unit_type, 0) + 1
            
            # Count conversions
            if status in ['Leased', 'Approved']:
                converted_count += 1
        
        conversion_analysis['by_status'] = status_counts
        conversion_analysis['by_unit_type'] = unit_counts
        conversion_analysis['conversion_rate'] = (
            (converted_count / conversion_analysis['total_leads'] * 100) 
            if conversion_analysis['total_leads'] > 0 else 0
        )
        
        return conversion_analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bulk-score")
async def bulk_score_leads(leads: List[LeadData]):
    """
    Score multiple leads at once for dashboard view
    """
    scores = []
    for lead in leads:
        try:
            score = await score_lead(lead)
            scores.append(score)
        except:
            continue
    
    return {
        "scores": scores,
        "high_priority_count": len([s for s in scores if s.priority == "High"]),
        "medium_priority_count": len([s for s in scores if s.priority == "Medium"]),
        "low_priority_count": len([s for s in scores if s.priority == "Low"])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)