-- Add column to store the number of months in the imported P&L data
-- This is used to calculate true monthly averages (YTD / month_count)
ALTER TABLE public.quarterly_reviews
ADD COLUMN pnl_month_count integer DEFAULT NULL;