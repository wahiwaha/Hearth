export type Locale = 'ko' | 'en';

export const translations = {
  ko: {
    // Tabs / Headers
    hearth: 'Hearth',
    archive: 'Archive',
    myPage: '마이페이지',

    // FriendsScreen
    friendCount: (n: number) => `${n}명의 친구`,
    family: '가족',
    lover: '연인',
    friend: '친구',
    work: '직장',
    other: '기타',

    // HearthScreen (Archive)
    albumCount: (n: number) => `${n}개의 앨범`,
    pages: (n: number) => `${n}페이지`,
    photos: (n: number) => `${n}장의 사진`,
    withMembers: (n: number) => `${n}명과 함께`,
    tapToOpen: '탭하여 열기',

    // MyPageScreen
    guest: '게스트',
    collectingMemories: '추억을 모으는 중',
    albums: '앨범',
    friends: '친구',
    photosLabel: '사진',
    notificationSettings: '알림 설정',
    themeChange: '테마 변경',
    languageChange: '언어 변경',
    backupRestore: '백업 및 복원',
    storage: '저장 공간',
    privacy: '개인정보 보호',
    help: '도움말',
    editProfile: '프로필 편집',
    signOut: '로그아웃',

    // ThemeSettingsScreen
    lightMode: '라이트 모드',
    lightModeDesc: '밝은 따뜻한 테마',
    darkMode: '다크 모드',
    darkModeDesc: '어두운 따뜻한 테마',
    systemMode: '시스템 설정',
    systemModeDesc: '기기 설정에 따라 자동 전환',
    preview: '미리보기',
    light: '라이트',
    dark: '다크',

    // Tag map (FriendTag Korean key → display)
    tagMap: {
      '가족': '가족',
      '연인': '연인',
      '친구': '친구',
      '직장': '직장',
      '기타': '기타',
    } as Record<string, string>,

    // FriendsScreen new
    addFriend: '추가',
    customCategory: '직접입력',
    customCategoryPlaceholder: '분류명을 입력하세요',
    shareFriend: '친구 초대',
    shareMessage: '따뜻한 추억을 함께 만들어요. Hearth에서 당신을 기다리고 있어요 🔥\nhttps://hearth.app/invite',

    // AddFriendScreen
    addToCategory: (category: string) => `${category}에 추가`,
    searchPlaceholder: '이름 또는 아이디로 검색',
    noResults: '아직 Hearth에서 찾을 수 없어요',
    addButtonEmotional: '함께 추억 만들기',
    relationPlaceholder: '어떤 관계인가요? (선택)',
    addedSuccessTitle: '님과 함께\n추억을 만들어가요',
    addedSuccessNotification: '상대방에게 "누군가 당신을 소중한 사람으로\n간직하고 있어요 🔥" 알림이 전달됩니다',
    nameLabel: '이름 *',
    namePlaceholder: '이름을 입력하세요',
    accountMatchLabel: 'HEARTH 계정 연동',
    accountMatchHint: '상대방의 Hearth 계정을 연결하면 알림을 보낼 수 있어요',
    tagLabel: '관계',
    relationLabel: '상세 관계',
    memoLabel: '메모 (선택)',
    memoPlaceholder: '예: 아빠, 엄마, 대학동기 — 이름 아래에 표시돼요',
    setProfileImage: '프로필 이미지 지정하기',

    // Language
    korean: '한국어',
    english: 'English',
    languageTitle: '언어 변경',
  },
  en: {
    hearth: 'Hearth',
    archive: 'Archive',
    myPage: 'My Page',

    friendCount: (n: number) => `${n} friends`,
    family: 'Family',
    lover: 'Partner',
    friend: 'Friends',
    work: 'Work',
    other: 'Other',

    albumCount: (n: number) => `${n} albums`,
    pages: (n: number) => `${n} pages`,
    photos: (n: number) => `${n} photos`,
    withMembers: (n: number) => `with ${n} people`,
    tapToOpen: 'Tap to open',

    guest: 'Guest',
    collectingMemories: 'Collecting memories',
    albums: 'Albums',
    friends: 'Friends',
    photosLabel: 'Photos',
    notificationSettings: 'Notifications',
    themeChange: 'Theme',
    languageChange: 'Language',
    backupRestore: 'Backup & Restore',
    storage: 'Storage',
    privacy: 'Privacy',
    help: 'Help',
    editProfile: 'Edit Profile',
    signOut: 'Sign Out',

    lightMode: 'Light Mode',
    lightModeDesc: 'Bright warm theme',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Dark warm theme',
    systemMode: 'System',
    systemModeDesc: 'Follow device settings',
    preview: 'Preview',
    light: 'Light',
    dark: 'Dark',

    tagMap: {
      '가족': 'Family',
      '연인': 'Partner',
      '친구': 'Friends',
      '직장': 'Work',
      '기타': 'Other',
    } as Record<string, string>,

    addFriend: 'Add',
    customCategory: 'Custom',
    customCategoryPlaceholder: 'Enter category name',
    shareFriend: 'Invite Friends',
    shareMessage: "Let's make warm memories together. Someone is waiting for you on Hearth 🔥\nhttps://hearth.app/invite",

    addToCategory: (category: string) => `Add to ${category}`,
    searchPlaceholder: 'Search by name or username',
    noResults: "We couldn't find them on Hearth yet",
    addButtonEmotional: 'Make memories together',
    relationPlaceholder: 'What is your relationship? (optional)',
    addedSuccessTitle: " — let's make\nbeautiful memories together",
    addedSuccessNotification: 'They will receive a notification:\n"Someone is keeping you close to their heart 🔥"',
    nameLabel: 'NAME *',
    namePlaceholder: 'Enter name',
    accountMatchLabel: 'LINK HEARTH ACCOUNT',
    accountMatchHint: 'Link their Hearth account to send them a notification',
    tagLabel: 'RELATIONSHIP',
    relationLabel: 'DETAILS',
    memoLabel: 'MEMO (OPTIONAL)',
    memoPlaceholder: 'e.g. Dad, Mom, College friend — shown under their name',
    setProfileImage: 'Set profile image',

    korean: '한국어',
    english: 'English',
    languageTitle: 'Language',
  },
} as const;

export type TranslationKeys = keyof typeof translations.ko;
