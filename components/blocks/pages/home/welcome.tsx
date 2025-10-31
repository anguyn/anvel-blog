'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/auth';
import type { User } from '@/store/auth';
import { getThumbnailUrlFromAvatar } from '@/libs/utils';

interface WelcomeRenderBlockProps {
  locale: string;
}

export function WelcomeRenderBlock({ locale }: WelcomeRenderBlockProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('welcome');
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const rememberMe = searchParams.get('rememberMe') === 'true';

  const { data: session, status } = useSession();
  const setAuth = useUserStore(state => state.setAuth);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user) {
      const user: User = {
        id: session.user.id,
        name: session.user.name || null,
        email: session.user.email || '',
        username: session.user.username || null,
        image: session.user.image || null,
        bio: session.user.bio || null,
        roleId: session.user.roleId || null,
        roleName: session.user.roleName || null,
        roleLevel: session.user.roleLevel || 0,
        permissions: session.user.permissions || [],
      };

      setAuth({ user, rememberMe });
      setIsReady(true);

      const timer = setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 3000);

      return () => clearTimeout(timer);
    } else if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    }
  }, [session, status, setAuth, router, callbackUrl, rememberMe, locale]);

  if (status === 'loading' || !isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Floating orbs - hidden on mobile */}
      <div className="absolute inset-0 hidden md:block">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              background: `radial-gradient(circle, ${
                [
                  'rgba(99, 102, 241, 0.3)',
                  'rgba(168, 85, 247, 0.3)',
                  'rgba(236, 72, 153, 0.3)',
                  'rgba(59, 130, 246, 0.3)',
                ][i % 4]
              }, transparent)`,
              filter: 'blur(40px)',
            }}
            initial={{
              x:
                Math.random() *
                (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y:
                Math.random() *
                (typeof window !== 'undefined' ? window.innerHeight : 1080),
            }}
            animate={{
              x: [
                null,
                Math.random() *
                  (typeof window !== 'undefined' ? window.innerWidth : 1920),
                Math.random() *
                  (typeof window !== 'undefined' ? window.innerWidth : 1920),
              ],
              y: [
                null,
                Math.random() *
                  (typeof window !== 'undefined' ? window.innerHeight : 1080),
                Math.random() *
                  (typeof window !== 'undefined' ? window.innerHeight : 1080),
              ],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Sparkle particles - fewer on mobile */}
      <div className="absolute inset-0">
        {[...Array(window.innerWidth < 768 ? 8 : 25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x:
                Math.random() *
                (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y:
                Math.random() *
                (typeof window !== 'undefined' ? window.innerHeight : 1080),
              scale: 0,
            }}
            animate={{
              y: [null, -30],
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeOut',
            }}
          >
            <div className="h-1 w-1 rotate-45 bg-indigo-400 dark:bg-indigo-300" />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative z-10 px-4"
          style={{ perspective: '1000px' }}
        >
          {/* Main welcome card with enhanced effects */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur-2xl md:p-12 dark:bg-gray-900/90 dark:shadow-indigo-500/20"
          >
            {/* Animated border gradient */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm dark:opacity-30"
            />

            {/* Inner glow effect */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.5,
              }}
              className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 blur-3xl"
            />

            <div className="relative z-10">
              {/* Success checkmark with ring effects */}
              <div className="relative mx-auto mb-6 h-24 w-24 md:mb-8 md:h-28 md:w-28">
                {/* Ripple rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: [1, 2, 2.5], opacity: [0.8, 0.3, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: 'easeOut',
                    }}
                    className="absolute inset-0 rounded-full border-2 border-green-400 dark:border-green-500"
                  />
                ))}

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.3,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 shadow-lg shadow-green-500/50 dark:from-green-500 dark:via-emerald-600 dark:to-teal-600"
                >
                  {/* Shine effect */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    style={{ transform: 'skewX(-20deg)' }}
                  />

                  <motion.svg
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
                    className="relative h-12 w-12 text-white md:h-14 md:w-14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    />
                  </motion.svg>
                </motion.div>
              </div>

              {/* Welcome text with stagger effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6, ease: 'easeOut' }}
                  className="mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400"
                >
                  <motion.span
                    initial={{ display: 'inline-block', y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.4 }}
                  >
                    {t('title').split(' ')[0]}
                  </motion.span>{' '}
                  <motion.span
                    initial={{ display: 'inline-block', y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.4 }}
                  >
                    {t('title').split(' ').slice(1).join(' ')}
                  </motion.span>
                </motion.h1>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="mb-3 flex items-center justify-center gap-2"
                >
                  {session?.user?.image ? (
                    <motion.img
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      src={getThumbnailUrlFromAvatar(session.user.image)}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full border-2 border-indigo-200 dark:border-indigo-800"
                    />
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-lg font-bold text-white"
                    >
                      {(session?.user?.name ||
                        session?.user?.username ||
                        session?.user?.email ||
                        '?')[0].toUpperCase()}
                    </motion.div>
                  )}
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.3, duration: 0.5 }}
                    className="text-lg font-semibold text-gray-800 md:text-xl dark:text-gray-100"
                  >
                    {session?.user?.name ||
                      session?.user?.username ||
                      session?.user?.email}
                  </motion.p>
                </motion.div>

                {session?.user?.roleName && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.4, type: 'spring', stiffness: 200 }}
                    className="mb-4 inline-block rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 py-1.5 backdrop-blur-sm dark:from-indigo-500/20 dark:to-purple-500/20"
                  >
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      ✨ {session.user.roleName}
                    </p>
                  </motion.div>
                )}

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="mb-6 text-sm text-gray-600 md:text-base dark:text-gray-400"
                >
                  {t('redirecting')}
                </motion.p>

                {/* Enhanced loading animation */}
                <div className="flex items-center justify-center gap-1.5">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      initial={{ y: 0 }}
                      animate={{
                        y: [-8, 0, -8],
                        backgroundColor: [
                          'rgb(99, 102, 241)',
                          'rgb(168, 85, 247)',
                          'rgb(236, 72, 153)',
                          'rgb(168, 85, 247)',
                          'rgb(99, 102, 241)',
                        ],
                      }}
                      transition={{
                        y: {
                          delay: i * 0.1,
                          duration: 0.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                        backgroundColor: {
                          delay: i * 0.1,
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                      }}
                      className="h-2 w-2 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Corner decorations */}
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 180 }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              className="absolute -top-3 -right-3 h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400/40 to-orange-400/40 blur-xl"
            />
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: -180 }}
              transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
              className="absolute -bottom-3 -left-3 h-16 w-16 rounded-full bg-gradient-to-br from-blue-400/40 to-cyan-400/40 blur-xl"
            />
          </motion.div>

          {/* Floating decorative elements - hidden on mobile */}
          <div className="hidden md:block">
            <motion.div
              initial={{ scale: 0, y: 0 }}
              animate={{ scale: 1, y: [0, -20, 0] }}
              transition={{
                scale: { delay: 1.6, duration: 0.5 },
                y: {
                  delay: 2,
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              className="absolute -top-20 -right-20 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-2xl"
            />
            <motion.div
              initial={{ scale: 0, y: 0 }}
              animate={{ scale: 1, y: [0, 20, 0] }}
              transition={{
                scale: { delay: 1.7, duration: 0.5 },
                y: {
                  delay: 2.5,
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              className="absolute -bottom-20 -left-20 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-400/30 blur-2xl"
            />

            {/* Animated circles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: `${20 + i * 20}%`,
                  left: i % 2 === 0 ? '-10%' : 'auto',
                  right: i % 2 === 1 ? '-10%' : 'auto',
                }}
                animate={{
                  y: [0, -30, 0],
                  x: i % 2 === 0 ? [0, 20, 0] : [0, -20, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 5 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5,
                }}
              >
                <div
                  className="h-3 w-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 opacity-50 dark:from-indigo-500 dark:to-purple-500"
                  style={{ filter: 'blur(1px)' }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom wave decoration - simplified on mobile */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute right-0 bottom-0 left-0 h-24 overflow-hidden opacity-30 md:h-32"
      >
        <motion.svg
          animate={{ x: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-0 h-full w-[200%]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C200,80 400,20 600,50 C800,80 1000,20 1200,50 L1200,120 L0,120 Z"
            className="fill-indigo-500/20 dark:fill-indigo-500/10"
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}
