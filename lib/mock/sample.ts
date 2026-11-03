/**
 * Demo data for building the UI before a database exists.
 * All companies and people are made up. Delete this once real data flows.
 */
import { isoDaysAgo as iso } from "@/lib/dates";
import type { AppData } from "@/lib/types";

export const DEMO_NAME = "Jordan Avery";

export const SAMPLE: AppData = {
  apps: [
    { id: "1", company: "Northwind Media", role: "Brand Coordinator", location: "Boston, MA", status: "Applied", dateApplied: iso(9), lastActivity: iso(9), notes: "Hiring manager is Alex Kim." },
    { id: "2", company: "Juniper & Co.", role: "Marketing Associate", location: "New York, NY", status: "Interviewing", dateApplied: iso(18), lastActivity: iso(2), notes: "Second-round interview Thursday with the brand team." },
    { id: "3", company: "Fieldhouse Agency", role: "Account Coordinator", location: "Remote", status: "Applied", dateApplied: iso(4), lastActivity: iso(4), notes: "Marcus referred me." },
    { id: "4", company: "Harbor Goods", role: "Social Media Specialist", location: "Chicago, IL", status: "Researching", notes: "Strong brand voice on TikTok. Apply by Friday." },
    { id: "5", company: "Saltbox Coffee", role: "Brand Marketing Associate", location: "Portland, OR", status: "Offer", dateApplied: iso(32), lastActivity: iso(1), notes: "Offer received. Decision due next Wednesday." },
    { id: "6", company: "Cobalt Studios", role: "Junior Strategist", location: "Boston, MA", status: "Interviewing", dateApplied: iso(12), lastActivity: iso(3), notes: "Take-home brief due Monday." },
    { id: "7", company: "Meridian Outdoors", role: "Brand Activation Coordinator", location: "Denver, CO", status: "Applied", dateApplied: iso(11), lastActivity: iso(11) },
    { id: "8", company: "Pinecrest Pet Co.", role: "Marketing Coordinator", location: "Boston, MA", status: "Applied", dateApplied: iso(2), lastActivity: iso(2), notes: "Applied through Dana's intro." },
    { id: "9", company: "Lumen Health", role: "Marketing Coordinator", location: "Cambridge, MA", status: "Rejected", dateApplied: iso(26), lastActivity: iso(13) },
    { id: "10", company: "Brightside Events", role: "Events and Partnerships Associate", location: "New York, NY", status: "Researching" },
    { id: "11", company: "Atlas Outfitters", role: "Events Associate", location: "Remote", status: "Archived", dateApplied: iso(45), notes: "No response after six weeks." },
    { id: "12", company: "Copper Lane Media", role: "Media Coordinator", location: "Boston, MA", status: "Archived", dateApplied: iso(50), notes: "Posting closed." },
  ],
  people: [
    { id: "c1", name: "Priya Shah", relationship: "Recruiter", org: "Juniper & Co.", nextStep: "Send a thank-you note after Thursday's interview" },
    { id: "c2", name: "Marcus Lee", relationship: "Alumni, class of 2022", org: "Fieldhouse Agency", nextStep: "Thank him for the referral" },
    { id: "c3", name: "Sam Patel", relationship: "Friend", org: "Juniper & Co." },
    { id: "c4", name: "Dana Ortiz", relationship: "Former manager", org: "Pinecrest Pet Co.", nextStep: "Ask if she'd be a reference" },
    { id: "c5", name: "Alex Kim", relationship: "Hiring manager", org: "Northwind Media" },
    { id: "c6", name: "Riley Chen", relationship: "Career advisor", org: "Northeastern University", nextStep: "Book a mock interview before Cobalt" },
    { id: "c7", name: "Jamie Brooks", relationship: "Met at a marketing meetup", org: "Cobalt Studios" },
  ],
  companies: [
    { id: "k1", name: "Harbor Goods", category: "Consumer brands", priority: "High", state: "Ready to apply" },
    { id: "k2", name: "Brightside Events", category: "Experiential agency", priority: "Medium", state: "Researching" },
    { id: "k3", name: "Saltbox Coffee", category: "Food and beverage", priority: "High", state: "Applied" },
    { id: "k4", name: "Evergreen Athletics", category: "Sportswear", priority: "High", state: "Researching" },
    { id: "k5", name: "Paper Kite Agency", category: "Advertising agency", priority: "Low", state: "Not a fit" },
  ],
  career: { company: "Saltbox Coffee", title: "Brand Marketing Associate (offer)", next: "Brand Manager in two years" },
  goals: [
    { id: "g1", text: "Build a portfolio of three campaign case studies", done: true },
    { id: "g2", text: "Get a Google Analytics certification", done: true },
    { id: "g3", text: "Lead one campaign end to end in my first year", done: false },
    { id: "g4", text: "Meet one new person in the industry each week", done: false },
    { id: "g5", text: "Ask my manager for a six-month growth check-in", done: false },
  ],
};

export const EMPTY: AppData = {
  apps: [],
  people: [],
  companies: [],
  career: { company: "", title: "", next: "" },
  goals: [],
};
