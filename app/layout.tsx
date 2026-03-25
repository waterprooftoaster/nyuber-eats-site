import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { ChatPanelProvider, ChatPanel } from "@/components/chat-panel";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/api/helpers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goober Eats",
  description: "Peer-to-peer student meal swipe sharing app",
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  const isSwiper = user
    ? ((await supabase.from('profiles').select('is_swiper').eq('id', user.id).single())
        .data?.is_swiper ?? false)
    : false

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ChatPanelProvider userId={user?.id ?? null}>
          <Header />
          <div className="flex flex-1">
            <Sidebar user={user} isSwiper={isSwiper} />
            <div className="flex-1 min-w-0 px-6">
              {children}
            </div>
          </div>
          {modal}
          <ChatPanel currentUserId={user?.id ?? null} />
        </ChatPanelProvider>
      </body>
    </html>
  );
}
