import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvkvwdldhujuwnvhsamr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2a3Z3ZGxkaHVqdXdudmhzYW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDc2ODAsImV4cCI6MjA4MDA4MzY4MH0.8uGPG-49XXBrcZO0aWJm-oBeFsL-G7g30oIbg7wPhYI';

export const supabase = createClient(supabaseUrl, supabaseKey);