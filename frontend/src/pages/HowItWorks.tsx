import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, Heart, FileText, CheckCircle2, 
  ArrowRight, Users, Sparkles, Building2, HelpCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthModal } from "@/features/auth/AuthModal";

export function HowItWorks() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const faqs = [
    {
      q: "How does NobleNet verify non-profit organizations?",
      a: "Every NGO on NobleNet undergoes a strict 4-point verification process: (1) Government registration under Societies, Trusts, or Section 8 Company Act, (2) NITI Aayog NGO Darpan ID verification, (3) 12A and 80G tax-exemption validation, and (4) Direct legal bank account verification."
    },
    {
      q: "Can I claim tax deduction under Section 80G for my donations?",
      a: "Yes! For all donations made to 80G-certified campaigns on NobleNet, an automated 80G compliant receipt with official registration details is generated immediately and stored in your profile under Donation History."
    },
    {
      q: "Are there any hidden platform fees taken from donations?",
      a: "No. 100% of your net campaign donation reaches the verified NGO partner. Transparent payment gateway processing fees (Razorpay standard rates) are clearly itemized with zero surprise deductions."
    },
    {
      q: "How do wishlist item donations work?",
      a: "NGOs list exact items needed (e.g. school bags, dry ration kits, blankets). Donors pledge the items, and our delivery partner routes them directly to the NGO's registered physical center with live tracking."
    },
    {
      q: "How do I become a verified volunteer?",
      a: "Browse open volunteer opportunities, click 'Apply to Volunteer', submit your contact details and available dates. Once the NGO approves your application, you will receive event details and coordinates."
    }
  ];

  return (
    <div className="pb-20 bg-neutral-50/40 min-h-screen">
      {/* Hero Header */}
      <section className="bg-white border-b border-neutral-200/80 pt-14 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-primary px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="w-4 h-4" /> Trusted Giving Ecosystem
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight">
            How NobleNet Works
          </h1>
          <p className="text-neutral-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            A transparent, verified, and direct bridge connecting generous donors, passionate volunteers, and impactful Indian non-profits.
          </p>
        </div>
      </section>

      {/* Tabs Guide for Donors, NGOs, Volunteers */}
      <section className="container mx-auto px-4 max-w-5xl pt-12">
        <Tabs defaultValue="donors" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-white border border-neutral-200 p-1 rounded-2xl h-12">
              <TabsTrigger value="donors" className="rounded-xl px-6 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
                For Donors
              </TabsTrigger>
              <TabsTrigger value="ngos" className="rounded-xl px-6 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
                For NGOs
              </TabsTrigger>
              <TabsTrigger value="volunteers" className="rounded-xl px-6 font-semibold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
                For Volunteers
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Donors Tab */}
          <TabsContent value="donors" className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  1
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Discover & Choose</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Browse vetted campaigns across healthcare, education, hunger relief, and animal welfare. View verified documentation and organizer credentials.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  2
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Donate Securely</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Contribute via UPI, NetBanking, Cards, or digital wallets through our Razorpay integration. All transactions are encrypted and audited.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  3
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Get 80G Receipt</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Download your tax-exemption certificate instantly and follow real-time campaign milestones, receipts, and field photo updates.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* NGOs Tab */}
          <TabsContent value="ngos" className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  1
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Register & Get Verified</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Submit your organization details, Darpan registration number, 80G certification, and bank account for Super Admin verification.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  2
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Launch Fundraisers & Drives</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Publish fundraising campaigns, post emergency item wishlists, or create volunteer mobilization opportunities directly from your dashboard.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  3
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Engage & Report</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Receive direct settlement to verified bank accounts. Post updates to your donors and volunteers to foster lifelong community relationships.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Volunteers Tab */}
          <TabsContent value="volunteers" className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  1
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Browse Drives</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Search volunteer opportunities by skill (teaching, logistics, health, operations), date, and city across verified NGOs.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  2
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Apply in 1-Click</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Submit your volunteer application with your phone number and availability. Receive real-time approval status notifications.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-base">
                  3
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">Build Your Impact</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Participate on the ground, log completed hours, and build a verified social impact track record inside your NobleNet profile.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Frequently Asked Questions */}
      <section className="container mx-auto px-4 max-w-4xl pt-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4" /> Got Questions?
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
              <h3 className="font-bold text-neutral-900 text-base mb-2">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 max-w-4xl pt-16">
        <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
            Be part of the movement.
          </h3>
          <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto">
            Whether giving 100 rupees, 2 hours of your weekend, or a box of stationery — your contribution creates ripple effects.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/explore">
              <Button size="lg" className="h-12 px-8 text-base font-semibold rounded-xl cursor-pointer">
                Explore Causes
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-8 text-base font-semibold rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white cursor-pointer"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In or Register
            </Button>
          </div>
        </div>
      </section>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
