import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const languages = [
  {
    name: 'JavaScript',
    slug: 'javascript',
    description:
      'Ngôn ngữ lập trình phổ biến nhất cho web development, chạy trên cả client và server.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    color: '#F7DF1E',
    fileExt: ['.js', '.mjs', '.cjs'],
    popularity: 100,
  },
  {
    name: 'TypeScript',
    slug: 'typescript',
    description:
      'Superset của JavaScript với static typing, giúp code an toàn và dễ maintain hơn.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    color: '#3178C6',
    fileExt: ['.ts', '.tsx'],
    popularity: 95,
  },
  {
    name: 'Python',
    slug: 'python',
    description:
      'Ngôn ngữ đa năng, mạnh về AI/ML, data science, automation và web development.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    color: '#3776AB',
    fileExt: ['.py', '.pyw'],
    popularity: 98,
  },
  {
    name: 'Java',
    slug: 'java',
    description:
      'Ngôn ngữ OOP phổ biến cho enterprise applications, Android development.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    color: '#007396',
    fileExt: ['.java'],
    popularity: 85,
  },
  {
    name: 'C++',
    slug: 'cpp',
    description:
      'Ngôn ngữ hiệu suất cao cho game development, system programming, và embedded systems.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    color: '#00599C',
    fileExt: ['.cpp', '.cc', '.cxx', '.h', '.hpp'],
    popularity: 80,
  },
  {
    name: 'C#',
    slug: 'csharp',
    description:
      'Ngôn ngữ của Microsoft cho .NET development, Unity game development.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    color: '#239120',
    fileExt: ['.cs'],
    popularity: 78,
  },
  {
    name: 'Go',
    slug: 'go',
    description:
      'Ngôn ngữ của Google, đơn giản và hiệu quả cho backend services và cloud applications.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    color: '#00ADD8',
    fileExt: ['.go'],
    popularity: 75,
  },
  {
    name: 'Rust',
    slug: 'rust',
    description:
      'Ngôn ngữ an toàn về memory, hiệu suất cao cho system programming.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg',
    color: '#CE422B',
    fileExt: ['.rs'],
    popularity: 70,
  },
  {
    name: 'PHP',
    slug: 'php',
    description: 'Ngôn ngữ server-side scripting phổ biến cho web development.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
    color: '#777BB4',
    fileExt: ['.php'],
    popularity: 72,
  },
  {
    name: 'Ruby',
    slug: 'ruby',
    description:
      'Ngôn ngữ động, tập trung vào sự đơn giản và năng suất, nổi tiếng với Ruby on Rails.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
    color: '#CC342D',
    fileExt: ['.rb'],
    popularity: 65,
  },
  {
    name: 'Swift',
    slug: 'swift',
    description:
      'Ngôn ngữ của Apple cho iOS, macOS, watchOS và tvOS development.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
    color: '#FA7343',
    fileExt: ['.swift'],
    popularity: 68,
  },
  {
    name: 'Kotlin',
    slug: 'kotlin',
    description:
      'Ngôn ngữ hiện đại cho Android development và JVM applications.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
    color: '#7F52FF',
    fileExt: ['.kt', '.kts'],
    popularity: 67,
  },
  {
    name: 'C',
    slug: 'c',
    description:
      'Ngôn ngữ lập trình nền tảng cho system programming và embedded systems.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    color: '#A8B9CC',
    fileExt: ['.c', '.h'],
    popularity: 82,
  },
  {
    name: 'SQL',
    slug: 'sql',
    description:
      'Ngôn ngữ truy vấn cho database management và data manipulation.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    color: '#4479A1',
    fileExt: ['.sql'],
    popularity: 90,
  },
  {
    name: 'HTML',
    slug: 'html',
    description:
      'Markup language chuẩn cho việc tạo web pages và web applications.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
    color: '#E34F26',
    fileExt: ['.html', '.htm'],
    popularity: 100,
  },
  {
    name: 'CSS',
    slug: 'css',
    description:
      'Style sheet language để mô tả presentation của HTML documents.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
    color: '#1572B6',
    fileExt: ['.css', '.scss', '.sass', '.less'],
    popularity: 100,
  },
  {
    name: 'Shell',
    slug: 'shell',
    description: 'Scripting language cho automation và system administration.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
    color: '#4EAA25',
    fileExt: ['.sh', '.bash', '.zsh'],
    popularity: 88,
  },
  {
    name: 'Dart',
    slug: 'dart',
    description:
      'Ngôn ngữ được tối ưu cho UI, sử dụng chủ yếu với Flutter framework.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg',
    color: '#0175C2',
    fileExt: ['.dart'],
    popularity: 63,
  },
  {
    name: 'Other',
    slug: 'other',
    description:
      'Các ngôn ngữ lập trình khác ít phổ biến hoặc chuyên biệt, không nằm trong danh sách chính.',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/code/code-original.svg',
    color: '#888888',
    fileExt: [],
    popularity: 40,
  },
];

// const languages = [];

async function main() {
  console.log('🌱 Bắt đầu seed languages...');

  for (const lang of languages) {
    const language = await prisma.language.upsert({
      where: { slug: lang.slug },
      update: lang,
      create: lang,
    });
    console.log(`✅ Created/Updated: ${language.name}`);
  }

  console.log('🎉 Seed languages hoàn tất!');
}

main()
  .catch(e => {
    console.error('❌ Error seeding languages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
