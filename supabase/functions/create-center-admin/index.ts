import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateCenterAdminRequest {
  email: string;
  password: string;
  fullName: string;
  centerId: string;
  phone?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is a super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create client with user token to verify permissions
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify caller is super_admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    
    // Check if user has super_admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Only super admins can create center admins" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, password, fullName, centerId, phone }: CreateCenterAdminRequest = await req.json();

    if (!email || !password || !fullName || !centerId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, fullName, centerId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify center exists
    const { data: center, error: centerError } = await supabaseAdmin
      .from("centers")
      .select("id")
      .eq("id", centerId)
      .single();

    if (centerError || !center) {
      return new Response(
        JSON.stringify({ error: "Center not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user with this email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "A user with this email already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authData.user.id;

    // Update profile with center_id and phone (profile created by trigger)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        center_id: centerId,
        phone: phone || null,
        full_name: fullName
      })
      .eq("id", newUserId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail - profile might be created by trigger
    }

    // Assign center_admin role
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: "center_admin",
      });

    if (roleInsertError) {
      // Cleanup: delete the user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Failed to assign role: ${roleInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Center admin created successfully",
        user: {
          id: newUserId,
          email: authData.user.email,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
