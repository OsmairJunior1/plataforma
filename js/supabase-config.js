// =====================================================
//  VGR ACADEMY — SUPABASE CLIENT
//  Este arquivo inicializa o cliente Supabase.
//  A anon key é PÚBLICA por design — protegida pelo RLS.
//  NUNCA coloque a service_role key aqui.
// =====================================================

const SUPABASE_URL  = 'https://kilcvhwkjogpktrxbuto.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbGN2aHdram9ncGt0cnhidXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODIwNjgsImV4cCI6MjA5MTE1ODA2OH0.dbrgv_RZ3iQE-YBnkeYUyxQOV5YItnXBiDJ3QQV6iLU';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
