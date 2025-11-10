'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Copy, Check, Shield, Download } from 'lucide-react';
import Image from 'next/image';

interface TwoFactorSetupProps {
  onClose: () => void;
  translations: any;
}

export function TwoFactorSetup({ onClose, translations }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [isLoading, setIsLoading] = useState(true);
  const [qrCode, setQrCode] = useState('/images/qr-code-2fa.png');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/2fa/setup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setStep('backup');
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      alert(
        translations.invalid2FACode ||
          'Invalid verification code. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadBackupCodes = () => {
    const text = `Two-Factor Authentication Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-[var(--color-card)] shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">
                {translations.setup2FA || 'Set Up Two-Factor Authentication'}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6">
            {step === 'qr' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
                    {translations.scan2FAQR ||
                      'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'}
                  </p>

                  <motion.div
                    className="relative mx-auto my-8 h-64 w-64 overflow-hidden rounded-lg border-4 border-[var(--color-border)]"
                    animate={{
                      opacity: isLoading ? 0.4 : 1,
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <Image
                      priority
                      src={qrCode}
                      alt="2FA QR Code"
                      className="object-cover"
                      fill
                    />

                    {isLoading && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-[var(--color-muted-foreground)]/50 to-transparent"
                        animate={{
                          y: ['100%', '-100%'],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <Label>
                    {translations.manualEntry || 'Or enter this code manually:'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(secret, 'secret')}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => setStep('verify')}
                  className="w-full"
                  disabled={isLoading}
                >
                  {translations.next || 'Next'}
                </Button>
              </motion.div>
            )}

            {step === 'verify' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
                      {translations.enter2FACode ||
                        'Enter the 6-digit code from your authenticator app to verify the setup.'}
                    </p>

                    <Label htmlFor="verificationCode">
                      {translations.verificationCode || 'Verification Code'}
                    </Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={e =>
                        setVerificationCode(
                          e.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                      placeholder="000000"
                      required
                      maxLength={6}
                      className="mt-1 text-center font-mono text-2xl tracking-widest"
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('qr')}
                      className="flex-1"
                    >
                      {translations.back || 'Back'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || verificationCode.length !== 6}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {translations.verifying || 'Verifying...'}
                        </>
                      ) : (
                        translations.verify || 'Verify'
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'backup' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="mb-4 text-center">
                  <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {translations.twoFactorEnabled ||
                      '2FA Enabled Successfully!'}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {translations.saveBackupCodes ||
                      'Save these backup codes in a safe place. You can use them to access your account if you lose your phone.'}
                  </p>
                </div>

                <div className="rounded-lg bg-[var(--color-secondary)] p-4">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="rounded border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(backupCodes.join('\n'), 'backup')
                    }
                    className="flex-1"
                  >
                    {copiedBackup ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {translations.copied || 'Copied!'}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {translations.copy || 'Copy'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadBackupCodes}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {translations.download || 'Download'}
                  </Button>
                </div>

                <Button onClick={handleComplete} className="w-full">
                  {translations.done || 'Done'}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
