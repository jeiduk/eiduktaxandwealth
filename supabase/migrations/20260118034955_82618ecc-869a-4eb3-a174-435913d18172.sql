-- Add column to store the originally detected month count from P&L import
ALTER TABLE public.quarterly_reviews 
ADD COLUMN pnl_month_count_detected integer DEFAULT NULL;