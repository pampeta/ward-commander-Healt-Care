import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ttjvobecokbzlquwagqz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0eC-5AqGkfYFHwvihwOeQ_n64m-xab';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);