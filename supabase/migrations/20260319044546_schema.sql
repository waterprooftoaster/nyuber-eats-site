
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

SET default_tablespace = '';

SET default_table_access_method = "heap";
CREATE TABLE IF NOT EXISTS "public"."eateries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "school_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "image_url" "text",
    "address" "text" NOT NULL,
    "delivery_time_label" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "latitude" double precision,
    "longitude" double precision,
    "location" "extensions"."geography"(Point,4326) GENERATED ALWAYS AS (
CASE
    WHEN (("latitude" IS NOT NULL) AND ("longitude" IS NOT NULL)) THEN ("extensions"."st_makepoint"("longitude", "latitude"))::"extensions"."geography"
    ELSE NULL::"extensions"."geography"
END) STORED,
    CONSTRAINT "restaurants_latitude_check" CHECK ((("latitude" >= ('-90'::integer)::double precision) AND ("latitude" <= (90)::double precision))),
    CONSTRAINT "restaurants_longitude_check" CHECK ((("longitude" >= ('-180'::integer)::double precision) AND ("longitude" <= (180)::double precision)))
);
ALTER TABLE "public"."eateries" OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."find_nearby_eateries"("user_lat" double precision, "user_lng" double precision, "radius_km" double precision) RETURNS SETOF "public"."eateries"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$begin
  if radius_km <= 0 or radius_km > 50 then
    raise exception 'radius_km must be between 0 and 50, got %', radius_km;
  end if;

  return query
    select *
    from public.eateries
    where is_active = true
      and location is not null
      and st_dwithin(
            location,
            st_makepoint(user_lng, user_lat)::geography,
            radius_km * 1000
          )
    order by
      location <-> st_makepoint(user_lng, user_lat)::geography;
end;$$;
ALTER FUNCTION "public"."find_nearby_eateries"("user_lat" double precision, "user_lng" double precision, "radius_km" double precision) OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
exception when others then
  raise exception 'handle_new_user failed for user %: %', new.id, sqlerrm;
end;
$$;
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;
ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;
ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "price_cents" integer NOT NULL,
    "image_url" "text",
    "is_available" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "menu_items_price_cents_check" CHECK (("price_cents" >= 0))
);
ALTER TABLE "public"."menu_items" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "school_id" "uuid",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_display_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "display_name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "display_name")) <= 50)))
);
ALTER TABLE "public"."profiles" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."schools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."schools" OWNER TO "postgres";
ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."eateries"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_slug_key" UNIQUE ("slug");

CREATE INDEX "menu_items_restaurant_available_idx" ON "public"."menu_items" USING "btree" ("restaurant_id") WHERE ("is_available" = true);

CREATE INDEX "profiles_school_id_idx" ON "public"."profiles" USING "btree" ("school_id");

CREATE INDEX "restaurants_location_gist_idx" ON "public"."eateries" USING "gist" ("location") WHERE ("is_active" = true);

CREATE INDEX "restaurants_school_active_idx" ON "public"."eateries" USING "btree" ("school_id") WHERE ("is_active" = true);

CREATE OR REPLACE TRIGGER "menu_items_set_updated_at" BEFORE UPDATE ON "public"."menu_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE OR REPLACE TRIGGER "restaurants_set_updated_at" BEFORE UPDATE ON "public"."eateries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE OR REPLACE TRIGGER "schools_set_updated_at" BEFORE UPDATE ON "public"."schools" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."eateries"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."eateries"
    ADD CONSTRAINT "restaurants_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE CASCADE;

ALTER TABLE "public"."eateries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eateries_anon_select" ON "public"."eateries" FOR SELECT TO "anon" USING (("is_active" = true));

ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items_anon_select" ON "public"."menu_items" FOR SELECT TO "anon" USING (("is_available" = true));

CREATE POLICY "menu_items_select" ON "public"."menu_items" FOR SELECT TO "authenticated" USING (("is_available" = true));

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));

CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));

CREATE POLICY "restaurants_select" ON "public"."eateries" FOR SELECT TO "authenticated" USING (("is_active" = true));

ALTER TABLE "public"."schools" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_anon_select" ON "public"."schools" FOR SELECT TO "anon" USING (true);

CREATE POLICY "schools_select" ON "public"."schools" FOR SELECT TO "authenticated" USING (true);

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT ALL ON TABLE "public"."eateries" TO "service_role";
GRANT SELECT ON TABLE "public"."eateries" TO "authenticated";
GRANT SELECT ON TABLE "public"."eateries" TO "anon";

REVOKE ALL ON FUNCTION "public"."find_nearby_eateries"("user_lat" double precision, "user_lng" double precision, "radius_km" double precision) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."find_nearby_eateries"("user_lat" double precision, "user_lng" double precision, "radius_km" double precision) TO "service_role";
GRANT ALL ON FUNCTION "public"."find_nearby_eateries"("user_lat" double precision, "user_lng" double precision, "radius_km" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_nearby_eateries"("user_lat" double precision, "user_lng" double precision, "radius_km" double precision) TO "anon";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";

GRANT ALL ON TABLE "public"."menu_items" TO "service_role";
GRANT SELECT ON TABLE "public"."menu_items" TO "authenticated";
GRANT SELECT ON TABLE "public"."menu_items" TO "anon";

GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."profiles" TO "authenticated";

GRANT ALL ON TABLE "public"."schools" TO "service_role";
GRANT SELECT ON TABLE "public"."schools" TO "authenticated";
GRANT SELECT ON TABLE "public"."schools" TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

-- Auth trigger (not included in public schema dump)
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
