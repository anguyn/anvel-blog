'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import {
  Code2,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
  FileCode,
  MessageSquare,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Terminal,
  Globe,
  Rocket,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/libs/hooks/use-current-user';
import { useRef } from 'react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any },
  },
};

interface HomeTranslations {
  badge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroDescription: string;
  createSnippet: string;
  exploreSnippets: string;
  readBlog: string;
  scrollDown: string;

  // Features section
  featuresTitle: string;
  featuresSubtitle: string;
  codeSnippetsTitle: string;
  codeSnippetsDesc: string;
  personalBlogTitle: string;
  personalBlogDesc: string;
  communityTitle: string;
  communityDesc: string;
  instantAnalysisTitle: string;
  instantAnalysisDesc: string;

  // How it works
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;

  // Stats
  statsTitle: string;
  snippetsCount: string;
  usersCount: string;
  articlesCount: string;

  // Testimonial
  testimonialTitle: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string;

  // CTA
  ctaTitle: string;
  ctaDescription: string;
  getStarted: string;
}

interface HomeRenderBlockProps {
  locale: string;
  translations: HomeTranslations;
}

export function HomeRenderBlock({
  locale,
  translations,
}: HomeRenderBlockProps) {
  const { user } = useCurrentUser();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const statsRef = useRef(null);

  const featuresInView = useInView(featuresRef, {
    once: true,
    margin: '-100px',
  });
  const howItWorksInView = useInView(howItWorksRef, {
    once: true,
    margin: '-100px',
  });
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });

  return (
    <>
      {/* Floating Background Elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            y: [0, -30, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 h-64 w-64 rounded-full bg-[var(--color-primary)]/5 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-40 right-10 h-96 w-96 rounded-full bg-[var(--color-primary)]/5 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 20, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 left-1/3 h-80 w-80 rounded-full bg-[var(--color-primary)]/5 blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[30rem] overflow-hidden border-b border-[var(--color-border)]"
      >
        <div className="container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-secondary)]/50 px-6 py-3 text-sm backdrop-blur-sm"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                </motion.div>
                <span className="font-medium">{translations.badge}</span>
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-3xl leading-tight font-bold tracking-tight md:text-5xl lg:text-6xl"
            >
              {translations.heroTitle} <br />
              <motion.span
                className="relative inline-block text-[var(--color-primary)]"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {translations.heroTitleHighlight}
                <motion.div
                  className="absolute -bottom-2 left-0 h-1 w-full bg-[var(--color-primary)]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </motion.span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-[var(--color-muted-foreground)] md:text-xl"
            >
              {translations.heroDescription}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" asChild className="group gap-2 px-8">
                  <Link href={`/${locale}/snippets/new`}>
                    <Code2 className="h-5 w-5 transition-transform group-hover:rotate-12" />
                    {translations.createSnippet}
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" asChild className="group">
                  <Link href={`/${locale}/snippets`}>
                    {translations.exploreSnippets}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="ghost" asChild className="group">
                  <Link href={`/${locale}/blog`}>
                    <BookOpen className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    {translations.readBlog}
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Floating Icons */}
            <div className="relative mt-20 h-40">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute top-0 left-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/80 p-4 shadow-lg backdrop-blur-sm"
              >
                <Terminal className="h-8 w-8 text-[var(--color-primary)]" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                className="absolute top-10 right-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/80 p-4 shadow-lg backdrop-blur-sm"
              >
                <Rocket className="h-8 w-8 text-[var(--color-primary)]" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -25, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/80 p-4 shadow-lg backdrop-blur-sm"
              >
                <Globe className="h-8 w-8 text-[var(--color-primary)]" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {translations.scrollDown}
          </span>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-8 w-5 rounded-full border-2 border-[var(--color-border)]">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="border-b border-[var(--color-border)] py-20 md:py-32"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mx-auto"
          >
            {/* Section Header */}
            <motion.div variants={fadeInUp} className="mb-16 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={featuresInView ? { scale: 1 } : { scale: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary)]/10"
              >
                <Layers className="h-8 w-8 text-[var(--color-primary)]" />
              </motion.div>
              <h2 className="mb-4 text-4xl font-bold md:text-4xl">
                {translations.featuresTitle}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[var(--color-muted-foreground)]">
                {translations.featuresSubtitle}
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: FileCode,
                  title: translations.codeSnippetsTitle,
                  desc: translations.codeSnippetsDesc,
                  color: 'from-blue-500/20 to-cyan-500/20',
                },
                {
                  icon: BookOpen,
                  title: translations.personalBlogTitle,
                  desc: translations.personalBlogDesc,
                  color: 'from-purple-500/20 to-pink-500/20',
                },
                {
                  icon: Users,
                  title: translations.communityTitle,
                  desc: translations.communityDesc,
                  color: 'from-green-500/20 to-emerald-500/20',
                },
                {
                  icon: Zap,
                  title: translations.instantAnalysisTitle,
                  desc: translations.instantAnalysisDesc,
                  color: 'from-yellow-500/20 to-orange-500/20',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group relative"
                >
                  <Card className="relative h-full overflow-hidden border-[var(--color-border)] transition-all hover:border-[var(--color-primary)]/50 hover:shadow-xl">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity group-hover:opacity-100`}
                    />
                    <CardHeader className="relative">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] transition-all group-hover:border-[var(--color-primary)]/50"
                      >
                        <feature.icon className="h-6 w-6 text-[var(--color-primary)]" />
                      </motion.div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      <p className="leading-normal text-[var(--color-muted-foreground)]">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        ref={howItWorksRef}
        className="relative overflow-hidden border-b border-[var(--color-border)] py-20 md:py-32"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate={howItWorksInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mx-auto"
          >
            {/* Section Header */}
            <motion.div variants={fadeInUp} className="mb-20 text-center">
              <h2 className="mb-4 text-4xl font-bold md:text-4xl">
                {translations.howItWorksTitle}
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-normal text-[var(--color-muted-foreground)]">
                {translations.howItWorksSubtitle}
              </p>
            </motion.div>

            {/* Steps */}
            <div className="relative space-y-20">
              {/* Connection Line */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={howItWorksInView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-0 left-1/2 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-[var(--color-primary)]/50 to-transparent md:block"
              />

              {[
                {
                  number: '01',
                  title: translations.step1Title,
                  desc: translations.step1Desc,
                  icon: Users,
                },
                {
                  number: '02',
                  title: translations.step2Title,
                  desc: translations.step2Desc,
                  icon: FileCode,
                },
                {
                  number: '03',
                  title: translations.step3Title,
                  desc: translations.step3Desc,
                  icon: TrendingUp,
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  variants={index % 2 === 0 ? slideInLeft : slideInRight}
                  className={`flex flex-col items-center gap-8 md:flex-row ${
                    index % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex-1">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/80 p-8 backdrop-blur-sm"
                    >
                      <div className="mb-4 text-5xl font-bold text-[var(--color-primary)]/20">
                        {step.number}
                      </div>
                      <h3 className="mb-3 text-2xl font-semibold">
                        {step.title}
                      </h3>
                      <p className="leading-normal text-[var(--color-muted-foreground)]">
                        {step.desc}
                      </p>
                    </motion.div>
                  </div>

                  <motion.div
                    transition={{ duration: 0.5 }}
                    className="relative z-10 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-4 border-[var(--color-background)] bg-[var(--color-primary)] shadow-lg"
                  >
                    <step.icon className="h-10 w-10 text-[var(--color-primary-foreground)]" />
                  </motion.div>

                  <div className="hidden flex-1 md:block" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        ref={statsRef}
        className="border-b border-[var(--color-border)] py-20 md:py-32"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate={statsInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-16 text-center text-4xl font-bold md:text-4xl"
            >
              {translations.statsTitle}
            </motion.h2>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  value: '5K+',
                  label: translations.snippetsCount,
                  icon: Code2,
                },
                { value: '2K+', label: translations.usersCount, icon: Users },
                {
                  value: '100+',
                  label: translations.articlesCount,
                  icon: BookOpen,
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  whileHover={{ y: -10 }}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-8 text-center transition-all hover:border-[var(--color-primary)]/50 hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="relative mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10"
                  >
                    <stat.icon className="h-8 w-8 text-[var(--color-primary)]" />
                  </motion.div>
                  <motion.div
                    className="relative mb-2 text-4xl font-bold text-[var(--color-primary)]"
                    initial={{ scale: 0 }}
                    animate={statsInView ? { scale: 1 } : { scale: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      delay: 0.1 * index,
                    }}
                  >
                    {stat.value}
                  </motion.div>
                  <p className="relative text-lg leading-normal text-[var(--color-muted-foreground)]">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="border-b border-[var(--color-border)] py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="mx-auto max-w-5xl"
          >
            <motion.div variants={fadeInUp} className="text-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10"
              >
                <MessageSquare className="h-8 w-8 text-[var(--color-primary)]" />
              </motion.div>

              <h2 className="mb-12 text-3xl font-bold md:text-4xl">
                {translations.testimonialTitle}
              </h2>

              <motion.div
                variants={scaleIn}
                className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-12 px-20 pt-14"
              >
                <div className="absolute top-1 left-3 text-8xl text-[var(--color-primary)]/20">
                  ❝
                </div>
                <blockquote className="relative mb-8 text-xl leading-relaxed italic md:text-2xl">
                  {translations.testimonialQuote}
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="h-14 w-14 rounded-full bg-[var(--color-primary)]/20"
                  />
                  <div className="text-left">
                    <div className="font-semibold">
                      {translations.testimonialAuthor}
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {translations.testimonialRole}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-3xl border-2 border-[var(--color-primary)]/30 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent p-12 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[var(--color-primary)]/5 blur-3xl"
              />

              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="relative mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)]"
              >
                <Shield className="h-10 w-10 text-[var(--color-primary-foreground)]" />
              </motion.div>

              <h2 className="relative mb-4 text-3xl font-bold md:text-4xl">
                {translations.ctaTitle}
              </h2>
              <p className="relative mx-auto mb-8 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
                {translations.ctaDescription}
              </p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" asChild className="relative gap-2 px-8">
                  <Link
                    href={
                      user ? `/${locale}/snippets/new` : `/${locale}/register`
                    }
                  >
                    <Heart className="h-5 w-5" />
                    {translations.getStarted}
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
