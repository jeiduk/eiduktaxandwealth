-- Add industry field to clients table
ALTER TABLE clients ADD COLUMN industry text;

-- Create industry_benchmarks reference table
CREATE TABLE industry_benchmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  industry text UNIQUE NOT NULL,
  display_name text NOT NULL,
  profit_target decimal NOT NULL,
  owner_pay_target decimal NOT NULL,
  tax_target decimal NOT NULL,
  opex_target decimal NOT NULL,
  notes text
);

-- Enable RLS
ALTER TABLE industry_benchmarks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view benchmarks (public reference data)
CREATE POLICY "Anyone can view industry benchmarks"
ON industry_benchmarks FOR SELECT
USING (true);

-- Seed with common industries
INSERT INTO industry_benchmarks (industry, display_name, profit_target, owner_pay_target, tax_target, opex_target, notes) VALUES
('consulting', 'Consulting / Professional Services', 15, 50, 15, 20, 'High margins, low overhead'),
('medical_practice', 'Medical / Dental Practice', 10, 35, 15, 40, 'Higher overhead, staff costs'),
('legal', 'Legal Services', 15, 45, 15, 25, 'Partner compensation varies'),
('accounting', 'Accounting / Tax Services', 15, 45, 15, 25, 'Seasonal revenue patterns'),
('financial_services', 'Financial Advisory', 20, 40, 15, 25, 'Compliance costs factor in'),
('real_estate', 'Real Estate / Property Mgmt', 10, 40, 15, 35, 'Variable transaction income'),
('construction', 'Construction / Trades', 8, 35, 15, 42, 'Equipment and material costs'),
('restaurant', 'Restaurant / Food Service', 5, 30, 15, 50, 'High COGS and labor'),
('retail', 'Retail', 5, 35, 15, 45, 'Inventory and rent costs'),
('ecommerce', 'E-Commerce', 10, 40, 15, 35, 'Marketing and fulfillment'),
('saas', 'SaaS / Software', 20, 35, 15, 30, 'High margins after scale'),
('manufacturing', 'Manufacturing', 8, 35, 15, 42, 'Equipment and materials'),
('healthcare_services', 'Healthcare Services', 10, 40, 15, 35, 'Staffing intensive'),
('marketing_agency', 'Marketing / Creative Agency', 15, 45, 15, 25, 'Labor is primary cost'),
('coaching', 'Coaching / Training', 20, 50, 15, 15, 'Very low overhead'),
('insurance', 'Insurance Agency', 12, 45, 15, 28, 'Commission-based revenue'),
('trucking', 'Trucking / Logistics', 8, 35, 15, 42, 'Fuel and equipment costs'),
('hvac_plumbing', 'HVAC / Plumbing / Electrical', 10, 35, 15, 40, 'Parts and labor balance'),
('landscaping', 'Landscaping / Lawn Care', 10, 40, 15, 35, 'Seasonal, equipment heavy'),
('cleaning_services', 'Cleaning / Janitorial', 12, 45, 15, 28, 'Labor intensive'),
('auto_repair', 'Auto Repair / Body Shop', 10, 35, 15, 40, 'Parts inventory required'),
('fitness', 'Fitness / Gym / Wellness', 12, 40, 15, 33, 'Facility costs'),
('childcare', 'Childcare / Daycare', 8, 40, 15, 37, 'Staffing ratios required'),
('veterinary', 'Veterinary Practice', 10, 35, 15, 40, 'Medical equipment costs'),
('pharmacy', 'Pharmacy', 5, 35, 15, 45, 'High inventory costs'),
('custom', 'Custom / Other', 10, 50, 15, 25, 'Default Profit First targets');