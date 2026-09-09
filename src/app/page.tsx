"use client";

import React from "react";
import { ChatProvider, useChatContext } from "@/context/ChatContext";
import { AppShell } from "@/components/layout/AppShell";
import { HomeView } from "@/components/views/HomeView";
import { ChatOverviewView } from "@/components/views/ChatOverviewView";
import { MyChatsView } from "@/components/views/MyChatsView";
import { SummariesView } from "@/components/views/SummariesView";
import { SettingsView } from "@/components/views/SettingsView";

function MainContent() {
  const { activeView, activeChatId } = useChatContext();

  switch (activeView) {
    case "home":
      return activeChatId ? <ChatOverviewView /> : <HomeView />;
    case "my-chats":
      return <MyChatsView />;
    case "summaries":
      return <SummariesView />;
    case "settings":
      return <SettingsView />;
    default:
      return <HomeView />;
  }
}

export default function HomePage() {
  return (
    <ChatProvider>
      <AppShell>
        <MainContent />
      </AppShell>
    </ChatProvider>
  );
}
