import { Friend } from '../types/friend';

/*
 * 친구 ↔ 앨범 매핑 (dummyAlbums.ts와 동기화)
 *
 * 김영수#1:  album-0(제주도), album-3(가족나들이), album-5(크리스마스) → 3개
 * 이미영#2:  album-0(제주도), album-3(가족나들이), album-5(크리스마스) → 3개
 * 김지수#3:  album-0(제주도), album-5(크리스마스) → 2개
 * 박서연#4:  album-1(1주년), album-4(벚꽃), album-6(바다), album-8(생일), album-10(부산) → 5개
 * 최민준#5:  album-2(졸업), album-8(생일) → 2개
 * 이도현#7:  album-2(졸업) → 1개
 * 한소희#8:  album-4(벚꽃) → 1개
 * 오승현#10: album-6(바다), album-10(부산), album-11(축제) → 3개
 * 송유진#11: album-7(카페) → 1개
 *
 * albumCoverUrl/Color = 해당 친구의 첫 번째 공유 앨범 커버
 */

export const dummyFriends: Friend[] = [
  // ─── 가족 ───
  {
    id: '1',
    name: '김영수',
    tag: '가족',
    memo: '아빠',
    avatarColor: '#8B7560',
    initial: '영',
    avatarUrl: 'https://picsum.photos/seed/dad42/200/200',
    isAppUser: true,
    sharedAlbumCount: 3,  // album-0, 3, 5
    photoCount: 45,
    albumCoverColor: '#D4878F',  // album-0 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/jeju-ocean/300/400',  // album-0 cover
    profileBgColor: '#A8C4B8',
    profileBgUrl: 'https://picsum.photos/seed/mountain-view/600/400',
  },
  {
    id: '2',
    name: '이미영',
    tag: '가족',
    memo: '엄마',
    avatarColor: '#C4919A',
    initial: '미',
    avatarUrl: 'https://picsum.photos/seed/mom55/200/200',
    isAppUser: true,
    sharedAlbumCount: 3,  // album-0, 3, 5
    photoCount: 62,
    albumCoverColor: '#E8C87A',  // album-3 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/family-picnic/300/400',  // album-3 cover
    profileBgColor: '#D4B8A0',
    profileBgUrl: 'https://picsum.photos/seed/flower-field/600/400',
  },
  {
    id: '3',
    name: '김지수',
    tag: '가족',
    memo: '동생',
    avatarColor: '#92A888',
    initial: '지',
    avatarUrl: 'https://picsum.photos/seed/sis22/200/200',
    isAppUser: true,
    sharedAlbumCount: 2,  // album-0, 5
    photoCount: 28,
    albumCoverColor: '#D4878F',  // album-0 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/jeju-ocean/300/400',  // album-0 cover
    profileBgColor: '#B8C8D8',
    profileBgUrl: 'https://picsum.photos/seed/sky-clouds/600/400',
  },
  {
    id: '9',
    name: '김은주',
    tag: '가족',
    memo: '이모',
    avatarColor: '#B8917A',
    initial: '은',
    avatarUrl: 'https://picsum.photos/seed/aunt33/200/200',
    isAppUser: false,
    sharedAlbumCount: 0,
    photoCount: 8,
  },

  // ─── 연인 ───
  {
    id: '4',
    name: '박서연',
    tag: '연인',
    avatarColor: '#B8818A',
    initial: '서',
    avatarUrl: 'https://picsum.photos/seed/love99/200/200',
    isAppUser: true,
    sharedAlbumCount: 5,  // album-1, 4, 6, 8, 10
    photoCount: 156,
    albumCoverColor: '#6B8EA4',  // album-1 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/couple-love/300/400',  // album-1 cover
    profileBgColor: '#C8A0B8',
    profileBgUrl: 'https://picsum.photos/seed/cherry-blossom/600/400',
  },

  // ─── 친구 ───
  {
    id: '5',
    name: '최민준',
    tag: '친구',
    memo: '대학 동기',
    avatarColor: '#7B8FA3',
    initial: '민',
    avatarUrl: 'https://picsum.photos/seed/bro77/200/200',
    isAppUser: true,
    sharedAlbumCount: 2,  // album-2, 8
    photoCount: 34,
    albumCoverColor: '#7BAA8E',  // album-2 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/graduation-day/300/400',  // album-2 cover
    profileBgColor: '#8BA0B4',
    profileBgUrl: 'https://picsum.photos/seed/cityscape/600/400',
  },
  {
    id: '6',
    name: '정하은',
    tag: '친구',
    memo: '고등학교 친구',
    avatarColor: '#D4A855',
    initial: '하',
    avatarUrl: 'https://picsum.photos/seed/old-pal/200/200',
    isAppUser: false,
    sharedAlbumCount: 0,
    photoCount: 12,
  },
  {
    id: '7',
    name: '이도현',
    tag: '친구',
    memo: '동아리',
    avatarColor: '#859C78',
    initial: '도',
    avatarUrl: 'https://picsum.photos/seed/club88/200/200',
    isAppUser: true,
    sharedAlbumCount: 1,  // album-2
    photoCount: 18,
    albumCoverColor: '#7BAA8E',  // album-2 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/graduation-day/300/400',  // album-2 cover
    profileBgColor: '#A4B890',
    profileBgUrl: 'https://picsum.photos/seed/forest-path/600/400',
  },
  {
    id: '8',
    name: '한소희',
    tag: '친구',
    memo: '같은 팀',
    avatarColor: '#A898B8',
    initial: '소',
    avatarUrl: 'https://picsum.photos/seed/team44/200/200',
    isAppUser: true,
    sharedAlbumCount: 1,  // album-4
    photoCount: 22,
    albumCoverColor: '#9B7EB8',  // album-4 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/sakura-bloom/300/400',  // album-4 cover
    profileBgColor: '#C0B0D0',
    profileBgUrl: 'https://picsum.photos/seed/lavender-field/600/400',
  },
  {
    id: '10',
    name: '오승현',
    tag: '친구',
    memo: '여행 메이트',
    avatarColor: '#5D8CAA',
    initial: '승',
    avatarUrl: 'https://picsum.photos/seed/travel66/200/200',
    isAppUser: true,
    sharedAlbumCount: 3,  // album-6, 10, 11
    photoCount: 78,
    albumCoverColor: '#5D8CAA',  // album-6 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/summer-sea/300/400',  // album-6 cover
    profileBgColor: '#90A8C0',
    profileBgUrl: 'https://picsum.photos/seed/lake-sunset/600/400',
  },
  {
    id: '11',
    name: '송유진',
    tag: '친구',
    memo: '카페 단골',
    avatarColor: '#C4A07A',
    initial: '유',
    avatarUrl: 'https://picsum.photos/seed/cafe11/200/200',
    isAppUser: true,
    sharedAlbumCount: 1,  // album-7
    photoCount: 15,
    albumCoverColor: '#C47878',  // album-7 coverColor
    albumCoverUrl: 'https://picsum.photos/seed/latte-art/300/400',  // album-7 cover
    profileBgColor: '#D8C8A8',
    profileBgUrl: 'https://picsum.photos/seed/cozy-room/600/400',
  },
  {
    id: '12',
    name: '나현우',
    tag: '친구',
    avatarColor: '#6B7D6A',
    initial: '현',
    avatarUrl: 'https://picsum.photos/seed/hyun12/200/200',
    isAppUser: false,
    sharedAlbumCount: 0,
    photoCount: 5,
  },
];
