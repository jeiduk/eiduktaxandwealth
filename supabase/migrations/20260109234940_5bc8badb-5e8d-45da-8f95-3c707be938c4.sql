-- Add CHECK constraints for financial input validation

-- Tax rates (0-100% stored as 0.0-1.0)
ALTER TABLE clients 
  ADD CONSTRAINT clients_tax_rate_valid 
  CHECK (tax_rate IS NULL OR (tax_rate >= 0 AND tax_rate <= 1));

-- Deduction amounts (non-negative)
ALTER TABLE client_strategies 
  ADD CONSTRAINT client_strategies_deduction_amount_positive 
  CHECK (deduction_amount IS NULL OR deduction_amount >= 0);

-- Tax savings (non-negative)
ALTER TABLE client_strategies 
  ADD CONSTRAINT client_strategies_tax_savings_positive 
  CHECK (tax_savings IS NULL OR tax_savings >= 0);

-- Revenue fields (non-negative)
ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_revenue_ytd_valid 
  CHECK (revenue_ytd IS NULL OR revenue_ytd >= 0);

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_revenue_goal_valid 
  CHECK (revenue_goal IS NULL OR revenue_goal >= 0);

-- Profit fields (can be negative for losses, but let's allow that)
ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_profit_ytd_valid 
  CHECK (profit_ytd IS NULL OR profit_ytd >= -1000000000);

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_profit_goal_valid 
  CHECK (profit_goal IS NULL OR profit_goal >= -1000000000);

-- Draw fields (non-negative)
ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_draw_ytd_valid 
  CHECK (draw_ytd IS NULL OR draw_ytd >= 0);

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_draw_goal_valid 
  CHECK (draw_goal IS NULL OR draw_goal >= 0);

-- Employee counts (non-negative integers)
ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_employees_current_valid 
  CHECK (employees_current IS NULL OR employees_current >= 0);

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_employees_goal_valid 
  CHECK (employees_goal IS NULL OR employees_goal >= 0);

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_employee_count_valid 
  CHECK (employee_count IS NULL OR employee_count >= 0);

-- COGS and expenses (non-negative)
ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_cogs_valid 
  CHECK (cogs IS NULL OR cogs >= 0);

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_total_expenses_valid 
  CHECK (total_expenses IS NULL OR total_expenses >= 0);

-- Profit First targets (0-100%)
ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_profit_first_profit_target_valid 
  CHECK (profit_first_profit_target IS NULL OR (profit_first_profit_target >= 0 AND profit_first_profit_target <= 100));

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_profit_first_owner_target_valid 
  CHECK (profit_first_owner_target IS NULL OR (profit_first_owner_target >= 0 AND profit_first_owner_target <= 100));

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_profit_first_tax_target_valid 
  CHECK (profit_first_tax_target IS NULL OR (profit_first_tax_target >= 0 AND profit_first_tax_target <= 100));

ALTER TABLE quarterly_reviews 
  ADD CONSTRAINT quarterly_reviews_profit_first_opex_target_valid 
  CHECK (profit_first_opex_target IS NULL OR (profit_first_opex_target >= 0 AND profit_first_opex_target <= 100));