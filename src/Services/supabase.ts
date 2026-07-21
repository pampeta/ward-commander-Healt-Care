import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xjyfjfbwyuiqbxjfgnhe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_N9zA8b9NC5Tt_wK5WbbFAA_OslXaX1i';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);