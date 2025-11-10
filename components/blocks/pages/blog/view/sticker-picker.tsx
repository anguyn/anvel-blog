'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';
import { cn } from '@/libs/utils';

interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
}

interface StickerPickerProps {
  className?: string;
  onSelect: (sticker: Sticker) => void;
  onClose: () => void;
}

// Animated stickers - dùng GIF hoặc Lottie
const STICKER_CATEGORIES = {
  cute: [
    {
      id: '1',
      name: 'dancing-cat',
      imageUrl: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
      category: 'cute',
    },
    {
      id: '2',
      name: 'cute-bunny-love',
      imageUrl: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif',
      category: 'cute',
    },
    {
      id: '3',
      name: 'excited-bear',
      imageUrl: 'https://media.giphy.com/media/3oEduSbSGpGaRX2Vri/giphy.gif',
      category: 'cute',
    },
    {
      id: '4',
      name: 'sleepy-cat',
      imageUrl: 'https://media.giphy.com/media/11s7Ke7jcNxCHS/giphy.gif',
      category: 'cute',
    },
    {
      id: '5',
      name: 'happy-bunny',
      imageUrl: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif',
      category: 'cute',
    },
    {
      id: '6',
      name: 'hug-bear',
      imageUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
      category: 'cute',
    },
    {
      id: '7',
      name: 'love-heart',
      imageUrl: 'https://media.giphy.com/media/3og0IPMeW6EoM9G7lC/giphy.gif',
      category: 'cute',
    },
    {
      id: '8',
      name: 'happy-dance',
      imageUrl: 'https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif',
      category: 'cute',
    },
    {
      id: '9',
      name: 'waving-cat',
      imageUrl: 'https://media.giphy.com/media/v6aOjy0Qo1fIA/giphy.gif',
      category: 'cute',
    },
    {
      id: '10',
      name: 'heart-bunny',
      imageUrl: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif',
      category: 'cute',
    },
    {
      id: '11',
      name: 'peek-bear',
      imageUrl: 'https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif',
      category: 'cute',
    },
    {
      id: '12',
      name: 'smile-cat',
      imageUrl: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
      category: 'cute',
    },
    {
      id: '13',
      name: 'sleep-bunny',
      imageUrl: 'https://media.giphy.com/media/yFQ0ywscgobJK/giphy.gif',
      category: 'cute',
    },
    {
      id: '14',
      name: 'kiss-bear',
      imageUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
      category: 'cute',
    },
    {
      id: '15',
      name: 'thankyou-heart',
      imageUrl: 'https://media.giphy.com/media/26gsspf0Cj7h5BLmI/giphy.gif',
      category: 'cute',
    },
    {
      id: '16',
      name: 'happy-chick',
      imageUrl: 'https://media.giphy.com/media/McDX95wP9KDeY/giphy.gif',
      category: 'cute',
    },
    {
      id: '17',
      name: 'love-bear',
      imageUrl: 'https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif',
      category: 'cute',
    },
    {
      id: '18',
      name: 'dancing-penguin',
      imageUrl: 'https://media.giphy.com/media/l0MYr6ZzG2Q5w9z2w/giphy.gif',
      category: 'cute',
    },
    {
      id: '19',
      name: 'excited-cat',
      imageUrl: 'https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif',
      category: 'cute',
    },
    {
      id: '20',
      name: 'yay-bunny',
      imageUrl: 'https://media.giphy.com/media/3o7TKsQbJjE7j4bYdy/giphy.gif',
      category: 'cute',
    },
    {
      id: '21',
      name: 'love-fly',
      imageUrl: 'https://media.giphy.com/media/3o6gE5aYpTg0b4jD44/giphy.gif',
      category: 'cute',
    },
    {
      id: '22',
      name: 'cute-blush',
      imageUrl: 'https://media.giphy.com/media/WXB88TeARFVvi/giphy.gif',
      category: 'cute',
    },
    {
      id: '23',
      name: 'smile-bear',
      imageUrl: 'https://media.giphy.com/media/3oz8xKaR836UJOYeOc/giphy.gif',
      category: 'cute',
    },
    {
      id: '24',
      name: 'hug-cat',
      imageUrl: 'https://media.giphy.com/media/l4FGI8GoTL7N4DsyI/giphy.gif',
      category: 'cute',
    },
    {
      id: '25',
      name: 'bye-bunny',
      imageUrl: 'https://media.giphy.com/media/3o6Zt8MgUuvSbkZYWc/giphy.gif',
      category: 'cute',
    },
  ],
  funny: [
    {
      id: '26',
      name: 'funny-cat',
      imageUrl: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
      category: 'funny',
    },
    {
      id: '27',
      name: 'laugh-penguin',
      imageUrl: 'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif',
      category: 'funny',
    },
    {
      id: '28',
      name: 'crazy-dog',
      imageUrl: 'https://media.giphy.com/media/3o6nV6o4N9F1lPqEJG/giphy.gif',
      category: 'funny',
    },
    {
      id: '29',
      name: 'laughing-baby',
      imageUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
      category: 'funny',
    },
    {
      id: '30',
      name: 'troll-bear',
      imageUrl: 'https://media.giphy.com/media/3oKIPtjElfqwMOTbH2/giphy.gif',
      category: 'funny',
    },
    {
      id: '31',
      name: 'rolling-cat',
      imageUrl: 'https://media.giphy.com/media/MFmvJzN1u0EFi/giphy.gif',
      category: 'funny',
    },
    {
      id: '32',
      name: 'banana-dance',
      imageUrl: 'https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif',
      category: 'funny',
    },
    {
      id: '33',
      name: 'falling-bunny',
      imageUrl: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
      category: 'funny',
    },
    {
      id: '34',
      name: 'surprised-cat',
      imageUrl: 'https://media.giphy.com/media/5i7umUqAOYYEw/giphy.gif',
      category: 'funny',
    },
    {
      id: '35',
      name: 'laughing-hamster',
      imageUrl: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif',
      category: 'funny',
    },
    {
      id: '36',
      name: 'funny-dance',
      imageUrl: 'https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif',
      category: 'funny',
    },
    {
      id: '37',
      name: 'troll-cat',
      imageUrl: 'https://media.giphy.com/media/l2Je4lT1EP3m5n2Q0/giphy.gif',
      category: 'funny',
    },
    {
      id: '38',
      name: 'dog-glasses',
      imageUrl: 'https://media.giphy.com/media/YTbZzCkRQCEJa/giphy.gif',
      category: 'funny',
    },
    {
      id: '39',
      name: 'dance-pig',
      imageUrl: 'https://media.giphy.com/media/3o7TKrQw9D6nP6Gp8U/giphy.gif',
      category: 'funny',
    },
    {
      id: '40',
      name: 'wink-bear',
      imageUrl: 'https://media.giphy.com/media/l0MYv2IuRoeJXgJde/giphy.gif',
      category: 'funny',
    },
  ],
};

export function StickerPicker({
  className,
  onSelect,
  onClose,
}: StickerPickerProps) {
  const [activeCategory, setActiveCategory] =
    useState<keyof typeof STICKER_CATEGORIES>('cute');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className={cn(
        'bg-background absolute bottom-full left-0 mb-2 w-full rounded-lg border shadow-xl sm:w-96',
        className,
      )}
    >
      <div className="bg-background flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Chọn sticker</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-background max-h-64 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2">
          {STICKER_CATEGORIES[activeCategory].map(sticker => (
            <motion.button
              key={sticker.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onSelect(sticker);
                onClose();
              }}
              className="hover:bg-muted aspect-square rounded-lg p-2"
            >
              <Image
                src={sticker.imageUrl}
                alt={sticker.name}
                width={80}
                height={80}
                unoptimized // ← QUAN TRỌNG: Để GIF animate
                className="h-full w-full object-contain"
              />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
