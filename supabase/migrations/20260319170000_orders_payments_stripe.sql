-- Enums
CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'accepted',
    'in_progress',
    'completed',
    'paid',
    'cancelled'
);
ALTER TYPE "public"."order_status" OWNER TO "postgres";

CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'succeeded',
    'failed',
    'refunded'
);
ALTER TYPE "public"."payment_status" OWNER TO "postgres";

-- Orders table
CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "orderer_id" "uuid" NOT NULL,
    "swiper_id" "uuid",
    "eatery_id" "uuid" NOT NULL,
    "status" "public"."order_status" DEFAULT 'pending' NOT NULL,
    "items" "jsonb" NOT NULL,
    "total_cents" integer NOT NULL,
    "tip_cents" integer DEFAULT 0 NOT NULL,
    "special_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_items_check" CHECK (("jsonb_array_length"("items") > 0)),
    CONSTRAINT "orders_total_cents_check" CHECK (("total_cents" > 0)),
    CONSTRAINT "orders_tip_cents_check" CHECK (("tip_cents" >= 0))
);
ALTER TABLE "public"."orders" OWNER TO "postgres";

-- Payments table
CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "stripe_payment_intent_id" "text" NOT NULL,
    "amount_cents" integer NOT NULL,
    "platform_fee_cents" integer DEFAULT 0 NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending' NOT NULL,
    "payer_id" "uuid" NOT NULL,
    "payee_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_amount_cents_check" CHECK (("amount_cents" > 0)),
    CONSTRAINT "payments_platform_fee_cents_check" CHECK (("platform_fee_cents" >= 0))
);
ALTER TABLE "public"."payments" OWNER TO "postgres";

-- Stripe accounts table
CREATE TABLE IF NOT EXISTS "public"."stripe_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_account_id" "text" NOT NULL,
    "onboarding_complete" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."stripe_accounts" OWNER TO "postgres";

-- Primary keys
ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stripe_accounts"
    ADD CONSTRAINT "stripe_accounts_pkey" PRIMARY KEY ("id");

-- Unique constraints
ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_key" UNIQUE ("order_id");

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");

ALTER TABLE ONLY "public"."stripe_accounts"
    ADD CONSTRAINT "stripe_accounts_user_id_key" UNIQUE ("user_id");

ALTER TABLE ONLY "public"."stripe_accounts"
    ADD CONSTRAINT "stripe_accounts_stripe_account_id_key" UNIQUE ("stripe_account_id");

-- Indexes
CREATE INDEX "orders_orderer_id_idx" ON "public"."orders" USING "btree" ("orderer_id");

CREATE INDEX "orders_swiper_id_idx" ON "public"."orders" USING "btree" ("swiper_id") WHERE ("swiper_id" IS NOT NULL);

CREATE INDEX "orders_status_idx" ON "public"."orders" USING "btree" ("status") WHERE ("status" = 'pending'::"public"."order_status");

CREATE INDEX "orders_eatery_id_idx" ON "public"."orders" USING "btree" ("eatery_id");

CREATE INDEX "payments_order_id_idx" ON "public"."payments" USING "btree" ("order_id");

CREATE INDEX "payments_payer_id_idx" ON "public"."payments" USING "btree" ("payer_id");

CREATE INDEX "payments_payee_id_idx" ON "public"."payments" USING "btree" ("payee_id");

-- Trigger (reuse existing set_updated_at function)
CREATE OR REPLACE TRIGGER "orders_set_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Foreign keys
ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_orderer_id_fkey" FOREIGN KEY ("orderer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_swiper_id_fkey" FOREIGN KEY ("swiper_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_eatery_id_fkey" FOREIGN KEY ("eatery_id") REFERENCES "public"."eateries"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stripe_accounts"
    ADD CONSTRAINT "stripe_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_orderer_select" ON "public"."orders" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "orderer_id"));

CREATE POLICY "orders_swiper_select" ON "public"."orders" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "swiper_id"));

CREATE POLICY "orders_pending_select" ON "public"."orders" FOR SELECT TO "authenticated" USING ((("status" = 'pending'::"public"."order_status") AND ("swiper_id" IS NULL)));

CREATE POLICY "orders_insert" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "orderer_id"));

CREATE POLICY "orders_orderer_update" ON "public"."orders" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "orderer_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "orderer_id") AND ("swiper_id" IS DISTINCT FROM ( SELECT "auth"."uid"() AS "uid")));

CREATE POLICY "orders_swiper_update" ON "public"."orders" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "swiper_id"));

ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_payer_select" ON "public"."payments" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "payer_id"));

CREATE POLICY "payments_payee_select" ON "public"."payments" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "payee_id"));

ALTER TABLE "public"."stripe_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_accounts_select" ON "public"."stripe_accounts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "stripe_accounts_insert" ON "public"."stripe_accounts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."orders" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."orders" TO "authenticated";

GRANT ALL ON TABLE "public"."payments" TO "service_role";
GRANT SELECT ON TABLE "public"."payments" TO "authenticated";

GRANT ALL ON TABLE "public"."stripe_accounts" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."stripe_accounts" TO "authenticated";
