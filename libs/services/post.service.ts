import { prisma } from '@/libs/prisma';
import { Prisma, PostStatus, PostVisibility } from '@prisma/client';
import slugify from 'slugify';
import bcrypt from 'bcryptjs';
import {
  PostFilters,
  PostListParams,
  PostFormData,
  PostWithRelations,
  PostListResponse,
  PostDetailResponse,
} from '@/types/post.types';

// ============================================
// POST SERVICE
// ============================================

export class PostService {
  /**
   * Calculate reading time from content
   */
  static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  /**
   * Generate unique slug
   */
  static async generateSlug(
    title: string,
    existingSlug?: string,
  ): Promise<string> {
    let slug = slugify(title, {
      lower: true,
      strict: true,
      locale: 'vi',
      remove: /[*+~.()'"!:@]/g,
    });

    let counter = 1;
    let finalSlug = slug;

    while (true) {
      const exists = await prisma.post.findUnique({
        where: { slug: finalSlug },
        select: { id: true, slug: true },
      });

      if (!exists || exists.slug === existingSlug) {
        break;
      }

      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  /**
   * Build where clause for filters
   */
  static buildWhereClause(filters?: PostFilters): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {};

    if (!filters) return where;

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    if (filters.visibility && filters.visibility.length > 0) {
      where.visibility = { in: filters.visibility };
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            slug: { in: filters.tags },
          },
        },
      };
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.isPinned !== undefined) {
      where.isPinned = filters.isPinned;
    }

