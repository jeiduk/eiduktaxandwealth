-- Add new columns for P&L import and Profit First methodology
ALTER TABLE quarterly_reviews ADD COLUMN cogs decimal;
ALTER TABLE quarterly_reviews ADD COLUMN total_expenses decimal;
ALTER TABLE quarterly_reviews ADD COLUMN employee_count integer;
ALTER TABLE quarterly_reviews ADD COLUMN profit_first_profit_target decimal DEFAULT 10;
ALTER TABLE quarterly_reviews ADD COLUMN profit_first_owner_target decimal DEFAULT 50;
ALTER TABLE quarterly_reviews ADD COLUMN profit_first_tax_target decimal DEFAULT 15;
ALTER TABLE quarterly_reviews ADD COLUMN profit_first_opex_target decimal DEFAULT 25;