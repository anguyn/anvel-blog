'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

interface PrivacyPolicyTranslations {
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  infoCollectTitle: string;
  infoCollectDesc: string;
  infoItem1: string;
  infoItem2: string;
  infoItem3: string;
  infoItem4: string;
  infoItem5: string;
  howUseTitle: string;
  howUseDesc: string;
  useItem1: string;
  useItem2: string;
  useItem3: string;
  useItem4: string;
  useItem5: string;
  sharingTitle: string;
  sharingDesc: string;
  shareItem1: string;
  shareItem2: string;
  shareItem3: string;
  shareItem4: string;
  securityTitle: string;
  securityDesc: string;
  rightsTitle: string;
  rightsDesc: string;
  rightItem1: string;
  rightItem2: string;
  rightItem3: string;
  rightItem4: string;
  rightItem5: string;
  contactTitle: string;
  contactDesc: string;
  contactEmail: string;
}

interface PrivacyPolicyRenderProps {
  translations: PrivacyPolicyTranslations;
}

export function PrivacyPolicyRender({
  translations,
}: PrivacyPolicyRenderProps) {
  const t = translations;

  const sections = [
    {
      icon: Eye,
      title: t.infoCollectTitle,
      desc: t.infoCollectDesc,
      items: [t.infoItem1, t.infoItem2, t.infoItem3, t.infoItem4, t.infoItem5],
    },
    {
      icon: Database,
      title: t.howUseTitle,
      desc: t.howUseDesc,
      items: [t.useItem1, t.useItem2, t.useItem3, t.useItem4, t.useItem5],
    },
    {
      icon: UserCheck,
      title: t.sharingTitle,
      desc: t.sharingDesc,
      items: [t.shareItem1, t.shareItem2, t.shareItem3, t.shareItem4],
    },
    {
      icon: Lock,
      title: t.securityTitle,
      desc: t.securityDesc,
      items: [],
    },
    {
      icon: Shield,
      title: t.rightsTitle,
      desc: t.rightsDesc,
      items: [
        t.rightItem1,
        t.rightItem2,
        t.rightItem3,
        t.rightItem4,
        t.rightItem5,
      ],
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="mx-auto max-w-4xl"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="mb-12 text-center">
        <motion.div
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10"
        >
          <Shield className="h-8 w-8 text-[var(--color-primary)]" />
        </motion.div>
        <h1 className="mb-4 text-3xl font-bold">{t.heroTitle}</h1>
        <p className="text-lg text-[var(--color-muted-foreground)]">
          {t.heroSubtitle}
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {t.lastUpdated}
        </p>
      </motion.div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 p-6"
          >
            <div className="flex items-start gap-4 md:mb-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.4 }}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10"
              >
                <section.icon className="h-6 w-6 text-[var(--color-primary)]" />
              </motion.div>
              <div className="flex-1">
                <h2 className="mb-2 text-2xl font-semibold">{section.title}</h2>
                <p className="hidden leading-normal text-[var(--color-muted-foreground)] md:block">
                  {section.desc}
                </p>
              </div>
            </div>

            <p className="mb-2 ml-2 leading-normal text-[var(--color-muted-foreground)] md:hidden">
              {section.desc}
            </p>

            {section.items.length > 0 && (
              <ul className="ml-2 space-y-3 md:ml-16">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[var(--color-muted-foreground)]"
                  >
                    <span className="relative top-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                    <span className="leading-normal">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
      </div>

      {/* Contact Section */}
      <motion.div
        variants={fadeInUp}
        className="mt-12 rounded-xl border-2 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-6 text-center"
      >
        <Mail className="mx-auto mb-4 h-10 w-10 text-[var(--color-primary)]" />
        <h3 className="mb-2 text-xl font-semibold">{t.contactTitle}</h3>
        <p className="mb-4 leading-normal text-[var(--color-muted-foreground)]">
          {t.contactDesc}
        </p>
        <a
          href={`mailto:${t.contactEmail}`}
          className="font-medium text-[var(--color-primary)] hover:underline"
        >
          {t.contactEmail}
        </a>
      </motion.div>
    </motion.div>
  );
}
