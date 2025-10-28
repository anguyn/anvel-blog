import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/libs/server/r2';
import { auth } from '@/libs/server/auth';
import { getApiTranslations } from '@/i18n/i18n';

export async function POST(request: Request) {
  const { t: translate } = await getApiTranslations(request);
  const t = translate.api.upload;

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: t.unauthorized }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: t.noFileProvided }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: translate('api.upload.fileTooLarge', { maxSize: '5MB' }) },
        { status: 400 },
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, file.name, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    );
  }
}
