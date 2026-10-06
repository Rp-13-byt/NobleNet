import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import { User, UserRole, UserStatus } from '../modules/users/models/User';
import { NGO, NgoStatus } from '../modules/ngos/models/NGO';
import { Campaign, CampaignStatus } from '../modules/campaigns/models/Campaign';
import { Wishlist, WishlistStatus } from '../modules/wishlists/models/Wishlist';
import { WishlistItem } from '../modules/wishlists/models/WishlistItem';
import { VolunteerOpportunity, OpportunityStatus } from '../modules/volunteering/models/VolunteerOpportunity';
import { ImpactReport } from '../modules/impact/models/ImpactReport';
import { Review } from '../modules/reviews/models/Review';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/noblenet';

async function seed() {
  console.log('🌱 Starting database seed...');
  await mongoose.connect(MONGO_URI);

  await Promise.all([
    User.deleteMany({}),
    NGO.deleteMany({}),
    Campaign.deleteMany({}),
    Wishlist.deleteMany({}),
    WishlistItem.deleteMany({}),
    VolunteerOpportunity.deleteMany({}),
    ImpactReport.deleteMany({}),
    Review.deleteMany({}),
  ]);

  console.log('🧹 Cleaned existing records.');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Super Admin
  await User.create({
    name: 'Super Admin',
    email: 'admin@noblenet.org',
    passwordHash,
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
  });

  // 2. Verified NGO 1
  const ngoUser1 = await User.create({
    name: 'Hope For Children',
    email: 'contact@hopefoundation.org',
    passwordHash,
    role: UserRole.NGO,
    status: UserStatus.ACTIVE,
  });

  const ngo1 = await NGO.create({
    userId: ngoUser1._id,
    organizationName: 'Hope For Children Foundation',
    registrationNumber: 'NGO-DEL-2018-8834',
    description: 'Dedicated to child literacy, nutritional safety, and healthcare in rural India.',
    address: '14 Vasant Kunj, New Delhi 110070',
    contactEmail: 'contact@hopefoundation.org',
    contactPhone: '+91 98112 34567',
    website: 'https://hopefoundation.org',
    documents: ['https://example.com/docs/80g.pdf', 'https://example.com/docs/12a.pdf'],
    status: NgoStatus.VERIFIED,
  });

  // 3. Verified NGO 2
  const ngoUser2 = await User.create({
    name: 'Green Earth Initiative',
    email: 'info@greenearth.org',
    passwordHash,
    role: UserRole.NGO,
    status: UserStatus.ACTIVE,
  });

  const ngo2 = await NGO.create({
    userId: ngoUser2._id,
    organizationName: 'EcoVanguard Green Alliance',
    registrationNumber: 'NGO-BLR-2020-1129',
    description: 'Urban reforestation, lake restoration, and sustainable waste community initiatives.',
    address: '88 Indiranagar, Bengaluru 560038',
    contactEmail: 'info@greenearth.org',
    contactPhone: '+91 80234 56789',
    website: 'https://ecovanguard.org',
    documents: ['https://example.com/docs/fcra.pdf'],
    status: NgoStatus.VERIFIED,
  });

  // 4. Regular User
  const user = await User.create({
    name: 'Priya Patel',
    email: 'priya@example.com',
    passwordHash,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    phone: '+91 98765 43210',
  });

  // 5. Campaigns
  const campaign1 = await Campaign.create({
    ngoId: ngo1._id,
    title: 'Bridge the Tech Gap: Laptops for 100 Rural Girls',
    description: 'Providing digital learning kits and refurbished laptops to girls in rural Rajasthan to prevent school dropout and build future tech skills.',
    goalAmount: 500000,
    raisedAmount: 320500,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    category: 'Education',
    images: ['https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800'],
    status: CampaignStatus.ACTIVE,
  });

  await Campaign.create({
    ngoId: ngo2._id,
    title: 'Bengaluru Lake Revival & 10,000 Tree Canopy Project',
    description: 'Restoring the polluted Varthur lake perimeter with native wetlands filtration systems and planting 10,000 native saplings.',
    goalAmount: 750000,
    raisedAmount: 480000,
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-11-30'),
    category: 'Environment',
    images: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800'],
    status: CampaignStatus.ACTIVE,
  });

  // 6. Wishlists
  const wishlist1 = await Wishlist.create({
    ngoId: ngo1._id,
    title: 'School Supplies & Nutrition Kits for Academic Year 2026',
    description: 'Immediate essentials needed for 250 students starting school this term.',
    status: WishlistStatus.ACTIVE,
  });

  await WishlistItem.insertMany([
    {
      wishlistId: wishlist1._id,
      itemName: 'Comprehensive Science Kits (Class 6-10)',
      category: 'Education',
      requiredQuantity: 50,
      pledgedQuantity: 10,
      fulfilledQuantity: 0,
      priority: 'HIGH',
    },
    {
      wishlistId: wishlist1._id,
      itemName: 'Thermal School Blankets & Sweaters',
      category: 'Clothing',
      requiredQuantity: 100,
      pledgedQuantity: 20,
      fulfilledQuantity: 0,
      priority: 'HIGH',
    },
  ]);

  // 7. Volunteer Opportunities
  await VolunteerOpportunity.create([
    {
      ngoId: ngo1._id,
      title: 'Weekend STEM Mentor & English Conversationalist',
      description: 'Spend 3 hours on Saturday mentoring rural high-school girls in basic coding and conversational English.',
      category: 'Teaching',
      location: 'Hybrid / South Delhi Community Center',
      eventDate: new Date('2026-10-15'),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      requiredSkills: ['English', 'Basic Python / Scratch', 'Patience'],
      requiredVolunteers: 10,
      approvedVolunteers: 1,
      status: OpportunityStatus.OPEN,
    },
    {
      ngoId: ngo2._id,
      title: 'Lake Perimeter Native Tree Planting Drive',
      description: 'Hands-on weekend tree plantation drive. Tools, gloves, and refreshments will be provided.',
      category: 'Environment',
      location: 'Varthur Lake South Gate, Bengaluru',
      eventDate: new Date('2026-09-20'),
      startTime: '07:00 AM',
      endTime: '11:00 AM',
      requiredSkills: ['Physical Fitness', 'Teamwork'],
      requiredVolunteers: 30,
      approvedVolunteers: 18,
      status: OpportunityStatus.OPEN,
    },
  ]);

  // 8. Impact Reports
  await ImpactReport.create({
    ngoId: ngo1._id,
    campaignId: campaign1._id,
    title: 'Q2 Milestone: 45 Laptops Distributed in Alwar District',
    description: 'With community donations, our first batch of 45 refurbished Dell and Lenovo laptops was delivered to the Government Girls High School in Alwar.',
    fundsUsed: 225000,
    beneficiariesReached: 45,
    milestones: ['School computer lab launched', '45 students onboarded'],
    published: true,
  });

  // 9. Verified Reviews
  await Review.create({
    ngoId: ngo1._id,
    userId: user._id,
    rating: 5,
    comment: 'Incredible transparency. I donated ₹2,500 and received regular photo updates of the school computer lab setup. Highly recommend!',
    verifiedContribution: true,
  });

  console.log('✅ Database successfully seeded!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
