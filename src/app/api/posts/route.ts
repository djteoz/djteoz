import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const username = searchParams.get("username");
    const filter = searchParams.get("filter"); // 'friends', 'media', 'text', 'liked'
    const sort = searchParams.get("sort") || "recent"; // 'recent', 'interesting'
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    let whereClause: any = {};
    let currentUserFriends: string[] = [];
    let currentUserCommunityIds: string[] = [];
    let currentUserId: string | null = null;
    let currentUserUsername: string | null = null;

    // Get current user info for friends check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
      try {
        const payload = verifyAccessToken(token) as { username: string };
        currentUserUsername = payload.username;
        const currentUser = await prisma.user.findUnique({
          where: { username: payload.username },
          include: {
            friends: { select: { id: true } },
            communities: { select: { communityId: true } },
          },
        });
        if (currentUser) {
          currentUserId = currentUser.id;
          currentUserFriends = currentUser.friends.map((f: any) => f.id);
          currentUserCommunityIds = currentUser.communities.map(
            (c: any) => c.communityId
          );
        }
      } catch (e) {
        // Ignore token error
      }
    }

    if (username) {
      whereClause.author = { username };
    }

    if (search) {
      whereClause.content = { contains: search, mode: "insensitive" };
    }

    if (filter === "media") {
      whereClause.image = { not: null };
    } else if (filter === "text") {
      whereClause.image = null;
    } else if (filter === "friends" && currentUserId) {
      // Include own posts + friends posts + community posts
      whereClause.OR = [
        { authorId: { in: [...currentUserFriends, currentUserId] } },
        { communityId: { in: currentUserCommunityIds } },
      ];
    } else if (filter === "liked" && currentUserUsername) {
      whereClause.likes = { has: currentUserUsername };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "interesting") {
      // Simple heuristic: sort by views (or we could do complex raw query for likes count)
      // Prisma doesn't support sorting by array length easily without raw query or aggregate
      // For now, let's sort by views as a proxy for "interesting"
      orderBy = { views: "desc" };
    }

    const [postList, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 3,
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: orderBy,
        skip,
        take: limit,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    const enrichedPosts = postList.map(
      (post: {
        id: string;
        content: string;
        image: string | null;
        author: {
          id: string;
          username: string;
          firstName: string | null;
          lastName: string | null;
          avatar: string | null;
        };
        community: {
          id: string;
          name: string;
          slug: string;
          avatar: string | null;
        } | null;
        likes: string[];
        comments: {
          id: string;
          content: string;
          likes: string[];
          createdAt: Date;
          author: {
            username: string;
            firstName: string | null;
            lastName: string | null;
            avatar: string | null;
          };
        }[];
        _count: { comments: number };
        createdAt: Date;
        views: number;
      }) => {
        return {
          id: post.id,
          content: post.content,
          image_url: post.image,
          author: post.author.username,
          authorName:
            `${post.author.firstName || ""} ${
              post.author.lastName || ""
            }`.trim() || post.author.username,
          authorAvatar: post.author.avatar,
          community: post.community
            ? {
                id: post.community.id,
                name: post.community.name,
                slug: post.community.slug,
                avatar: post.community.avatar,
              }
            : null,
          likes: post.likes,
          views: post.views,
          isFriend: currentUserFriends.includes(post.author.id),
          commentsCount: post._count.comments,
          comments: post.comments.map((c) => ({
            id: c.id,
            text: c.content,
            likes: c.likes,
            author: c.author.username,
            authorName:
              `${c.author.firstName || ""} ${c.author.lastName || ""}`.trim() ||
              c.author.username,
            authorAvatar: c.author.avatar,
            createdAt: c.createdAt,
          })),
          createdAt: post.createdAt,
        };
      }
    );

    return NextResponse.json({
      posts: enrichedPosts,
      page,
      limit,
      total,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error("Posts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    const username = payload.username;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { content, image, communityId } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Post content is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // If posting to a community, check membership
    if (communityId) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: communityId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You must be a member to post in this community" },
          { status: 403 }
        );
      }
    }

    const newPost = await prisma.post.create({
      data: {
        content: content.trim(),
        image: image || null,
        authorId: user.id,
        communityId: communityId || null,
      },
      include: {
        author: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        post: {
          id: newPost.id,
          content: newPost.content,
          image_url: newPost.image,
          author: newPost.author.username,
          authorName:
            `${newPost.author.firstName || ""} ${
              newPost.author.lastName || ""
            }`.trim() || newPost.author.username,
          authorAvatar: newPost.author.avatar,
          likes: newPost.likes,
          createdAt: newPost.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
