import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ unreadCounts: {}, totalUnread: 0 });
  }

  try {
    const unreadMessages = await prisma.message.groupBy({
      by: ["senderId"],
      where: {
        receiverId: session.user.id,
        isRead: false,
      },
      _count: {
        id: true,
      },
    });

    const unreadCounts = unreadMessages.reduce((acc, item) => {
      acc[item.senderId] = item._count.id;
      return acc;
    }, {});

    return NextResponse.json({ unreadCounts });
  } catch (error) {
    return NextResponse.json({ unreadCounts: {} });
  }
}