    return where;
  }

  /**
   * Get post list with filters
   */
  static async getPostList(params: PostListParams): Promise<PostListResponse> {
    const { filters, sort, pagination } = params;

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);

    const orderBy: Prisma.PostOrderByWithRelationInput = {};
    if (sort?.field) {
      orderBy[sort.field] = sort.order || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  type: true,
                  color: true,
                },
              },
            },
          },
          media: {
            include: {
              media: {
                select: {
                  id: true,
                  filename: true,
                  originalName: true,
                  url: true,
                  thumbnailUrl: true,
                  alt: true,
                  caption: true,
                  type: true,
                  width: true,
                  height: true,
                  size: true,
                  mimeType: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              comments: true,
              views: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts: posts as PostWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: filters || {},
    };
  }

  /**
   * Get post by slug with optional language preference
   */
  static async getPostBySlug(
    slug: string,
    userId?: string,
    preferredLanguage?: string, // 'en' or 'vi' from locale
  ): Promise<PostDetailResponse | null> {
    // First, try to find post by slug (could be original or translation slug)
    let post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                color: true,
              },
            },
          },
        },
        media: {
          include: {
            media: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                url: true,
                thumbnailUrl: true,
                alt: true,
                caption: true,
                type: true,
                width: true,
                height: true,
                size: true,
                mimeType: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
            views: true,
            favorites: true,
          },
        },
      },
    });

    // If not found by post slug, try to find by translation slug
    if (!post) {
      const translation = await prisma.postTranslation.findUnique({
        where: { slug },
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  bio: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  icon: true,
                  color: true,
                },
              },
              tags: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      type: true,
                      color: true,
                    },
                  },
                },
              },
              media: {
                include: {
                  media: {
                    select: {
                      id: true,
                      filename: true,
                      originalName: true,
                      url: true,
                      thumbnailUrl: true,
                      alt: true,
                      caption: true,
                      type: true,
                      width: true,
                      height: true,
                      size: true,
                      mimeType: true,
                    },
                  },
                },
                orderBy: {
                  order: 'asc',
                },
              },
              _count: {
                select: {
                  comments: true,
                  views: true,
                  favorites: true,
                },
              },
            },
          },
        },
      });

      if (translation) {
        post = translation.post;
      }
    }

    if (!post) return null;

    // Check access
    const hasAccess = await this.checkPostAccess(post, userId);
    if (!hasAccess) {
      throw new Error('ACCESS_DENIED');
    }

    // Get related posts
    const relatedPosts = await this.getRelatedPosts(post.id, post.categoryId);

    // Get all translations
    const translations = await prisma.postTranslation.findMany({
      where: { postId: post.id },
      select: {
        language: true,
        title: true,
        excerpt: true,
        content: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        isAITranslated: true,
      },
    });

    // Determine content to display based on preferred language
    const originalLang = post.language;
    const requestedLang = preferredLanguage || originalLang;

    let displayContent = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      slug: post.slug,
    };

    let isTranslated = false;
    let currentLanguage = originalLang;

    // If requested language differs from original, use translation
    if (requestedLang !== originalLang) {
      const translation = translations.find(t => t.language === requestedLang);

      if (translation) {
        displayContent = {
          title: translation.title,
          excerpt: translation.excerpt || post.excerpt,
          content: translation.content,
          metaTitle: translation.metaTitle || translation.title,
          metaDescription:
            translation.metaDescription ||
            translation.excerpt ||
            post.metaDescription,
          slug: translation.slug,
        };
        isTranslated = true;
        currentLanguage = requestedLang;
      }
    }

    // Build content info
    const contentInfo = {
      isTranslated,
      originalLanguage: originalLang,
      currentLanguage,
      availableLanguages: [originalLang, ...translations.map(t => t.language)],
      translationQuality: isTranslated
        ? translations.find(t => t.language === currentLanguage)?.isAITranslated
          ? ('ai' as const)
          : ('human' as const)
        : null,
    };

    return {
      post: {
        ...post,
        ...displayContent, // Override with translated content if applicable
      } as PostWithRelations,
      relatedPosts,
      translations: translations.map(t => ({
        language: t.language,
        title: t.title,
        slug: t.slug,
        excerpt: t.excerpt,
        content: t.content,
        metaTitle: t.metaTitle,
        metaDescription: t.metaDescription,
        isAITranslated: t.isAITranslated,
      })),
      contentInfo,
    };
  }

  /**
   * Check post access
   */
  static async checkPostAccess(post: any, userId?: string): Promise<boolean> {
    if (
      post.visibility === PostVisibility.PUBLIC &&
      post.status === PostStatus.PUBLISHED
    ) {
      return true;
    }

    if (
      post.visibility === PostVisibility.UNLISTED &&
      post.status === PostStatus.PUBLISHED
    ) {
      return true;
    }

    if (userId && post.authorId === userId) {
      return true;
    }

    if (
      post.visibility === PostVisibility.PASSWORD &&
      post.status === PostStatus.PUBLISHED
    ) {
      return true;
    }

    if (post.visibility === PostVisibility.PRIVATE) {
      return userId === post.authorId;
    }

    if (post.visibility === PostVisibility.RESTRICTED && userId) {
      const access = await prisma.postAccess.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId,
          },
        },
      });
      return !!access;
    }

    if (post.status !== PostStatus.PUBLISHED) {
      return userId === post.authorId;
    }

    return false;
  }

  /**
   * Get related posts
   */
  static async getRelatedPosts(
    postId: string,
    categoryId?: string | null,
    limit: number = 5,
  ): Promise<PostWithRelations[]> {
    const where: Prisma.PostWhereInput = {
      id: { not: postId },
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit,
      orderBy: {
        viewCount: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        media: {
          include: {
            media: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                url: true,
                thumbnailUrl: true,
                alt: true,
                caption: true,
                type: true,
                width: true,
                height: true,
                size: true,
                mimeType: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
            views: true,
            favorites: true,
          },
        },
      },
    });

    return posts as PostWithRelations[];
  }

  /**
   * Create post
   */
  static async createPost(
    data: PostFormData,
    authorId: string,
  ): Promise<PostWithRelations> {
    const slug = data.slug
      ? await this.generateSlug(data.slug)
      : await this.generateSlug(data.title);

    const readingTime = this.calculateReadingTime(data.content);

    let passwordHash: string | undefined;
    if (data.isPasswordProtected && data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    const postData: Prisma.PostCreateInput = {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      contentFormat: data.contentFormat,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: data.metaKeywords,
      ogImage: data.ogImage,
      type: data.type,
      status: data.status,
      visibility: data.visibility,
      isPasswordProtected: data.isPasswordProtected,
      passwordHash,
      isFeatured: data.isFeatured,
      isPinned: data.isPinned,
      featuredImage: data.featuredImage,
      publishedAt:
        data.status === PostStatus.PUBLISHED ? new Date() : data.publishedAt,
      scheduledFor: data.scheduledFor,
      readingTime,
      author: {
        connect: { id: authorId },
      },
    };

    if (data.categoryId) {
      postData.category = {
        connect: { id: data.categoryId },
      };
    }

    const post = await prisma.post.create({
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        media: {
          include: {
            media: true,
          },
        },
      },
    });

    // Connect tags
    if (data.tags && data.tags.length > 0) {
      await Promise.all(
        data.tags.map(tagId =>
          prisma.postTag.create({
            data: {
              postId: post.id,
              tagId,
            },
          }),
        ),
      );
    }

    // Connect media
    if (data.mediaIds && data.mediaIds.length > 0) {
      await Promise.all(
        data.mediaIds.map((mediaId, index) =>
          prisma.postMedia.create({
            data: {
              postId: post.id,
              mediaId,
              order: index,
            },
          }),
        ),
      );
    }

    // Grant access to specific users
    if (
      data.visibility === PostVisibility.RESTRICTED &&
      data.allowedUserEmails &&
      data.allowedUserEmails.length > 0
    ) {
      const users = await prisma.user.findMany({
        where: {
          email: { in: data.allowedUserEmails },
        },
        select: { id: true },
      });

      await Promise.all(
        users.map(user =>
          prisma.postAccess.create({
            data: {
              postId: post.id,
              userId: user.id,
              grantedBy: authorId,
            },
          }),
        ),
      );
    }

    return post as PostWithRelations;
  }

  /**
   * Update post - OPTIMIZED VERSION
   */
  static async updatePost(
    postId: string,
    data: Partial<PostFormData>,
    userId: string,
  ): Promise<PostWithRelations> {
    // Verify ownership
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, slug: true },
    });

    if (!existingPost) {
      throw new Error('POST_NOT_FOUND');
    }

    if (existingPost.authorId !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    // Build update data
    const updateData: Prisma.PostUpdateInput = {};

    // ========== BASIC FIELDS ==========
    if (data.title !== undefined) {
      updateData.title = data.title;

      // Auto-update slug if title changed
      const slug = data.slug
        ? await this.generateSlug(data.slug, existingPost.slug)
        : await this.generateSlug(data.title, existingPost.slug);
      updateData.slug = slug;
    }

    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;

    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.readingTime = this.calculateReadingTime(data.content);
    }

    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.language !== undefined) updateData.language = data.language;

    // ========== BOOLEAN FIELDS ==========
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
    if (data.isPasswordProtected !== undefined) {
      updateData.isPasswordProtected = data.isPasswordProtected;
    }

    // ========== DATE FIELDS ==========
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt;
    }
    if (data.scheduledFor !== undefined) {
      updateData.scheduledFor = data.scheduledFor;
    }

    // ========== IMAGE FIELDS ==========
    console.log('Ra feature image nè: ', data.featuredImage);
    if (data.featuredImage !== undefined) {
      updateData.featuredImage = data.featuredImage;
    }

    // ========== SEO FIELDS ==========
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) {
      updateData.metaDescription = data.metaDescription;
    }
    if (data.metaKeywords !== undefined) {
      updateData.metaKeywords = data.metaKeywords;
    }
    if (data.ogImage !== undefined) updateData.ogImage = data.ogImage;

    // ========== CONTENT FORMAT ==========
    if (data.contentFormat !== undefined) {
      updateData.contentFormat = data.contentFormat;
    }

    // ========== PASSWORD HANDLING ==========
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    // ========== CATEGORY RELATIONSHIP ==========
    if (data.categoryId !== undefined) {
      if (
        !data.categoryId ||
        data.categoryId === '' ||
        data.categoryId === '0'
      ) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: data.categoryId } };
      }
    }

    // Update post
    const post = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                color: true,
              },
            },
          },
        },
        media: {
          include: {
            media: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                url: true,
                thumbnailUrl: true,
                alt: true,
                caption: true,
                type: true,
                width: true,
                height: true,
                size: true,
                mimeType: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
            views: true,
            favorites: true,
          },
        },
      },
    });

    // ========== UPDATE TAGS ==========
    if (data.tagIds !== undefined) {
      await prisma.postTag.deleteMany({
        where: { postId },
      });

      if (data.tagIds.length > 0) {
        await prisma.postTag.createMany({
          data: data.tagIds.map(tagId => ({
            postId,
            tagId,
          })),
        });
      }
    }

    // ========== UPDATE MEDIA ==========
    if (data.mediaIds !== undefined) {
      await prisma.postMedia.deleteMany({
        where: { postId },
      });

      if (data.mediaIds.length > 0) {
        await prisma.postMedia.createMany({
          data: data.mediaIds.map((mediaId, index) => ({
            postId,
            mediaId,
            order: index,
          })),
        });
      }
    }

    // ========== UPDATE RESTRICTED ACCESS ==========
    if (
      data.visibility === PostVisibility.RESTRICTED &&
      data.allowedUserEmails !== undefined
    ) {
      await prisma.postAccess.deleteMany({
        where: { postId },
      });

      if (data.allowedUserEmails.length > 0) {
        const users = await prisma.user.findMany({
          where: {
            email: { in: data.allowedUserEmails },
          },
          select: { id: true },
        });

        await prisma.postAccess.createMany({
          data: users.map(user => ({
            postId,
            userId: user.id,
            grantedBy: userId,
          })),
        });
      }
    }

    return post as PostWithRelations;
  }

  /**
   * Delete post
   */
  static async deletePost(postId: string, userId: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new Error('POST_NOT_FOUND');
    }

    if (post.authorId !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    await prisma.post.delete({
      where: { id: postId },
    });
  }

  /**
   * Record view
   */
  static async recordView(
    postId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string,
  ): Promise<void> {
    await Promise.all([
      prisma.postView.create({
        data: {
          postId,
          userId,
          ipAddress,
          userAgent,
          referrer,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: {
          viewCount: { increment: 1 },
        },
      }),
    ]);
  }

  /**
   * Toggle favorite
   */
  static async toggleFavorite(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return false;
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          postId,
        },
      });
      return true;
    }
  }

  /**
   * Verify password
   */
  static async verifyPostPassword(
    postId: string,
    password: string,
  ): Promise<boolean> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { passwordHash: true, isPasswordProtected: true },
    });

    if (!post || !post.isPasswordProtected || !post.passwordHash) {
      return false;
    }

    return bcrypt.compare(password, post.passwordHash);
  }

  /**
   * Get post stats
   */
  static async getPostStats(userId?: string) {
    const where: Prisma.PostWhereInput = userId ? { authorId: userId } : {};

    const [totalPosts, publishedPosts, draftPosts, scheduledPosts, viewStats] =
      await Promise.all([
        prisma.post.count({ where }),
        prisma.post.count({
          where: { ...where, status: PostStatus.PUBLISHED },
        }),
        prisma.post.count({ where: { ...where, status: PostStatus.DRAFT } }),
        prisma.post.count({
          where: { ...where, status: PostStatus.SCHEDULED },
        }),
        prisma.post.aggregate({
          where,
          _sum: {
            viewCount: true,
            likeCount: true,
            commentCount: true,
          },
        }),
      ]);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      totalViews: viewStats._sum.viewCount || 0,
      totalLikes: viewStats._sum.likeCount || 0,
      totalComments: viewStats._sum.commentCount || 0,
    };
  }
}
