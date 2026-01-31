import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user's token to get user info
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to delete user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all tables (cascade should handle most, but be explicit)
    // The order matters due to foreign key constraints
    const userId = user.id;

    // Delete medication_logs first (references medications)
    await supabaseAdmin.from("medication_logs").delete().eq("user_id", userId);
    
    // Delete medications
    await supabaseAdmin.from("medications").delete().eq("user_id", userId);
    
    // Delete mood_entries
    await supabaseAdmin.from("mood_entries").delete().eq("user_id", userId);
    
    // Delete patient_doctor_connections (both as patient and doctor)
    await supabaseAdmin.from("patient_doctor_connections").delete().eq("patient_id", userId);
    await supabaseAdmin.from("patient_doctor_connections").delete().eq("doctor_id", userId);
    
    // Delete shared_reports
    await supabaseAdmin.from("shared_reports").delete().eq("user_id", userId);
    
    // Delete user_preferences
    await supabaseAdmin.from("user_preferences").delete().eq("user_id", userId);
    
    // Delete user_roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    
    // Delete profiles
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    // Finally, delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-account function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
