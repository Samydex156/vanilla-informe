// js/config.js
const SUPABASE_URL = "https://nybbteerjvcpkilquxky.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_GF1FYRU_R-z6Hmh8HTB79w_wTO3VTyE";

const { createClient } = supabase; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Conexión con Supabase vinculada correctamente.");