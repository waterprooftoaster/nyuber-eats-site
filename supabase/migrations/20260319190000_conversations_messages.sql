-- Add phone column to profiles
ALTER TABLE "public"."profiles" ADD COLUMN "phone" text;

-- Conversations table
CREATE TABLE "public"."conversations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL,
  "orderer_id" uuid,
  "swiper_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "conversations_order_id_key" UNIQUE ("order_id"),
  CONSTRAINT "conversations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id") ON DELETE CASCADE,
  CONSTRAINT "conversations_orderer_id_fkey" FOREIGN KEY ("orderer_id") REFERENCES "public"."profiles" ("id") ON DELETE CASCADE,
  CONSTRAINT "conversations_swiper_id_fkey" FOREIGN KEY ("swiper_id") REFERENCES "public"."profiles" ("id") ON DELETE CASCADE
);

CREATE INDEX "conversations_order_id_idx" ON "public"."conversations" ("order_id");

-- Messages table
CREATE TABLE "public"."messages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL,
  "sender_id" uuid,
  "body" text NOT NULL CHECK (char_length("body") BETWEEN 1 AND 1000),
  "sent_at" timestamptz NOT NULL DEFAULT now(),
  "read_at" timestamptz,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations" ("id") ON DELETE CASCADE,
  CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles" ("id") ON DELETE SET NULL
);

CREATE INDEX "messages_conversation_sent_idx" ON "public"."messages" ("conversation_id", "sent_at");

-- Enable RLS
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

-- Conversations RLS policies
CREATE POLICY "Users can view their conversations"
  ON "public"."conversations" FOR SELECT
  TO authenticated
  USING (auth.uid() IN ("orderer_id", "swiper_id"));

CREATE POLICY "Swiper can create conversation on accept"
  ON "public"."conversations" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "swiper_id");

-- Messages RLS policies
CREATE POLICY "Participants can view messages"
  ON "public"."messages" FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."conversations" c
      WHERE c.id = "conversation_id"
        AND auth.uid() IN (c."orderer_id", c."swiper_id")
    )
  );

CREATE POLICY "Participants can send messages"
  ON "public"."messages" FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = "sender_id"
    AND EXISTS (
      SELECT 1 FROM "public"."conversations" c
      WHERE c.id = "conversation_id"
        AND auth.uid() IN (c."orderer_id", c."swiper_id")
    )
  );

CREATE POLICY "Participants can mark messages read"
  ON "public"."messages" FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."conversations" c
      WHERE c.id = "conversation_id"
        AND auth.uid() IN (c."orderer_id", c."swiper_id")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."conversations" c
      WHERE c.id = "conversation_id"
        AND auth.uid() IN (c."orderer_id", c."swiper_id")
    )
  );

-- Grants for authenticated
GRANT SELECT, INSERT ON "public"."conversations" TO authenticated;
GRANT SELECT, INSERT ON "public"."messages" TO authenticated;
GRANT UPDATE (read_at) ON "public"."messages" TO authenticated;

-- Grants for service_role (used by webhooks and notify functions)
GRANT ALL ON "public"."conversations" TO service_role;
GRANT ALL ON "public"."messages" TO service_role;
