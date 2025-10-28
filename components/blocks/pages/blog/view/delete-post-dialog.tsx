'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

interface DeletePostDialogProps {
  postId: string;
  postTitle: string;
  locale: string;
  onClose: () => void;
}

export function DeletePostDialog({
  postId,
  postTitle,
  locale,
  onClose,
}: DeletePostDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Post deleted successfully');
        setOpen(false);
        router.push(`/${locale}/blog`);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete post');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Post</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{postTitle}"? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
