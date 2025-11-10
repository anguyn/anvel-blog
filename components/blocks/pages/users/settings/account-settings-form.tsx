'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertTriangle,
  Mail,
  Globe,
  Clock,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react';

interface AccountSettingsFormProps {
  user: any;
  translations: any;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: '(GMT+7) Ho Chi Minh' },
  { value: 'Asia/Bangkok', label: '(GMT+7) Bangkok' },
  { value: 'Asia/Jakarta', label: '(GMT+7) Jakarta' },
  { value: 'Asia/Singapore', label: '(GMT+8) Singapore' },
  { value: 'Asia/Tokyo', label: '(GMT+9) Tokyo' },
  { value: 'America/New_York', label: '(GMT-5) New York' },
  { value: 'America/Los_Angeles', label: '(GMT-8) Los Angeles' },
  { value: 'Europe/London', label: '(GMT+0) London' },
  { value: 'Europe/Paris', label: '(GMT+1) Paris' },
];

export function AccountSettingsForm({
  user,
  translations,
}: AccountSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(user.language || 'en');
  const [timezone, setTimezone] = useState(user.timezone || 'Asia/Ho_Chi_Minh');

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateStep, setDeactivateStep] = useState(1);
  const [deactivateEmail, setDeactivateEmail] = useState('');
  const [deactivatePassword, setDeactivatePassword] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteUsername, setDeleteUsername] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [randomConfirmText] = useState(
    () => `delete-${Math.random().toString(36).substring(2, 8)}`,
  );

  const handleLanguageChange = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call
      console.log('Language changed to:', language);
      alert('Language updated successfully');
      window.location.href = `/${language}/settings/account`;
    } catch (error) {
      alert('Failed to update language');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimezoneChange = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call
      console.log('Timezone changed to:', timezone);
      alert('Timezone updated successfully');
    } catch (error) {
      alert('Failed to update timezone');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (deactivateStep === 1) {
      if (deactivateEmail !== user.email) {
        alert('Email does not match');
        return;
      }
      setDeactivateStep(2);
    } else {
      if (user.hasPassword && !deactivatePassword) {
        alert('Please enter your password');
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Implement deactivate API
        console.log('Account deactivated');
        alert('Account deactivated successfully. You will be logged out.');
      } catch (error) {
        alert('Failed to deactivate account');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (deleteStep === 1) {
      if (deleteEmail !== user.email) {
        alert('Email does not match');
        return;
      }
      setDeleteStep(2);
    } else if (deleteStep === 2) {
      if (user.hasPassword) {
        if (!deletePassword) {
          alert('Please enter your password');
          return;
        }
      } else {
        if (deleteUsername !== user.username) {
          alert('Username does not match');
          return;
        }
      }
      setDeleteStep(3);
    } else {
      if (deleteConfirmText !== randomConfirmText) {
        alert('Confirmation text does not match');
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Implement delete API
        console.log('Account deleted permanently');
        alert('Account deleted successfully. You will be logged out.');
        // Redirect to home
      } catch (error) {
        alert('Failed to delete account');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    {translations.emailSettings}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {translations.emailSettingsDescription}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>{translations.currentEmail}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input value={user.email} disabled className="flex-1" />
                    {user.emailVerified ? (
                      <span className="rounded-md bg-green-500/10 px-3 py-2 text-xs font-medium whitespace-nowrap text-green-600 dark:text-green-400">
                        {translations.emailVerified}
                      </span>
                    ) : (
                      <Button size="sm" variant="outline">
                        {translations.verifyEmail}
                      </Button>
                    )}
                  </div>
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
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="space-y-6">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{translations.language}</h3>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {translations.languageDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleLanguageChange}
                      disabled={isLoading || language === user.language}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{translations.timezone}</h3>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {translations.timezoneDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleTimezoneChange}
                      disabled={isLoading || timezone === user.timezone}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        translations.update
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20">
          <CardContent className="p-6 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600 dark:text-red-400">
                    {translations.dangerZone}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {translations.dangerZoneDescription}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <h4 className="font-medium">
                          {translations.deactivateAccount}
                        </h4>
                      </div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {translations.deactivateAccountDescription}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeactivateModal(true)}
                      className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10 dark:text-yellow-400"
                    >
                      {translations.deactivateButton}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <h4 className="font-medium text-red-600 dark:text-red-400">
                          {translations.deleteAccount}
                        </h4>
                      </div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {translations.deleteAccountDescription}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                      className="border-red-500/50 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    >
                      {translations.deleteButton}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showDeactivateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => {
              setShowDeactivateModal(false);
              setDeactivateStep(1);
              setDeactivateEmail('');
              setDeactivatePassword('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-lg bg-[var(--color-card)] p-6 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-yellow-500/10 p-2">
                  <XCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold">
                  {translations.confirmDeactivate}
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Step {deactivateStep} of 2
                </p>

                {deactivateStep === 1 && (
                  <div>
                    <Label htmlFor="deactivate-email">
                      {translations.enterEmail}
                    </Label>
                    <Input
                      id="deactivate-email"
                      type="email"
                      value={deactivateEmail}
                      onChange={e => setDeactivateEmail(e.target.value)}
                      placeholder={user.email}
                      className="mt-1"
                    />
                  </div>
                )}

                {deactivateStep === 2 && user.hasPassword && (
                  <div>
                    <Label htmlFor="deactivate-password">
                      {translations.enterPassword}
                    </Label>
                    <Input
                      id="deactivate-password"
                      type="password"
                      value={deactivatePassword}
                      onChange={e => setDeactivatePassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {deactivateStep === 2 && !user.hasPassword && (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Are you sure you want to deactivate your account?
                  </p>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeactivateModal(false);
                      setDeactivateStep(1);
                      setDeactivateEmail('');
                      setDeactivatePassword('');
                    }}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {translations.cancel}
                  </Button>
                  <Button
                    onClick={handleDeactivate}
                    disabled={isLoading}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {translations.processing}
                      </>
                    ) : (
                      translations.confirm
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteStep(1);
              setDeleteEmail('');
              setDeletePassword('');
              setDeleteUsername('');
              setDeleteConfirmText('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-lg bg-[var(--color-card)] p-6 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                  {translations.confirmDelete}
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Step {deleteStep} of 3
                </p>

                {deleteStep === 1 && (
                  <div>
                    <Label htmlFor="delete-email">
                      {translations.enterEmail}
                    </Label>
                    <Input
                      id="delete-email"
                      type="email"
                      value={deleteEmail}
                      onChange={e => setDeleteEmail(e.target.value)}
                      placeholder={user.email}
                      className="mt-1"
                    />
                  </div>
                )}

                {deleteStep === 2 && user.hasPassword && (
                  <div>
                    <Label htmlFor="delete-password">
                      {translations.enterPassword}
                    </Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {deleteStep === 2 && !user.hasPassword && (
                  <div>
                    <Label htmlFor="delete-username">
                      {translations.enterUsername}
                    </Label>
                    <Input
                      id="delete-username"
                      value={deleteUsername}
                      onChange={e => setDeleteUsername(e.target.value)}
                      placeholder={user.username}
                      className="mt-1"
                    />
                  </div>
                )}

                {deleteStep === 3 && (
                  <div>
                    <Label htmlFor="delete-confirm">
                      {translations.typeToConfirm}:{' '}
                      <code className="rounded bg-[var(--color-secondary)] px-2 py-1 text-sm">
                        {randomConfirmText}
                      </code>
                    </Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder={randomConfirmText}
                      className="mt-1 font-mono"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteStep(1);
                      setDeleteEmail('');
                      setDeletePassword('');
                      setDeleteUsername('');
                      setDeleteConfirmText('');
                    }}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {translations.cancel}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {translations.processing}
                      </>
                    ) : (
                      translations.confirm
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
