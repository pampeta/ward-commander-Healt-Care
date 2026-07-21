import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ttjvobecokbzlquwagqz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0anZvYmVjb2tiemlxdXdhZ3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NjEyMDgsImV4cCI6MjEwMDIzNzIwOH0.WyLpM-3Wnm_FGi1SZ-QIruK6uJ4Xk_OUmEs_bB9fAVI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);