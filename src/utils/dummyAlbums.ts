import { Album, AlbumPage, Collaborator } from '../types/album';
import { colors } from '../theme/colors';

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
  '#D4878F', // 로즈 핑크
  '#6B8EA4', // 스틸 블루
  '#7BAA8E', // 세이지 그린
  '#E8C87A', // 골든 옐로우
  '#9B7EB8', // 라벤더 퍼플
  '#E09E6A', // 피치 오렌지
  '#5D8CAA', // 오션 블루
  '#C47878', // 코랄 레드
  '#6AAA9A', // 틸 그린
  '#D4A0C0', // 모브 핑크
];

const coverImageSeeds = [
  'jeju-ocean',      // 제주도 여행
  'couple-love',     // 우리의 1주년
  'graduation-day',  // 졸업 앨범
  'family-picnic',   // 가족 나들이
  'sakura-bloom',    // 벚꽃 피크닉
  'xmas-lights',     // 크리스마스
  'summer-sea',      // 여름 바다
  'latte-art',       // 카페 투어
  'birthday-cake',   // 생일 파티
  'daily-life',      // 일상 기록
  'busan-haeundae',  // 부산 여행
  'college-fest',    // 대학 축제
];

/* ─── "나" (현재 사용자) — AuthStore DEFAULT_USER와 동기화 ─── */
const ME: Collaborator = {
  id: 'me', name: '김찬영', initial: '찬',
  avatarColor: '#859C78',
  avatarUrl: 'https://picsum.photos/seed/me-chanyoung/200/200',
  role: 'owner', joinedAt: new Date(2025, 6, 1),
};

/*
 * 친구 collaborator 레퍼런스
 * avatarUrl은 dummyFriends.ts의 avatarUrl과 동일한 값 사용
 */
const FRIENDS: Record<string, Collaborator> = {
  '1': { id: '1', name: '김영수', initial: '영', avatarColor: '#8B7560', avatarUrl: 'https://picsum.photos/seed/dad42/200/200', role: 'editor', joinedAt: new Date(2025, 7, 1) },
  '2': { id: '2', name: '이미영', initial: '미', avatarColor: '#C4919A', avatarUrl: 'https://picsum.photos/seed/mom55/200/200', role: 'editor', joinedAt: new Date(2025, 7, 1) },
  '3': { id: '3', name: '김지수', initial: '지', avatarColor: '#92A888', avatarUrl: 'https://picsum.photos/seed/sis22/200/200', role: 'editor', joinedAt: new Date(2025, 8, 1) },
  '4': { id: '4', name: '박서연', initial: '서', avatarColor: '#B8818A', avatarUrl: 'https://picsum.photos/seed/love99/200/200', role: 'editor', joinedAt: new Date(2025, 6, 15) },
  '5': { id: '5', name: '최민준', initial: '민', avatarColor: '#7B8FA3', avatarUrl: 'https://picsum.photos/seed/bro77/200/200', role: 'editor', joinedAt: new Date(2025, 9, 1) },
  '7': { id: '7', name: '이도현', initial: '도', avatarColor: '#859C78', avatarUrl: 'https://picsum.photos/seed/club88/200/200', role: 'editor', joinedAt: new Date(2025, 10, 1) },
  '8': { id: '8', name: '한소희', initial: '소', avatarColor: '#A898B8', avatarUrl: 'https://picsum.photos/seed/team44/200/200', role: 'editor', joinedAt: new Date(2025, 11, 1) },
  '10': { id: '10', name: '오승현', initial: '승', avatarColor: '#5D8CAA', avatarUrl: 'https://picsum.photos/seed/travel66/200/200', role: 'editor', joinedAt: new Date(2025, 8, 15) },
  '11': { id: '11', name: '송유진', initial: '유', avatarColor: '#C4A07A', avatarUrl: 'https://picsum.photos/seed/cafe11/200/200', role: 'editor', joinedAt: new Date(2026, 0, 1) },
};

/*
 * 앨범 ↔ 친구 매핑 (시스템 로직 기반)
 *
 * album-0  제주도 여행 2026   → 가족: 김영수#1, 이미영#2, 김지수#3
 * album-1  우리의 1주년       → 연인: 박서연#4
 * album-2  졸업 앨범          → 대학: 최민준#5, 이도현#7
 * album-3  가족 나들이         → 가족: 김영수#1, 이미영#2
 * album-4  벚꽃 피크닉         → 연인+친구: 박서연#4, 한소희#8
 * album-5  크리스마스 2025     → 가족: 김영수#1, 이미영#2, 김지수#3
 * album-6  여름 바다           → 연인+여행: 박서연#4, 오승현#10
 * album-7  카페 투어           → 친구: 송유진#11
 * album-8  생일 파티           → 연인+친구: 박서연#4, 최민준#5
 * album-9  일상 기록           → 개인 (비공유)
 * album-10 부산 여행           → 여행: 박서연#4, 오승현#10
 * album-11 대학 축제           → 친구: 오승현#10
 *
 * 친구별 공유 앨범 수:
 * 김영수#1:  3 (0,3,5)
 * 이미영#2:  3 (0,3,5)
 * 김지수#3:  2 (0,5)
 * 박서연#4:  5 (1,4,6,8,10)
 * 최민준#5:  2 (2,8)
 * 이도현#7:  1 (2)
 * 한소희#8:  1 (4)
 * 오승현#10: 3 (6,10,11)
 * 송유진#11: 1 (7)
 * 비앱유저 (김은주#9, 정하은#6, 나현우#12): 0
 */
const albumCollaborators: (string[] | null)[] = [
  ['1', '2', '3'],     // 0: 제주도 여행
  ['4'],               // 1: 우리의 1주년
  ['5', '7'],          // 2: 졸업 앨범
  ['1', '2'],          // 3: 가족 나들이
  ['4', '8'],          // 4: 벚꽃 피크닉
  ['1', '2', '3'],     // 5: 크리스마스 2025
  ['4', '10'],         // 6: 여름 바다
  ['11'],              // 7: 카페 투어
  ['4', '5'],          // 8: 생일 파티
  null,                // 9: 일상 기록 (개인)
  ['4', '10'],         // 10: 부산 여행
  ['10'],              // 11: 대학 축제
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

const pageCounts = [12, 8, 15, 10, 7, 14, 11, 6, 9, 18, 13, 8];

/** 더미 페이지 생성 */
function createDummyPages(count: number, albumId: string): AlbumPage[] {
  const pages: AlbumPage[] = [];
  const bgColors = ['#F4EDE2', '#EAE0D0', '#E0D2BC', '#F0E4D0', '#E8DCC8'];
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
  const albumId = `album-${i}`;
  const friendIds = albumCollaborators[i];
  const isShared = friendIds !== null;
  const collabs: Collaborator[] | undefined = isShared
    ? [ME, ...friendIds.map(fid => FRIENDS[fid])]
    : undefined;

  return {
    id: albumId,
    title,
    coverColor: coverColors[i % coverColors.length],
    coverImage: `https://picsum.photos/seed/${coverImageSeeds[i]}/400/530`,
    spineColor: spineColors[i % spineColors.length],
    pageCount: pageCounts[i],
    createdAt: new Date(2026, 2 - Math.floor(i / 3), 28 - i * 2),
    updatedAt: new Date(2026, 2, 1),
    isShared,
    memberCount: isShared ? collabs!.length : undefined,
    visibility: isShared ? 'friends' as const : 'private' as const,
    pages: createDummyPages(pageCounts[i], albumId),
    collaborators: collabs,
  };
});
