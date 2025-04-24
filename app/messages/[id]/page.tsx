"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  collection,
  doc,
  getDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  RotateCcw,
  AlertCircle,
  MoreVertical,
  Trash2,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { createNotification } from "@/lib/notifications"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { logger } from "@/lib/logger"
import type { Conversation, Message, Request, Item } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MessageItem from "@/components/message-item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RatingDialog from "@/components/rating-dialog"
import UserStatusBadge from "@/components/user-status-badge"
import MessageInput from "@/components/message-input"

// ... (Keep all existing imports and types)

export default function ConversationPage() {
  // ... (Keep all existing state and hooks unchanged)

  // Redirect if not logged in
  useEffect(() => {
    // ... (Unchanged)
  }, [user, router, redirecting, id])

  // Fetch conversation
  useEffect(() => {
    // ... (Unchanged)
  }, [id, user, router])

  // Fetch other user details
  useEffect(() => {
    // ... (Unchanged)
  }, [otherUserId, conversation, otherUserName])

  // Subscribe to messages
  useEffect(() => {
    // ... (Unchanged)
  }, [conversation, user, isUserInConversation])

  // Subscribe to request changes
  useEffect(() => {
    // ... (Unchanged)
  }, [request?.id, user])

  // Scroll to bottom
  useEffect(() => {
    // ... (Unchanged)
  }, [messages])

  // ... (Keep all existing handlers unchanged: handleSendMessage, handleEmojiSelect, handleFileUpload, etc.)

  // Loading state for redirecting
  if (redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Giriş sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-card rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <Skeleton
                    className={`h-12 w-2/3 rounded-2xl ${i % 2 === 0 ? "bg-muted" : "bg-primary/10"}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-card rounded-lg shadow-sm border p-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Hata</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Sayfayı Yenile
              </Button>
              <Button asChild>
                <Link href="/messages">Mesajlara Dön</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-semibold mb-4">Giriş yapmanız gerekiyor</h1>
          <p className="text-muted-foreground mb-6">
            Mesajları görüntülemek için lütfen giriş yapın.
          </p>
          <Button asChild size="lg">
            <Link href={`/auth/login?returnUrl=${encodeURIComponent(`/messages/${id}`)}`}>
              Giriş Yap
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Conversation not found or unauthorized
  if (!conversation || !isUserInConversation) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-semibold mb-4">Konuşma bulunamadı</h1>
          <p className="text-muted-foreground mb-6">
            Aradığınız konuşma mevcut değil veya erişim izniniz yok.
          </p>
          <Button asChild size="lg">
            <Link href="/messages">Mesajlara Dön</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-card rounded-lg shadow-sm border flex flex-col h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="hover:bg-muted rounded-full"
              >
                <Link href="/messages">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUserId ? `/api/user/${otherUserId}/avatar` : undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {otherUserName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{otherUserName || "İsimsiz Kullanıcı"}</h1>
                  {otherUserId && <UserStatusBadge userId={otherUserId} />}
                </div>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {conversation.itemTitle}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border shadow-sm">
                <DropdownMenuItem asChild>
                  <Link href={`/items/${conversation.itemId}`} className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Eşyayı Görüntüle
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteConversation}
                  className="text-destructive flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Konuşmayı Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabs */}
          <Tabs
             defaultValue="chat"
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <div className="border-b px-4">
              <TabsList className="w-full grid grid-cols-2 bg-muted/50 rounded-t-lg">
                <TabsTrigger
                  value="chat"
                  className="text-sm font-medium py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Mesajlar
                </TabsTrigger>
                <TabsTrigger
                  value="request"
                  className="text-sm font-medium py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  İstek Detayları
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 overflow-hidden">
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-background"
                style={{
                  backgroundImage: `url('/assets/chat-bg-light.png')`,
                  backgroundAttachment: "fixed",
                }}
              >
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === user.uid}
                      userName={user.displayName || ""}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Henüz mesaj yok. Konuşmaya başlayın!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t bg-card">
                <MessageInput
                  onSendMessage={async (text) => {
                    // ... (Unchanged)
                  }}
                  onSendFile={handleFileUpload}
                  onSendImage={handleImageUpload}
                  disabled={!conversation || !isUserInConversation || loading}
                  placeholder="Mesajınızı yazın..."
                  className="rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary"
                />
              </div>
            </TabsContent>

            <TabsContent value="request" className="flex-1 overflow-y-auto p-0 m-0">
              {requestLoading ? (
                <div className="flex flex-col items-center justify-center h-full bg-background">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-sm">İstek bilgileri yükleniyor...</p>
                </div>
              ) : requestError ? (
                <div className="flex flex-col items-center justify-center h-full bg-background">
                  <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
                  <p className="text-muted-foreground mb-6">{requestError}</p>
                  <Button
                    variant="outline"
                    onClick={handleRefreshRequest}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yeniden Dene
                  </Button>
                </div>
              ) : request ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 pb-0 border-b">
                    <h2 className="text-xl font-semibold">İstek Detayları</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversation.itemTitle} için istek durumu ve detayları
                    </p>
                  </div>

                  <div className="p-4 space-y-6 flex-1 overflow-auto">
                    {/* Basic Request Details */}
                    <div className="bg-card rounded-lg p-4 shadow-sm border">
                      <h3 className="text-lg font-medium mb-4">Genel Bilgiler</h3>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Eşya:</span>
                          <span className="font-medium">{conversation.itemTitle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">İsteyen:</span>
                          <span className="font-medium">{request.requesterName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Eşya Sahibi:</span>
                          <span className="font-medium">{request.ownerName}</span>
                        </div>
                        {request.pickupLocation && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Teslim Yeri:</span>
                            <span className="font-medium">{request.pickupLocation}</span>
                          </div>
                        )}
                        {request.pickupDate && !item?.unlimitedDuration && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Teslim Tarihi:</span>
                            <span className="font-medium">
                              {new Date(
                                request.pickupDate.seconds * 1000,
                              ).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                        )}
                        {request.message && (
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Mesaj:</span>
                            <div className="bg-muted/50 p-2 rounded-md mt-1 text-sm">
                              {request.message}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Request Status */}
                    <div className="bg-card rounded-lg p-4 shadow-sm border">
                      <h3 className="text-lg font-medium mb-4">İstek Durumu</h3>
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Durum:</span>
                          <Badge
                            className={`
                              px-2 py-1
                              ${request.status === "pending" ? "bg-yellow-100 text-yellow-800" : ""}
                              ${request.status === "accepted" ? "bg-green-100 text-green-800" : ""}
                              ${request.status === "rejected" ? "bg-red-100 text-red-800" : ""}
                              ${request.status === "returning" ? "bg-blue-100 text-blue-800" : ""}
                              ${request.status === "completed" ? "bg-green-200 text-green-900" : ""}
                            `}
                          >
                            {request.status === "pending" && "Onay Bekliyor"}
                            {request.status === "accepted" && "Onaylandı"}
                            {request.status === "rejected" && "Reddedildi"}
                            {request.status === "returning" && "İade Süreci"}
                            {request.status === "completed" && "Tamamlandı"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Süre:</span>
                          {item?.unlimitedDuration ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Sınırsız Süreli Eşya
                            </Badge>
                          ) : request.duration ? (
                            <span className="font-medium">{request.duration} Gün</span>
                          ) : (
                            <span className="text-muted-foreground">Belirtilmemiş</span>
                          )}
                        </div>
                        {(request.status === "accepted" ||
                          request.status === "returning" ||
                          request.status === "completed") && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Teslimat:</span>
                            <Badge
                              className={`
                                px-2 py-1
                                ${!request.deliveryStatus ? "bg-yellow-100 text-yellow-800" : ""}
                                ${request.deliveryStatus === "requester_confirmed" ? "bg-blue-100 text-blue-800" : ""}
                                ${request.deliveryStatus === "completed" ? "bg-green-100 text-green-800" : ""}
                              `}
                            >
                              {!request.deliveryStatus && "Bekliyor"}
                              {request.deliveryStatus === "requester_confirmed" &&
                                "Kısmen Onaylandı"}
                              {request.deliveryStatus === "completed" && "Tamamlandı"}
                            </Badge>
                          </div>
                        )}
                        {(request.status === "returning" ||
                          request.status === "completed") &&
                          !item?.unlimitedDuration && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium">İade:</span>
                              <Badge
                                className={`
                                  px-2 py-1
                                  ${request.returnStatus === "requester_confirmed" ? "bg-yellow-100 text-yellow-800" : ""}
                                  ${request.returnStatus === "owner_confirmed" ? "bg-blue-100 text-blue-800" : ""}
                                  ${request.returnStatus === "completed" ? "bg-green-100 text-green-800" : ""}
                                `}
                              >
                                {request.returnStatus === "requester_confirmed" &&
                                  "İade Başlatıldı"}
                                {request.returnStatus === "owner_confirmed" &&
                                  "Kısmen Onaylandı"}
                                {request.returnStatus === "completed" && "Tamamlandı"}
                              </Badge>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Process Steps */}
                    {(request.status === "accepted" ||
                      request.status === "returning" ||
                      request.status === "completed") && (
                      <div className="bg-card rounded-lg p-4 shadow-sm border">
                        <h3 className="text-lg font-medium mb-4">Süreç Adımları</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                ${request.requesterConfirmed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}
                              `}
                            >
                              {request.requesterConfirmed ? "✓" : "1"}
                            </div>
                            <span
                              className={request.requesterConfirmed ? "text-green-600 font-medium" : ""}
                            >
                              İsteyen kişi teslimatı onayladı
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                ${request.ownerDeliveryConfirmed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}
                              `}
                            >
                              {request.ownerDeliveryConfirmed ? "✓" : "2"}
                            </div>
                            <span
                              className={request.ownerDeliveryConfirmed ? "text-green-600 font-medium" : ""}
                            >
                              Eşya sahibi teslimatı onayladı
                            </span>
                          </div>
                          {!item?.unlimitedDuration && (
                            <>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                    ${request.requesterReturnConfirmed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}
                                  `}
                                >
                                  {request.requesterReturnConfirmed ? "✓" : "3"}
                                </div>
                                <span
                                  className={request.requesterReturnConfirmed ? "text-green-600 font-medium" : ""}
                                >
                                  İsteyen kişi iade sürecini başlattı
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                    ${request.ownerReturnConfirmed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}
                                  `}
                                >
                                  {request.ownerReturnConfirmed ? "✓" : "4"}
                                </div>
                                <span
                                  className={request.ownerReturnConfirmed ? "text-green-600 font-medium" : ""}
                                >
                                  Eşya sahibi iadeyi onayladı
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                    ${request.requesterFinalConfirmed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}
                                  `}
                                >
                                  {request.requesterFinalConfirmed ? "✓" : "5"}
                                </div>
                                <span
                                  className={request.requesterFinalConfirmed ? "text-green-600 font-medium" : ""}
                                >
                                  İsteyen kişi iade işlemini tamamladı
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t mt-auto bg-card">
                    {isOwner && request.status === "pending" && (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={handleApproveRequest}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700 h-10"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          İsteği Onayla
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleRejectRequest}
                          disabled={isProcessing}
                          className="h-10"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          İsteği Reddet
                        </Button>
                      </div>
                    )}
                    {isRequester &&
                      request.status === "accepted" &&
                      (!request.deliveryStatus || request.deliveryStatus === "") && (
                        <Button
                          onClick={handleConfirmDelivery}
                          disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700 h-10"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Teslimatı Onayla
                        </Button>
                      )}
                    {isOwner &&
                      request.status === "accepted" &&
                      request.deliveryStatus === "requester_confirmed" && (
                        <Button
                          onClick={handleOwnerConfirmDelivery}
                          disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700 h-10"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Teslimatı Onayla
                        </Button>
                      )}
                    {isRequester &&
                      request.status === "accepted" &&
                      request.deliveryStatus === "completed" &&
                      !item?.unlimitedDuration && (
                        <Button
                          onClick={handleInitiateReturn}
                          disabled={isProcessing || request.status === "returning"}
                          className="w-full h-10"
                          variant="outline"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {request.status === "returning"
                            ? "İade Süreci Başlatıldı"
                            : "İade Sürecini Başlat"}
                        </Button>
                      )}
                    {isOwner &&
                      request.status === "returning" &&
                      request.returnStatus === "requester_confirmed" && (
                        <Button
                          onClick={handleConfirmReturn}
                          disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700 h-10"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          İadeyi Onayla
                        </Button>
                      )}
                    {isRequester &&
                      request.status === "returning" &&
                      request.returnStatus === "owner_confirmed" && (
                        <Button
                          onClick={handleRequesterConfirmReturn}
                          disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700 h-10"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          İade İşlemini Tamamla
                        </Button>
                      )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-background">
                  <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
                  <p className="text-muted-foreground mb-6">İstek bilgisi bulunamadı.</p>
                  <Button
                    variant="outline"
                    onClick={handleRefreshRequest}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yeniden Dene
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold">
                {dialogAction === "approve" && "İsteği Onaylama"}
                {dialogAction === "reject" && "İsteği Reddetme"}
                {dialogAction === "confirm_delivery" && "Teslimatı Onaylama"}
                {dialogAction === "owner_confirm_delivery" && "Teslimatı Onaylama"}
                {dialogAction === "confirm_return" && "İadeyi Onaylama"}
                {dialogAction === "requester_confirm_return" && "İade İşlemini Tamamlama"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {dialogAction === "approve" &&
                  "Bu isteği onaylamak istediğinizden emin misiniz? Eşya ödünç verilecek olarak işaretlenecektir."}
                {dialogAction === "reject" &&
                  "Bu isteği reddetmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
                {dialogAction === "confirm_delivery" &&
                  "Eşyayı teslim aldığınızı onaylamak istediğinizden emin misiniz?"}
                {dialogAction === "owner_confirm_delivery" &&
                  "Eşyayı teslim ettiğinizi onaylamak istediğinizden emin misiniz?"}
                {dialogAction === "confirm_return" &&
                  "İadeyi onaylamak istediğinizden emin misiniz?"}
                {dialogAction === "requester_confirm_return" &&
                  "İade işlemini tamamlamak istediğinizden emin misiniz? Bu işlem geri alınamaz."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing} className="h-10">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (dialogAction === "approve") confirmApproveRequest()
                  else if (dialogAction === "reject") confirmRejectRequest()
                  else if (dialogAction === "confirm_delivery") confirmDelivery()
                  else if (dialogAction === "owner_confirm_delivery") confirmOwnerDelivery()
                  else if (dialogAction === "confirm_return") confirmReturn()
                  else if (dialogAction === "requester_confirm_return") confirmRequesterReturn()
                }}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90 h-10"
              >
                Onaylıyorum
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <AlertDialogContent className="rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold">
                İade Sürecini Başlat
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Eşyayı iade etmek istediğinizden emin misiniz? İade süreci başlatıldıktan sonra
                eşya sahibinin onayı gerekecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing} className="h-10">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmInitiateReturn}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90 h-10"
              >
                İade Sürecini Başlat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold">
                Konuşmayı Sil
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Bu konuşmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm
                mesajlar silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing} className="h-10">
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteConversation}
                disabled={isProcessing}
                className="bg-destructive hover:bg-destructive/90 h-10"
              >
                Konuşmayı Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <RatingDialog
          isOpen={showRatingDialog}
          onClose={() => setShowRatingDialog(false)}
          userId={otherUserId || ""}
          userName={otherUserName || "Kullanıcı"}
          itemTitle={conversation?.itemTitle || ""}
          ratingType={ratingType}
        />
      </div>
    </div>
  )
}