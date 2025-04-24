"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Search, MessageSquare, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { logger } from "@/lib/logger"
import type { Conversation } from "@/lib/types"

export default function MessagesPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [redirecting, setRedirecting] = useState(false)
  const [userDetails, setUserDetails] = useState<Record<string, any>>({})

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !redirecting) {
      setRedirecting(true)
      router.push("/auth/login")
    }
  }, [user, router, redirecting])

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageTimestamp", "desc"),
        )

        const unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            const conversationsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Conversation[]

            const userIds = new Set<string>()
            conversationsData.forEach((conversation) => {
              conversation.participants.forEach((participantId) => {
                if (participantId !== user.uid && participantId !== "system") {
                  userIds.add(participantId)
                }
              })
            })

            const userDetailsMap: Record<string, any> = {}
            for (const userId of userIds) {
              try {
                const userDoc = await getDoc(doc(db, "users", userId))
                if (userDoc.exists()) {
                  userDetailsMap[userId] = userDoc.data()
                }
              } catch (err) {
                console.error(`Error fetching user details for ${userId}:`, err)
              }
            }

            setUserDetails(userDetailsMap)
            setConversations(conversationsData)
            setLoading(false)
          },
          (err) => {
            console.error("Error listening to conversations:", err)
            setError("Konuşmalar yüklenirken bir hata oluştu")
            setLoading(false)
            logger.error("Error listening to conversations", { error: err, userId: user.uid })
          },
        )

        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching conversations:", error)
        setError("Konuşmalar yüklenirken bir hata oluştu")
        setLoading(false)
        logger.error("Error fetching conversations", { error, userId: user.uid })
      }
    }

    if (user) {
      fetchConversations()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleConversationClick = async (conversationId: string) => {
    router.push(`/messages/${conversationId}`)
  }

  const formatLastMessageTime = (timestamp: any) => {
    if (!timestamp) return ""

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      if (diffInDays === 0) {
        return format(date, "HH:mm", { locale: tr })
      } else if (diffInDays === 1) {
        return "Dün"
      } else if (diffInDays < 7) {
        return format(date, "EEEE", { locale: tr })
      } else {
        return format(date, "dd MMM", { locale: tr })
      }
    } catch (err) {
      console.error("Error formatting message time:", err)
      return ""
    }
  }

  const getOtherParticipantName = (conversation: Conversation) => {
    if (!user) return "Bilinmeyen Kullanıcı"

    const otherParticipantId = conversation.participants.find((id) => id !== user.uid)
    if (!otherParticipantId) return "Bilinmeyen Kullanıcı"

    const otherUser = userDetails[otherParticipantId]
    return otherUser?.displayName || "Bilinmeyen Kullanıcı"
  }

  const getOtherParticipantInitial = (conversation: Conversation) => {
    const name = getOtherParticipantName(conversation)
    return name.charAt(0) || "?"
  }

  const getOtherParticipantPhoto = (conversation: Conversation) => {
    if (!user) return null

    const otherParticipantId = conversation.participants.find((id) => id !== user.uid)
    if (!otherParticipantId) return null

    const otherUser = userDetails[otherParticipantId]
    return otherUser?.photoURL || null
  }

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipantName = getOtherParticipantName(conversation).toLowerCase()
    const itemTitle = conversation.itemTitle?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()

    return otherParticipantName.includes(query) || itemTitle.includes(query)
  })

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Skeleton className="h-10 w-10 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Giriş sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8">Mesajlar</h1>
          <Skeleton className="h-12 w-full mb-6 rounded-lg" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm"
              >
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">Giriş yapmanız gerekiyor</h1>
          <p className="text-gray-600 mb-6">Mesajları görüntülemek için lütfen giriş yapın.</p>
          <Button
            onClick={() => router.push("/auth/login")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Giriş Yap
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8">Mesajlar</h1>
          <div className="p-6 bg-red-50 rounded-lg shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 mb-6">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Sayfayı Yenile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Mesajlar</h1>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Mesajlarda ara..."
            className="pl-12 h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredConversations.length > 0 ? (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
                onClick={() => handleConversationClick(conversation.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleConversationClick(conversation.id)}
              >
                <Avatar className="h-14 w-14">
                  <AvatarImage src={getOtherParticipantPhoto(conversation) || ""} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getOtherParticipantInitial(conversation)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {getOtherParticipantName(conversation)}
                    </h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {formatLastMessageTime(conversation.lastMessageTimestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-300 bg-blue-50"
                    >
                      {conversation.itemTitle}
                    </Badge>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessageSenderId === user.uid ? "Siz: " : ""}
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Henüz mesajınız yok"
            description="Eşya sahipleriyle iletişime geçtiğinizde mesajlarınız burada görünecek."
            actionLabel="Eşyalara Göz At"
            actionLink="/items"
            className="bg-white rounded-lg shadow-sm p-8"
          />
        )}
      </div>
    </div>
  )
}