import { Album } from '../types/album';
import { colors } from '../theme';

const spineColors = [
  colors.spineRed,
  colors.spineBlue,
  colors.spineGreen,
  colors.spineBrown,
  colors.spineCream,
  colors.spineMustard,
  colors.spinePink,
  colors.spineSage,
  colors.spineNavy,
  colors.spineTerra,
];

const coverColors = [
  '#C75B5B', '#6B8FB5', '#7BA07B', '#9B8365',
  '#E4D5B9', '#D4AB45', '#C891A0', '#95AC88',
  '#4D5F7B', '#B0836A',
];

const albumTitles = [
  '제주도 여행 2026',
  '우리의 1주년',
  '졸업 앨범',
  '가족 나들이',
  '벚꽃 피크닉',
  '크리스마스 2025',
  '여름 바다',
  '카페 투어',
  '생일 파티',
  '일상 기록',
  '부산 여행',
  '대학 축제',
];

export const dummyAlbums: Album[] = albumTitles.map((title, i) => ({
  id: `album-${i}`,
  title,
  coverColor: coverColors[i % coverColors.length],
  spineColor: spineColors[i % spineColors.length],
  pageCount: Math.floor(Math.random() * 20) + 5,
  createdAt: new Date(2026, 2 - Math.floor(i / 3), 28 - i * 2),
  isShared: i % 3 === 0,
  memberCount: i % 3 === 0 ? Math.floor(Math.random() * 4) + 2 : undefined,
}));
