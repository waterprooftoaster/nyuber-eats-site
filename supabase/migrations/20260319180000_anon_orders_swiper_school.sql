-- 1a. Guest ordering: make orderer_id nullable, add guest columns
ALTER TABLE "public"."orders" ALTER COLUMN "orderer_id" DROP NOT NULL;

ALTER TABLE "public"."orders" ADD COLUMN "guest_name" text;
ALTER TABLE "public"."orders" ADD COLUMN "guest_phone" text;
ALTER TABLE "public"."orders" ADD COLUMN "guest_stripe_pm_id" text;

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_orderer_or_guest" CHECK (
    ("orderer_id" IS NOT NULL)
    OR
    ("guest_name" IS NOT NULL AND "guest_phone" IS NOT NULL AND "guest_stripe_pm_id" IS NOT NULL)
);

-- 1b. Payments: nullable payer_id for guest orders
ALTER TABLE "public"."payments" ALTER COLUMN "payer_id" DROP NOT NULL;
