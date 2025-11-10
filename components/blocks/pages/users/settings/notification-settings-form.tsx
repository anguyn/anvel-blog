'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/common/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  MessageSquare,
  UserPlus,
  AtSign,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface NotificationsSettingsFormProps {
  user: any;
  translations: any;
}

export function NotificationsSettingsForm({
  user,
  translations,
}: NotificationsSettingsFormProps) {
  // Email Notifications
  const [emailNotifications, setEmailNotifications] = useState(
    user.emailNotifications ?? true,
  );
  const [newComment, setNewComment] = useState(true);
  const [commentReply, setCommentReply] = useState(true);
  const [newFollower, setNewFollower] = useState(true);
  const [mentionInComment, setMentionInComment] = useState(true);

  const [pushNotifications, setPushNotifications] = useState(
    user.pushNotifications ?? true,
  );

  const [marketingEmails, setMarketingEmails] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);

  const [summaryFrequency, setSummaryFrequency] = useState('daily');

  const handleToggle = async (key: string, value: boolean) => {
    // TODO: Implement API call
    // await fetch('/api/user/notifications', {
    //   method: 'PATCH',
    //   body: JSON.stringify({ [key]: value })
    // });
    console.log(`Updated ${key} to ${value}`);
  };

  const handleSummaryChange = async (value: string) => {
    setSummaryFrequency(value);
    // TODO: Implement API call
    console.log('Summary frequency changed to:', value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    {translations.emailNotifications}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {translations.emailNotificationsDescription}
                  </p>
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={checked => {
                  setEmailNotifications(checked);
                  handleToggle('emailNotifications', checked);
                }}
              />
            </div>

            {emailNotifications && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pl-12"
              >
                <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    <div className="space-y-1">
                      <Label className="font-medium">
                        {translations.newComment}
                      </Label>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {translations.newCommentDescription}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={newComment}
                    onCheckedChange={checked => {
                      setNewComment(checked);
                      handleToggle('newComment', checked);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    <div className="space-y-1">
                      <Label className="font-medium">
                        {translations.commentReply}
                      </Label>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {translations.commentReplyDescription}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={commentReply}
                    onCheckedChange={checked => {
                      setCommentReply(checked);
                      handleToggle('commentReply', checked);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    <div className="space-y-1">
                      <Label className="font-medium">
                        {translations.newFollower}
                      </Label>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {translations.newFollowerDescription}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={newFollower}
                    onCheckedChange={checked => {
                      setNewFollower(checked);
                      handleToggle('newFollower', checked);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <AtSign className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    <div className="space-y-1">
                      <Label className="font-medium">
                        {translations.mentionInComment}
                      </Label>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {translations.mentionInCommentDescription}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={mentionInComment}
                    onCheckedChange={checked => {
                      setMentionInComment(checked);
                      handleToggle('mentionInComment', checked);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    {translations.pushNotifications}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {translations.pushNotificationsDescription}
                  </p>
                </div>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={checked => {
                  setPushNotifications(checked);
                  handleToggle('pushNotifications', checked);
                }}
              />
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Marketing & Updates</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Receive updates about new features and tips
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <div className="space-y-1">
                    <Label className="font-medium">
                      {translations.marketingEmails}
                    </Label>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.marketingEmailsDescription}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={marketingEmails}
                  onCheckedChange={checked => {
                    setMarketingEmails(checked);
                    handleToggle('marketingEmails', checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <div className="space-y-1">
                    <Label className="font-medium">
                      {translations.weeklyDigest}
                    </Label>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.weeklyDigestDescription}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={weeklyDigest}
                  onCheckedChange={checked => {
                    setWeeklyDigest(checked);
                    handleToggle('weeklyDigest', checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <div className="space-y-1">
                    <Label className="font-medium">
                      {translations.productUpdates}
                    </Label>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.productUpdatesDescription}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={productUpdates}
                  onCheckedChange={checked => {
                    setProductUpdates(checked);
                    handleToggle('productUpdates', checked);
                  }}
                />
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {translations.notificationSummary}
                </h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.notificationSummaryDescription}
                </p>
              </div>
            </div>

            <Select
              value={summaryFrequency}
              onValueChange={handleSummaryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instantly">
                  {translations.instantly}
                </SelectItem>
                <SelectItem value="daily">{translations.daily}</SelectItem>
                <SelectItem value="weekly">{translations.weekly}</SelectItem>
                <SelectItem value="never">{translations.never}</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
