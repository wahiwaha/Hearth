import { Album, AlbumPage } from '../types/album';
import { colors } from '../theme';

const spineColors = [
  colors.spineDustyRose,
  colors.spineSlate,
  colors.spineSage,
  colors.spineCream,
  colors.spineAmber,
  colors.spineLavender,
  colors.spineTerra,
  colors.spineMoss,
  colors.spineNavy,
  colors.spinePeach,
];

const coverColors = [
  '#C4919A', '#7B8FA3', '#92A888', '#DDD0B8',
  '#D4A855', '#A898B8', '#B8917A', '#8A9E78',
  '#5B6E85', '#D4A898',
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

/** 더미 페이지 생성 */
function createDummyPages(count: number, albumId: string): AlbumPage[] {
  const pages: AlbumPage[] = [];
  const bgColors = ['#FDFAF5', '#F7F2EA', '#F0E8DB', '#FFF8F0', '#F5F0E8'];
  for (let i = 0; i < count; i++) {
    pages.push({
      id: `${albumId}-page-${i}`,
      pageNumber: i,
      backgroundColor: bgColors[i % bgColors.length],
      elements: [],
      createdAt: new Date(2026, 1, 1),
      updatedAt: new Date(2026, 1, 1),
    });
  }
  return pages;
}

export const dummyAlbums: Album[] = albumTitles.map((title, i) => {
  const pageCount = Math.floor(Math.random() * 20) + 5;
  const albumId = `album-${i}`;
  return {
    id: albumId,
    title,
    coverColor: coverColors[i % coverColors.length],
    spineColor: spineColors[i % spineColors.length],
    pageCount,
    createdAt: new Date(2026, 2 - Math.floor(i / 3), 28 - i * 2),
    updatedAt: new Date(2026, 2, 1),
    isShared: i % 3 === 0,
    memberCount: i % 3 === 0 ? Math.floor(Math.random() * 4) + 2 : undefined,
    visibility: i % 3 === 0 ? 'friends' : 'private',
    pages: createDummyPages(pageCount, albumId),
    collaborators: i % 3 === 0 ? [
      { id: 'me', name: '김찬영', initial: '찬', avatarColor: colors.sage, role: 'owner' as const, joinedAt: new Date() },
      { id: '4', name: '박서연', initial: '서', avatarColor: '#B8818A', role: 'editor' as const, joinedAt: new Date() },
    ] : undefined,
  };
});
