import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const strategies = [
  // Phase 1 - Foundation (#1-6)
  { id: 1, name: "Reasonable Compensation", phase: "P1", phase_name: "Foundation", irc_citation: "§3121", description: "Optimize owner salary for FICA savings while maintaining IRS compliance", typical_savings_low: 2300, typical_savings_high: 10000 },
  { id: 2, name: "S-Corp Health Insurance", phase: "P1", phase_name: "Foundation", irc_citation: "§162(l)", description: "Deduct health insurance premiums for S-Corp shareholders", typical_savings_low: 1500, typical_savings_high: 5000 },
  { id: 3, name: "Accountable Plan", phase: "P1", phase_name: "Foundation", irc_citation: "§62(c)", description: "Reimburse employee business expenses tax-free", typical_savings_low: 500, typical_savings_high: 3000 },
  { id: 4, name: "Augusta Rule", phase: "P1", phase_name: "Foundation", irc_citation: "§280A(g)", description: "Rent personal residence to business for up to 14 days tax-free", typical_savings_low: 2000, typical_savings_high: 5000 },
  { id: 5, name: "Asset Reimbursement", phase: "P1", phase_name: "Foundation", irc_citation: "§162", description: "Reimburse employees for business use of personal assets", typical_savings_low: 500, typical_savings_high: 2000 },
  { id: 6, name: "Hiring Kids", phase: "P1", phase_name: "Foundation", irc_citation: "§73", description: "Employ children in legitimate business roles for income shifting", typical_savings_low: 500, typical_savings_high: 5000 },

  // Phase 2 - Core Deductions (#7-13)
  { id: 7, name: "Section 179 Election", phase: "P2", phase_name: "Core Deductions", irc_citation: "§179", description: "Immediately expense qualifying business property", typical_savings_low: 500, typical_savings_high: 5000 },
  { id: 8, name: "Bonus Depreciation", phase: "P2", phase_name: "Core Deductions", irc_citation: "§168(k)", description: "First-year bonus depreciation on qualifying assets", typical_savings_low: 2000, typical_savings_high: 15000 },
  { id: 9, name: "Home Office Deduction", phase: "P2", phase_name: "Core Deductions", irc_citation: "§280A", description: "Deduct expenses for business use of home", typical_savings_low: 1000, typical_savings_high: 3000 },
  { id: 10, name: "Vehicle Strategy", phase: "P2", phase_name: "Core Deductions", irc_citation: "§274", description: "Optimize vehicle deductions using best method", typical_savings_low: 500, typical_savings_high: 5000 },
  { id: 11, name: "QBI Optimization", phase: "P2", phase_name: "Core Deductions", irc_citation: "§199A", description: "Maximize Qualified Business Income deduction", typical_savings_low: 2000, typical_savings_high: 15000 },
  { id: 12, name: "Timing Strategies", phase: "P2", phase_name: "Core Deductions", irc_citation: "§461", description: "Strategic timing of income and deductions", typical_savings_low: 500, typical_savings_high: 5000 },
  { id: 13, name: "Inventory Method Optimization", phase: "P2", phase_name: "Core Deductions", irc_citation: "§263A", description: "Optimize inventory accounting methods", typical_savings_low: 3000, typical_savings_high: 20000 },

  // Phase 3 - Retirement & Benefits (#14-23)
  { id: 14, name: "Solo 401(k)", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§401(k)", description: "Self-employed retirement plan with high contribution limits", typical_savings_low: 5000, typical_savings_high: 20000 },
  { id: 15, name: "Profit Sharing 401(k)", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§401(a)", description: "Employer profit sharing contributions to 401(k)", typical_savings_low: 3000, typical_savings_high: 15000 },
  { id: 16, name: "Cash Balance Plan", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§401(a)", description: "Defined benefit plan with guaranteed returns", typical_savings_low: 20000, typical_savings_high: 100000 },
  { id: 17, name: "Mega Backdoor Roth", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§402(g)", description: "After-tax 401(k) contributions converted to Roth", typical_savings_low: 3000, typical_savings_high: 10000 },
  { id: 18, name: "HSA Triple Tax", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§223", description: "Health Savings Account with triple tax advantage", typical_savings_low: 2000, typical_savings_high: 8000 },
  { id: 19, name: "Backdoor Roth IRA", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§408A", description: "Roth IRA funding for high-income earners", typical_savings_low: 1500, typical_savings_high: 3000 },
  { id: 20, name: "Roth Conversions", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§408A", description: "Strategic conversion of traditional to Roth accounts", typical_savings_low: 5000, typical_savings_high: 50000 },
  { id: 21, name: "Self-Directed Accounts", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§408", description: "Alternative investments in retirement accounts", typical_savings_low: 0, typical_savings_high: 0 },
  { id: 22, name: "QSEHRA/HRA", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§9831", description: "Qualified Small Employer Health Reimbursement", typical_savings_low: 1000, typical_savings_high: 5000 },
  { id: 23, name: "Section 412(e)(3) DB Plan", phase: "P3", phase_name: "Retirement & Benefits", irc_citation: "§412(e)(3)", description: "Fully insured defined benefit plan", typical_savings_low: 20000, typical_savings_high: 200000 },

  // Phase 4 - Credits & Multistate (#24-30)
  { id: 24, name: "R&D Tax Credit", phase: "P4", phase_name: "Credits & Multistate", irc_citation: "§41", description: "Research and Development tax credit", typical_savings_low: 5000, typical_savings_high: 25000 },
  { id: 25, name: "WOTC", phase: "P4", phase_name: "Credits & Multistate", irc_citation: "§51", description: "Work Opportunity Tax Credit for targeted employees", typical_savings_low: 2400, typical_savings_high: 9600 },
  { id: 26, name: "PTET Election", phase: "P4", phase_name: "Credits & Multistate", irc_citation: "State", description: "Pass-Through Entity Tax election for SALT workaround", typical_savings_low: 2000, typical_savings_high: 15000 },
  { id: 27, name: "State Tax Planning", phase: "P4", phase_name: "Credits & Multistate", irc_citation: "Various", description: "Multi-state tax optimization strategies", typical_savings_low: 1000, typical_savings_high: 10000 },
  { id: 28, name: "Energy Credits", phase: "P4", phase_name: "Credits & Multistate", irc_citation: "§30D", description: "Clean energy and vehicle tax credits", typical_savings_low: 1000, typical_savings_high: 7500 },
  { id: 29, name: "IC-DISC", phase: "P4", phase_name: "Credits & Multistate", irc_citation: "§991", description: "Interest Charge Domestic International Sales Corporation", typical_savings_low: 20000, typical_savings_high: 300000 },
  { id: 30, name: "Historic Rehabilitation Credits", phase: "P4", phase_name: "Credits & Multistate", irc_citation: "§47", description: "Credits for rehabilitating historic structures", typical_savings_low: 15000, typical_savings_high: 100000 },

  // Phase 5 - Real Estate & PAL (#31-38)
  { id: 31, name: "RE Professional Status", phase: "P5", phase_name: "Real Estate & PAL", irc_citation: "§469(c)(7)", description: "Real estate professional status for loss deductions", typical_savings_low: 10000, typical_savings_high: 50000 },
  { id: 32, name: "Cost Segregation Study", phase: "P5", phase_name: "Real Estate & PAL", irc_citation: "§168", description: "Accelerate depreciation on building components", typical_savings_low: 15000, typical_savings_high: 75000 },
  { id: 33, name: "STR Loophole", phase: "P5", phase_name: "Real Estate & PAL", irc_citation: "§469", description: "Short-term rental passive activity exception", typical_savings_low: 10000, typical_savings_high: 40000 },
  { id: 34, name: "Self-Rental Loophole", phase: "P5", phase_name: "Real Estate & PAL", irc_citation: "Reg 1.469-2(f)(6)", description: "Recharacterize self-rental income", typical_savings_low: 5000, typical_savings_high: 25000 },
  { id: 35, name: "1031 Exchange", phase: "P5", phase_name: "Real Estate & PAL", irc_citation: "§1031", description: "Like-kind exchange to defer capital gains", typical_savings_low: 20000, typical_savings_high: 100000 },
  { id: 36, name: "PAL Grouping Election", phase: "P5", phase_name: "Real Estate & PAL", irc_citation: "Reg 1.469-4", description: "Group passive activities for material participation", typical_savings_low: 5000, typical_savings_high: 30000 },
  { id: 37, name: "Syndication Loophole", phase: "P5", phase_name: "Real Estate & PAL", irc_citation: "§469(c)(7)", description: "Real estate syndication with professional status", typical_savings_low: 10000, typical_savings_high: 50000 },
  { id: 38, name: "PIGs vs PALs Matching", phase: "P5", phase_name: "Real Estate & PAL", irc_citation: "§469(d)", description: "Match passive income generators with passive losses", typical_savings_low: 20000, typical_savings_high: 80000 },

  // Phase 6 - Acquisitions & Leverage (#39-49)
  { id: 39, name: "Heavy Vehicle Strategy", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§179(b)(5)", description: "Section 179 for vehicles over 6,000 lbs GVWR", typical_savings_low: 8000, typical_savings_high: 25000 },
  { id: 40, name: "Oil & Gas Investments", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§263(c)", description: "Intangible drilling cost deductions", typical_savings_low: 15000, typical_savings_high: 50000 },
  { id: 41, name: "DST Investments", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§1031", description: "Delaware Statutory Trust for 1031 exchanges", typical_savings_low: 10000, typical_savings_high: 50000 },
  { id: 42, name: "Opportunity Zone", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§1400Z-2", description: "Qualified Opportunity Zone investments", typical_savings_low: 10000, typical_savings_high: 75000 },
  { id: 43, name: "Equipment Acquisition", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§179", description: "Strategic equipment purchases for deductions", typical_savings_low: 5000, typical_savings_high: 100000 },
  { id: 44, name: "Captive Insurance (831(b))", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§831(b)", description: "Small captive insurance company strategy", typical_savings_low: 50000, typical_savings_high: 100000 },
  { id: 45, name: "Financed Business Insurance", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§264", description: "Premium financing strategies", typical_savings_low: 10000, typical_savings_high: 40000 },
  { id: 46, name: "Leveraged Technology Purchase", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§163", description: "Financed technology acquisitions", typical_savings_low: 10000, typical_savings_high: 50000 },
  { id: 47, name: "Film & Media Investment", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§181", description: "Qualified film production deductions", typical_savings_low: 15000, typical_savings_high: 200000 },
  { id: 48, name: "Software RTU Investment", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§179", description: "Software right-to-use investments", typical_savings_low: 50000, typical_savings_high: 200000 },
  { id: 49, name: "Leveraged Trading Partnership", phase: "P6", phase_name: "Acquisitions & Leverage", irc_citation: "§704(b)", description: "Partnership trading strategies", typical_savings_low: 50000, typical_savings_high: 200000 },

  // Phase 7 - Exit & Wealth Transfer (#50-59)
  { id: 50, name: "QSBS Exclusion", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§1202", description: "Qualified Small Business Stock gain exclusion", typical_savings_low: 50000, typical_savings_high: 500000 },
  { id: 51, name: "Installment Sale", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§453", description: "Defer gain recognition over payment period", typical_savings_low: 20000, typical_savings_high: 100000 },
  { id: 52, name: "ESOP Exit", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§1042", description: "Employee Stock Ownership Plan exit strategy", typical_savings_low: 50000, typical_savings_high: 250000 },
  { id: 53, name: "CRT Strategy", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§664", description: "Charitable Remainder Trust planning", typical_savings_low: 30000, typical_savings_high: 150000 },
  { id: 54, name: "Family LP/LLC", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§2704", description: "Family limited partnership for wealth transfer", typical_savings_low: 25000, typical_savings_high: 200000 },
  { id: 55, name: "Stepped-Up Basis", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§1014", description: "Basis step-up at death planning", typical_savings_low: 50000, typical_savings_high: 500000 },
  { id: 56, name: "Dynasty Trust", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§2601", description: "Multi-generational wealth transfer trust", typical_savings_low: 50000, typical_savings_high: 500000 },
  { id: 57, name: "Deferred Sales Trust", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§453", description: "Installment sale to trust for tax deferral", typical_savings_low: 50000, typical_savings_high: 140000 },
  { id: 58, name: "Buy-Sell Agreement Planning", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§2703", description: "Business succession buy-sell agreements", typical_savings_low: 20000, typical_savings_high: 75000 },
  { id: 59, name: "Stock Redemption", phase: "P7", phase_name: "Exit & Wealth Transfer", irc_citation: "§302", description: "Corporate stock redemption strategies", typical_savings_low: 15000, typical_savings_high: 60000 },

  // Phase 8 - Charitable & Philanthropic (#60-70)
  { id: 60, name: "Donor Advised Fund", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§170", description: "Charitable giving through donor advised funds", typical_savings_low: 20000, typical_savings_high: 70000 },
  { id: 61, name: "Private Foundation", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§501(c)(3)", description: "Private charitable foundation planning", typical_savings_low: 25000, typical_savings_high: 500000 },
  { id: 62, name: "Supporting Organization", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§509(a)(3)", description: "Supporting organization structure", typical_savings_low: 20000, typical_savings_high: 100000 },
  { id: 63, name: "CLAT", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§170(f)(2)", description: "Charitable Lead Annuity Trust", typical_savings_low: 50000, typical_savings_high: 200000 },
  { id: 64, name: "CLUT", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§170(f)(2)", description: "Charitable Lead Unitrust", typical_savings_low: 40000, typical_savings_high: 150000 },
  { id: 65, name: "Charitable Pooled Income Fund", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§642(c)(5)", description: "Pooled income fund for charitable giving", typical_savings_low: 30000, typical_savings_high: 70000 },
  { id: 66, name: "Charitable LLC", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§170", description: "LLC structure for charitable purposes", typical_savings_low: 30000, typical_savings_high: 90000 },
  { id: 67, name: "QCD", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§408(d)(8)", description: "Qualified Charitable Distribution from IRA", typical_savings_low: 5000, typical_savings_high: 25000 },
  { id: 68, name: "Charitable Bargain Sale", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§1011(b)", description: "Part-sale, part-gift to charity", typical_savings_low: 20000, typical_savings_high: 80000 },
  { id: 69, name: "Conservation Easement", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§170(h)", description: "Land conservation easement deduction", typical_savings_low: 50000, typical_savings_high: 300000 },
  { id: 70, name: "Leveraged Charitable Giving", phase: "P8", phase_name: "Charitable & Philanthropic", irc_citation: "§170", description: "Financed charitable contribution strategies", typical_savings_low: 20000, typical_savings_high: 100000 },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token to verify they're authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.email);

    // Use service role client for the actual seeding operation
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if strategies already exist
    const { count } = await supabase
      .from("strategies")
      .select("*", { count: "exact", head: true });

    if (count && count > 0) {
      console.log(`Strategies table already has ${count} rows`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Strategies table already has data. Clear the table first to re-seed.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert all strategies
    const { data, error } = await supabase
      .from("strategies")
      .insert(strategies)
      .select();

    if (error) {
      throw error;
    }

    console.log(`Successfully seeded ${data.length} strategies`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully seeded ${data.length} strategies`,
        count: data.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error seeding strategies:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
