import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const sampleLeads = [
  {
    name: "Sarah Mitchell",
    email: "sarah.mitchell@email.com",
    phone: "(206) 555-1234",
    status: "Tour Completed",
    moveInDate: "2025-12-01",
    unitType: "2 Bedroom",
    occupants: 2,
    pets: "1 small dog (corgi)",
    notes: "Very interested in top floor unit. Works from home 3 days/week. Needs good lighting.",
    address: "4521 Pine St, Seattle, WA 98101",
    employer: "Microsoft",
    moveReason: "Upsizing"
  },
  {
    name: "Marcus Chen",
    email: "mchen92@email.com",
    phone: "(425) 555-5678",
    status: "Leased",
    moveInDate: "2025-01-15",
    unitType: "1 Bedroom",
    occupants: 1,
    pets: "None",
    notes: "Signed 12-month lease. Paid first, last, and deposit. Works at Amazon.",
    address: "8923 Bellevue Way, Bellevue, WA 98004",
    employer: "Amazon",
    moveReason: "Job Relocation"
  },
  {
    name: "Jennifer Davis",
    email: "jdavis.seattle@email.com",
    phone: "(206) 555-9012",
    status: "New Inquiry",
    moveInDate: "2025-11-11",
    unitType: "Studio",
    occupants: 1,
    pets: "2 cats",
    notes: "First-time renter, graduating from UW. Parent co-signer available.",
    address: "UW Dorms, Seattle, WA 98195",
    employer: "Graduate Student - UW",
    moveReason: "First Time Renter"
  },
  {
    name: "Ken Doll",
    email: "mymansion@email.com",
    phone: "(425) 986-1238",
    status: "Leased Elsewhere",
    moveInDate: "2025-12-31",
    unitType: "3 Bedroom",
    occupants: 4,
    pets: "None",
    notes: "Chose competitor property due to closer proximity to kids' school.",
    address: "7823 Malibu Dr, Kirkland, WA 98033",
    employer: "Boeing",
    moveReason: "Downsizing"
  },
  {
    name: "Ben Jamin",
    email: "beninseattle@email.com",
    phone: "(206) 555-0921",
    status: "Search Hold",
    moveInDate: "2026-05-01",
    unitType: "Studio",
    occupants: 1,
    pets: "None",
    notes: "Waiting for current lease to end. Very price-conscious. Interested in any move-in specials.",
    address: "2341 Capitol Hill Ave, Seattle, WA 98122",
    employer: "Freelance Designer",
    moveReason: "Other"
  },
  {
    name: "Robert & Amy Johnson",
    email: "johnson.family@email.com",
    phone: "(425) 555-0154",
    status: "Tour Completed",
    moveInDate: "2025-03-01",
    unitType: "3 Bedroom",
    occupants: 4,
    pets: "1 golden retriever",
    notes: "Family of 4 (2 kids ages 8 and 12). Need ground floor, good schools nearby. Toured Unit 105.",
    address: "5612 Redmond Way, Redmond, WA 98052",
    employer: "T-Mobile / Seattle Children's Hospital",
    moveReason: "Upsizing"
  },
  {
    name: "Alex Rivera",
    email: "arivera.seattle@gmail.com",
    phone: "(206) 555-0121",
    status: "New Inquiry",
    moveInDate: "2025-02-15",
    unitType: "1 Bedroom",
    occupants: 1,
    pets: "1 cat",
    notes: "Prefers units with balcony. Flexible on move-in date. Works night shifts.",
    address: "3421 Aurora Ave N, Seattle, WA 98103",
    employer: "Swedish Medical Center",
    moveReason: "Closer to Work"
  },
  {
    name: "David Park",
    email: "dpark89@outlook.com",
    phone: "(425) 555-0189",
    status: "Contacted",
    moveInDate: "2025-01-30",
    unitType: "2 Bedroom",
    occupants: 2,
    pets: "None",
    notes: "Moving in with partner. Both work in tech. Interested in parking availability.",
    address: "9821 Lake City Way, Seattle, WA 98125",
    employer: "Meta",
    moveReason: "Job Relocation"
  },
  {
    name: "Lisa Thompson",
    email: "lisa.thompson@uw.edu",
    phone: "(206) 555-0167",
    status: "Leased",
    moveInDate: "2024-12-01",
    unitType: "Studio",
    occupants: 1,
    pets: "None",
    notes: "Current resident since Dec 1. Excellent payment history. Studying medicine at UW.",
    address: "Unit 203, Your Building",
    employer: "UW Medical Resident",
    moveReason: "First Time Renter"
  },
  // Adding a few more for variety
  {
    name: "Emily Rodriguez",
    email: "emily.r@gmail.com",
    phone: "(206) 555-0143",
    status: "Application Submitted",
    moveInDate: "2025-01-20",
    unitType: "1 Bedroom",
    occupants: 1,
    pets: "1 rabbit",
    notes: "Application pending background check. Excellent credit score 780+. References checked.",
    address: "6734 Greenwood Ave, Seattle, WA 98103",
    employer: "Starbucks Corporate",
    moveReason: "Downsizing"
  },
  {
    name: "Michael Foster",
    email: "mfoster2025@outlook.com",
    phone: "(425) 555-0198",
    status: "Tour Scheduled",
    moveInDate: "2025-02-01",
    unitType: "2 Bedroom",
    occupants: 3,
    pets: "2 small dogs",
    notes: "Tour scheduled for this Saturday 2pm. Bringing roommates. Need 2 parking spots.",
    address: "4521 Bothell Way, Bothell, WA 98011",
    employer: "Boeing",
    moveReason: "Closer to Work"
  },
  {
    name: "Christina Lee",
    email: "clee.seattle@gmail.com",
    phone: "(206) 555-0176",
    status: "Approved",
    moveInDate: "2025-01-25",
    unitType: "Studio",
    occupants: 1,
    pets: "None",
    notes: "Approved! Waiting for lease signing appointment. Wants Unit 308 specifically.",
    address: "8234 University Way, Seattle, WA 98105",
    employer: "Google",
    moveReason: "Job Relocation"
  }
];

export async function seedDatabase() {
  console.log("Starting database seed...");
  
  for (const lead of sampleLeads) {
    try {
      const docRef = await addDoc(collection(db, 'leads'), lead);
      console.log(`✓ Added ${lead.name} with ID: ${docRef.id}`);
    } catch (error) {
      console.error(`✗ Error adding ${lead.name}:`, error);
    }
  }
  
  console.log("Database seeding complete! Added " + sampleLeads.length + " leads.");
}

// // Uncomment the line below to run the seed when this file is imported


