"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChatWindow from "@/components/ChatWindow";
import {
  ChatMessage as ChatMessageType,
  ConversationSummary,
  ToneType,
  StreamChunk,
} from "@/types/chat";
import { exportConversationToTxt } from "@/lib/exportChat";

export default function Home() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>("New Chat");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState<string>("");
  const [tone, setTone] = useState<ToneType>("professional");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversation list from backend
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingList(true);
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        throw new Error(`Failed to fetch conversations (Status: ${res.status})`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.warn("Could not load conversations:", e.message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Select an existing conversation
  const handleSelectConversation = async (id: string) => {
    if (isStreaming) {
      // Abort ongoing stream if user switches conversation
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }

    try {
      setIsLoadingConversation(true);
      setError(null);
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load the requested conversation.");
      }

      const conv = data.conversation;
      setActiveConversationId(conv._id);
      setCurrentTitle(conv.title);
      setTone(conv.tone || "professional");
      setMessages(conv.messages || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setActiveConversationId(null);
    setCurrentTitle("New Chat");
    setMessages([]);
    setInput("");
    setError(null);
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistically update list
    setConversations((prev) => prev.filter((c) => c._id !== id));

    if (activeConversationId === id) {
      handleNewChat();
    }

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete conversation.");
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(`Failed to delete conversation: ${e.message}`);
      fetchConversations();
    }
  };

  // Update tone and optionally patch conversation if active
  const handleSelectTone = async (newTone: ToneType) => {
    setTone(newTone);
    if (activeConversationId) {
      try {
        await fetch(`/api/conversations/${activeConversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tone: newTone }),
        });
        // Update local list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversationId ? { ...c, tone: newTone } : c
          )
        );
      } catch (err) {
        console.warn("Could not update conversation tone:", err);
      }
    }
  };

  // Stop active stream
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Stream reader core utility
  const processStreamingResponse = async (
    response: Response,
    isRegenerate: boolean
  ) => {
    if (!response.body) {
      throw new Error("No response body received from server.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamBuffer = "";
    let accumulatedText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const parts = streamBuffer.split("\n\n");
        // Keep the last part in buffer (might be incomplete)
        streamBuffer = parts.pop() || "";

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, "");
          if (!jsonStr) continue;

          try {
            const chunk: StreamChunk = JSON.parse(jsonStr);

            if (chunk.type === "meta") {
              setActiveConversationId(chunk.conversationId);
              setCurrentTitle(chunk.title);
            } else if (chunk.type === "delta") {
              accumulatedText += chunk.text;
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: accumulatedText,
                  };
                }
                return updated;
              });
            } else if (chunk.type === "error") {
              setError(chunk.message);
            }
          } catch (jsonErr) {
            console.warn("Error parsing stream chunk JSON:", jsonErr, jsonStr);
          }
        }
      }
    } finally {
      reader.releaseLock();
      setIsStreaming(false);
      // Refresh list to update ordering and message counts
      fetchConversations();
    }
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : input).trim();
    if (!textToSend || isStreaming) return;

    setError(null);
    setInput("");

    // Create optimistic user message
    const userMessage: ChatMessageType = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    // Create placeholder assistant message for streaming tokens
    const assistantPlaceholder: ChatMessageType = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          conversationId: activeConversationId,
          tone,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server responded with status ${response.status}`
        );
      }

      await processStreamingResponse(response, false);
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        console.log("Stream aborted by user.");
      } else {
        const e = err as Error;
        setError(e.message || "Failed to communicate with AI.");
        // Remove empty placeholder message if generation failed completely
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
      setIsStreaming(false);
    }
  };

  // Regenerate latest response
  const handleRegenerate = async () => {
    if (isStreaming || !activeConversationId || messages.length === 0) return;

    setError(null);

    // Reset last assistant message to empty for progressive streaming
    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === "assistant") {
          updated[i] = {
            ...updated[i],
            content: "",
            timestamp: new Date().toISOString(),
          };
          break;
        }
      }
      return updated;
    });

    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          tone,
          regenerate: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Regeneration failed with status ${response.status}`
        );
      }

      await processStreamingResponse(response, true);
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        console.log("Regeneration aborted by user.");
      } else {
        const e = err as Error;
        setError(e.message || "Failed to regenerate response.");
      }
      setIsStreaming(false);
    }
  };

  // Export current conversation to TXT file
  const handleExportChat = () => {
    if (messages.length === 0) return;
    exportConversationToTxt(currentTitle, messages, tone);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0D12]">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isLoadingList={isLoadingList}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title={currentTitle}
          tone={tone}
          onSelectTone={handleSelectTone}
          onToggleSidebar={() => setIsOpenMobile(true)}
          onNewChat={handleNewChat}
          onExportChat={handleExportChat}
          hasMessages={messages.length > 0}
          isStreaming={isStreaming}
        />

        <ChatWindow
          messages={messages}
          input={input}
          setInput={setInput}
          onSubmit={() => handleSendMessage()}
          onStop={handleStopStreaming}
          isStreaming={isStreaming}
          selectedTone={tone}
          onSelectTone={handleSelectTone}
          onSelectPrompt={(text) => handleSendMessage(text)}
          onRegenerate={handleRegenerate}
          error={error}
          onDismissError={() => setError(null)}
          isLoadingConversation={isLoadingConversation}
        />
      </div>
    </div>
  );
}
