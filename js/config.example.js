// js/config.example.js
// Renombra este archivo a config.js y coloca tus claves reales
// Este archivo sirve de plantilla para el repositorio
const SUPABASE_URL = "TU_SUPABASE_URL_AQUI"; 
const SUPABASE_KEY = "TU_SUPABASE_KEY_AQUI";

const { createClient } = supabase; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Conexión con Supabase vinculada correctamente.");
