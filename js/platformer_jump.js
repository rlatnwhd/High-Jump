// ========================================
// High Jump 게임 JavaScript 코드
// ========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ========================================
// 이미지 로드
// ========================================
const images = {
    greenPlatform: new Image(),
    bluePlatform: new Image(),
    redPlatform: new Image(),
    brownPlatform: new Image(),
    brownPlatformLeft: new Image(),
    brownPlatformRight: new Image(),
    spring: new Image(),
    monster1: new Image(),
    monster2: new Image(),
    monster3: new Image(),
    balloon: new Image(),
    jetpack: new Image(),
    jetpackFire: new Image(),
    bullet: new Image(),
    star: new Image(),
    player: new Image(),
    postit: new Image()
};

images.greenPlatform.src = 'images/green_platform.png';
images.bluePlatform.src = 'images/blue_platform.png';
images.redPlatform.src = 'images/red_platform.png';
images.brownPlatform.src = 'images/brown_platform.png';
images.brownPlatformLeft.src = 'images/brown_platform_left.png';
images.brownPlatformRight.src = 'images/brown_platform_right.png';
images.spring.src = 'images/spring.png';
images.monster1.src = 'images/monster1.png';
images.monster2.src = 'images/monster2.png';
images.monster3.src = 'images/monster3.png';
images.balloon.src = 'images/balloon.png';
images.jetpack.src = 'images/jetpack.png';
images.jetpackFire.src = 'images/jetpack_fire.png';
images.bullet.src = 'images/bullet.png';
images.star.src = 'images/star.png';
images.player.src = 'images/player.png';
images.postit.src = 'images/postit.png';

// 모든 이미지 로드 완료 확인
let imagesLoaded = 0;
const totalImages = 18;

Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            console.log('모든 이미지 로드 완료');
        }
    };
});

// ========================================
// 게임 상수
// ========================================
const GRAVITY = 0.4;
const JUMP_POWER = -13;
const MOVE_SPEED = 7;
const ACCELERATION = 0.5;
const FRICTION = 0.85;
const PLATFORM_WIDTH = 85;
const PLATFORM_HEIGHT = 20;
const PLATFORM_GAP = 80;
const SPRING_JUMP_POWER = -24;

// 플랫폼 타입
const PLATFORM_TYPES = {
    NORMAL: 'normal',
    MOVING: 'moving',
    BREAKING: 'breaking',
    DISAPPEARING: 'disappearing'
};

// ========================================
// 게임 상태
// ========================================
let gameRunning = true;
let score = 0;
let highScore = localStorage.getItem('doodleHighScore') || 0;
let platformSpeed = 0;
let gameOverAnimation = false;
let gameOverY = -500; // 메모장이 내려올 시작 위치
let gameOverTargetY = 200; // 메모장이 멈출 위치
let restartButtonHover = false; // 마우스 호버 상태

let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 150,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0,
    jumping: false,
    // 아이템 상태
    usingBalloon: false,
    balloonStartTime: 0,
    balloonDuration: 3000, // 3초
    usingJetpack: false,
    jetpackStartTime: 0,
    jetpackDuration: 3000, // 3초
    // 뇌진탕 상태
    stunned: false,
    stunnedStartTime: 0,
    stunnedDuration: 2000, // 2초
    starRotation: 0 // 별 회전 각도
};

let items = []; // 아이템 배열
let monsters = []; // 몬스터 배열
let bullets = []; // 총알 배열

let platforms = [];
let baseHeight = 0; // 플레이어가 도달한 최고 높이
let lastPlatformType = PLATFORM_TYPES.NORMAL; // 마지막 발판 타입 추적

// ========================================
// 플랫폼 생성
// ========================================
function createPlatform(y, prevX = null) {
    let x;
    
    if (prevX !== null) {
        // 이전 발판에서 좌우로 적당한 거리에 배치
        const minDistance = 80;
        const maxDistance = 250;
        const direction = Math.random() < 0.5 ? -1 : 1;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        
        x = prevX + (direction * distance);
        
        // 화면 밖으로 나가면 반대편에 배치
        if (x < 30) {
            x = canvas.width - PLATFORM_WIDTH - 30 - Math.random() * 100;
        } else if (x > canvas.width - PLATFORM_WIDTH - 30) {
            x = 30 + Math.random() * 100;
        }
    } else {
        // 첫 발판은 중앙 부근에
        x = canvas.width * 0.3 + Math.random() * (canvas.width * 0.4);
    }
    
    // 플랫폼 타입 결정 (점수에 따라 난이도 증가)
    const rand = Math.random();
    let type = PLATFORM_TYPES.NORMAL;
    
    // 점수에 따른 난이도 조절
    if (score < 2000) {
        // 초반: 쉬움 (대부분 일반 발판)
        if (lastPlatformType === PLATFORM_TYPES.BREAKING) {
            if (rand < 0.15) {
                type = PLATFORM_TYPES.MOVING;
            } else if (rand < 0.25) {
                type = PLATFORM_TYPES.DISAPPEARING;
            }
        } else {
            if (rand < 0.15) {
                type = PLATFORM_TYPES.MOVING;
            } else if (rand < 0.25) {
                type = PLATFORM_TYPES.BREAKING;
            } else if (rand < 0.35) {
                type = PLATFORM_TYPES.DISAPPEARING;
            }
        }
    } else if (score < 4000) {
        // 중반: 보통 (움직이는 발판과 갈색 발판 증가)
        if (lastPlatformType === PLATFORM_TYPES.BREAKING) {
            if (rand < 0.3) {
                type = PLATFORM_TYPES.MOVING;
            } else if (rand < 0.5) {
                type = PLATFORM_TYPES.DISAPPEARING;
            }
        } else {
            if (rand < 0.3) {
                type = PLATFORM_TYPES.MOVING;
            } else if (rand < 0.5) {
                type = PLATFORM_TYPES.BREAKING;
            } else if (rand < 0.65) {
                type = PLATFORM_TYPES.DISAPPEARING;
            }
        }
    } else if (score < 7000) {
        // 후반: 어려움 (갈색 발판 빈번, 빨간 발판 많음)
        if (lastPlatformType === PLATFORM_TYPES.BREAKING) {
            if (rand < 0.05) {
                type = PLATFORM_TYPES.NORMAL; // 5% 일반 발판
            } else if (rand < 0.4) {
                type = PLATFORM_TYPES.MOVING;
            } else if (rand < 0.75) {
                type = PLATFORM_TYPES.DISAPPEARING;
            }
        } else {
            if (rand < 0.05) {
                type = PLATFORM_TYPES.NORMAL; // 5% 일반 발판
            } else if (rand < 0.3) {
                type = PLATFORM_TYPES.MOVING;
            } else if (rand < 0.65) {
                type = PLATFORM_TYPES.BREAKING;
            } else if (rand < 0.95) {
                type = PLATFORM_TYPES.DISAPPEARING;
            }
        }
    } else {
        // 최고 난이도: 매우 어려움 (대부분 특수 발판)
        if (lastPlatformType === PLATFORM_TYPES.BREAKING) {
            if (rand < 0.03) {
                type = PLATFORM_TYPES.NORMAL; // 3% 일반 발판
            } else if (rand < 0.43) {
                type = PLATFORM_TYPES.MOVING;
            } else {
                type = PLATFORM_TYPES.DISAPPEARING;
            }
        } else {
            if (rand < 0.03) {
                type = PLATFORM_TYPES.NORMAL; // 3% 일반 발판
            } else if (rand < 0.23) {
                type = PLATFORM_TYPES.MOVING;
            } else if (rand < 0.63) {
                type = PLATFORM_TYPES.BREAKING;
            } else {
                type = PLATFORM_TYPES.DISAPPEARING;
            }
        }
    }
    
    // 현재 타입을 기록
    lastPlatformType = type;
    
    // 스프링 추가 여부 (20% 확률, 일반 및 움직이는 플랫폼에)
    const hasSpring = (type === PLATFORM_TYPES.NORMAL || type === PLATFORM_TYPES.MOVING) && Math.random() < 0.2;
    
    // 스프링 위치 (플랫폼 길이 내에서 랜덤, 스프링 크기: 20px)
    const springX = hasSpring ? Math.random() * (PLATFORM_WIDTH - 20) : 0;
    
    // 아이템 추가 여부 (4% 확률, 일반 플랫폼에만, 스프링이 없을 때)
    let hasItem = false;
    let itemType = null;
    let itemX = 0;
    if (type === PLATFORM_TYPES.NORMAL && !hasSpring && Math.random() < 0.04) {
        hasItem = true;
        itemType = Math.random() < 0.4 ? 'balloon' : 'jetpack'; // 40% 확률로 풍선 또는 제트팩
        itemX = Math.random() * (PLATFORM_WIDTH - 40); // 아이템 크기: 40px
    }
    
    return {
        x: x,
        y: y,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: type,
        hasSpring: hasSpring,
        springX: springX, // 스프링의 플랫폼 내 상대 위치
        hasItem: hasItem,
        itemType: itemType,
        itemX: itemX,
        itemCollected: false, // 아이템 획득 여부
        // 움직이는 플랫폼 속성
        moveSpeed: type === PLATFORM_TYPES.MOVING ? 2 : 0,
        moveDirection: 1,
        // 부숴지는 플랫폼 속성
        breaking: false,
        breakFrame: 0,
        leftPieceX: 0,  // 왼쪽 조각 X 위치
        leftPieceY: 0,  // 왼쪽 조각 Y 위치
        rightPieceX: 0, // 오른쪽 조각 X 위치
        rightPieceY: 0, // 오른쪽 조각 Y 위치
        leftPieceVx: -2,  // 왼쪽 조각 X 속도 (왼쪽으로)
        leftPieceVy: 0,  // 왼쪽 조각 Y 속도
        rightPieceVx: 2, // 오른쪽 조각 X 속도 (오른쪽으로)
        rightPieceVy: 0, // 오른쪽 조각 Y 속도
        leftPieceRotation: 0,  // 왼쪽 조각 회전 각도
        rightPieceRotation: 0, // 오른쪽 조각 회전 각도
        // 사라지는 플랫폼 속성
        touched: false
    };
}

// 초기 플랫폼 생성
function initPlatforms() {
    platforms = [];
    items = []; // 아이템 배열 초기화
    monsters = []; // 몬스터 배열 초기화
    
    // 시작 플랫폼 (항상 일반 플랫폼)
    platforms.push({
        x: canvas.width / 2 - PLATFORM_WIDTH / 2,
        y: canvas.height - 80,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: PLATFORM_TYPES.NORMAL,
        hasSpring: false,
        springX: 0,
        moveSpeed: 0,
        moveDirection: 1,
        breaking: false,
        breakFrame: 0,
        leftPieceX: 0,
        leftPieceY: 0,
        rightPieceX: 0,
        rightPieceY: 0,
        leftPieceVx: -2,
        leftPieceVy: 0,
        rightPieceVx: 2,
        rightPieceVy: 0,
        leftPieceRotation: 0,
        rightPieceRotation: 0,
        touched: false
    });
    
    // 위로 플랫폼 생성
    for (let i = canvas.height - 150; i > -400; i -= PLATFORM_GAP) {
        const lastPlatform = platforms[platforms.length - 1];
        platforms.push(createPlatform(i, lastPlatform.x));
    }
}

// ========================================
// 키 입력 처리
// ========================================
let keys = {};
let spacePressed = false; // 스페이스바 중복 발사 방지

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // 스페이스바로 총알 발사 (한 번만)
    if ((e.key === ' ' || e.code === 'Space') && !spacePressed) {
        e.preventDefault(); // 스크롤 방지
        spacePressed = true;
        bullets.push({
            x: player.x + player.width / 2 - 10,
            y: player.y,
            width: 20,
            height: 30,
            vy: -15 // 위로 빠르게 이동
        });
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    
    // 스페이스바를 떼면 다시 발사 가능
    if (e.key === ' ' || e.code === 'Space') {
        spacePressed = false;
    }
});

// ========================================
// 충돌 감지
// ========================================
function checkCollision(player, platform) {
    return player.x < platform.x + platform.width &&
           player.x + player.width > platform.x &&
           player.y + player.height > platform.y &&
           player.y + player.height < platform.y + platform.height;
}

// ========================================
// 게임 로직 업데이트
// ========================================
function update() {
    if (!gameRunning) return;
    
    // 아이템 효과 처리
    const currentTime = Date.now();
    
    // 뇌진탕 상태 체크
    if (player.stunned) {
        const elapsed = currentTime - player.stunnedStartTime;
        if (elapsed < player.stunnedDuration) {
            // 뇌진탕 중에는 아래로 떨어짐
            player.vy = 5; // 빠르게 떨어짐
            player.vx = 0; // 좌우 이동 불가
            player.starRotation += 0.2; // 별 회전
        } else {
            player.stunned = false;
        }
    }
    
    // 풍선 효과 (점점 빠르게 위로)
    if (player.usingBalloon && !player.stunned) {
        const elapsed = currentTime - player.balloonStartTime;
        if (elapsed < player.balloonDuration) {
            // 0 ~ 3초 동안 점점 빠르게
            const progress = elapsed / player.balloonDuration;
            const speed = -5 - (progress * 15); // -5에서 -20까지 증가
            player.vy = speed;
        } else {
            player.usingBalloon = false;
        }
    }
    
    // 제트팩 효과 (일정한 속도로 위로)
    if (player.usingJetpack && !player.stunned) {
        const elapsed = currentTime - player.jetpackStartTime;
        if (elapsed < player.jetpackDuration) {
            player.vy = -25; // 일정한 속도 (더 빠르게)
        } else {
            player.usingJetpack = false;
        }
    }
    
    // 좌우 이동 (관성 추가) - 뇌진탕 중이 아닐 때만
    if (!player.stunned) {
        if (keys['ArrowLeft']) {
            player.vx -= ACCELERATION;
            player.vx = Math.max(player.vx, -MOVE_SPEED);
        } else if (keys['ArrowRight']) {
            player.vx += ACCELERATION;
            player.vx = Math.min(player.vx, MOVE_SPEED);
        } else {
            // 마찰력 적용
            player.vx *= FRICTION;
            if (Math.abs(player.vx) < 0.1) player.vx = 0;
        }
    }
    
    // 화면 양 끝 통과
    player.x += player.vx;
    if (player.x + player.width < 0) {
        player.x = canvas.width;
    }
    if (player.x > canvas.width) {
        player.x = -player.width;
    }
    
    // 중력 적용 (아이템 사용 중이거나 뇌진탕 중이 아닐 때만)
    if (!player.usingBalloon && !player.usingJetpack && !player.stunned) {
        player.vy += GRAVITY;
    }
    player.y += player.vy;
    
    // 몬스터 업데이트
    for (let monster of monsters) {
        if (monster.moveType === 'horizontal') {
            // 좌우 이동
            monster.x += monster.vx;
            
            // 벽에 부딥히면 반대 방향
            if (monster.x <= 0 || monster.x + monster.width >= canvas.width) {
                monster.vx *= -1;
            }
        } else if (monster.moveType === 'circle') {
            // 원형 회전
            monster.angle += monster.angleSpeed;
            monster.x = monster.centerX + Math.cos(monster.angle) * monster.radius - monster.width / 2;
            monster.y = monster.centerY + Math.sin(monster.angle) * monster.radius - monster.height / 2;
        }
    }
    
    // 총알 업데이트
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y += bullet.vy;
        
        // 화면 밖으로 나가면 제거
        if (bullet.y < -bullet.height) {
            bullets.splice(i, 1);
            continue;
        }
        
        // 몬스터와 충돌 검사
        for (let j = monsters.length - 1; j >= 0; j--) {
            const monster = monsters[j];
            if (bullet.x < monster.x + monster.width &&
                bullet.x + bullet.width > monster.x &&
                bullet.y < monster.y + monster.height &&
                bullet.y + bullet.height > monster.y) {
                
                // 몬스터와 총알 모두 제거
                monsters.splice(j, 1);
                bullets.splice(i, 1);
                break;
            }
        }
    }
    
    // 플랫폼 이동 업데이트
    for (let platform of platforms) {
        if (platform.type === PLATFORM_TYPES.MOVING) {
            platform.x += platform.moveSpeed * platform.moveDirection;
            
            // 양 끝에 닿으면 방향 전환
            if (platform.x <= 0 || platform.x + platform.width >= canvas.width) {
                platform.moveDirection *= -1;
            }
        }
        
        // 부숴지는 플랫폼 애니메이션
        if (platform.breaking) {
            platform.breakFrame++;
            
            // 조각들에 중력 적용
            platform.leftPieceVy += GRAVITY * 0.8;
            platform.rightPieceVy += GRAVITY * 0.8;
            
            // 위치 업데이트 (왼쪽은 왼쪽으로, 오른쪽은 오른쪽으로)
            platform.leftPieceX += platform.leftPieceVx;
            platform.leftPieceY += platform.leftPieceVy;
            platform.rightPieceX += platform.rightPieceVx;
            platform.rightPieceY += platform.rightPieceVy;
            
            // 회전 업데이트 (45도씩 회전)
            platform.leftPieceRotation += 0.08;  // 왼쪽 조각은 시계 반대방향으로
            platform.rightPieceRotation -= 0.08; // 오른쪽 조각은 시계 방향으로
            
            // 충분히 떨어지면 제거
            if (platform.breakFrame > 60 || platform.leftPieceY > canvas.height) {
                platforms.splice(platforms.indexOf(platform), 1);
            }
        }
    }
    
    // 플랫폼 충돌 체크 (아래로 떨어질 때만)
    if (player.vy > 0) {
        for (let platform of platforms) {
            // 이미 부숴지는 중이거나 사라진 플랫폼은 충돌 무시
            if (platform.type === PLATFORM_TYPES.BREAKING && platform.breaking) continue;
            if (platform.type === PLATFORM_TYPES.DISAPPEARING && platform.touched) continue;
            
            if (checkCollision(player, platform)) {
                // 갈색 발판이면 부수기만 하고 점프 안함 (뚫고 지나감)
                if (platform.type === PLATFORM_TYPES.BREAKING) {
                    platform.breaking = true;
                    continue; // 점프 처리 안하고 다음 플랫폼으로
                }
                
                // 스프링을 정확히 밟았는지 체크
                let hitSpring = false;
                if (platform.hasSpring) {
                    const springAbsX = platform.x + platform.springX;
                    const springWidth = 20;
                    // 플레이어가 스프링 영역과 겹치는지 확인
                    if (player.x + player.width > springAbsX && player.x < springAbsX + springWidth) {
                        hitSpring = true;
                    }
                }
                
                // 스프링 밟으면 높게, 아니면 일반 점프
                if (hitSpring) {
                    player.vy = SPRING_JUMP_POWER;
                } else {
                    player.vy = JUMP_POWER;
                }
                
                player.jumping = true;
                
                // 사라지는 플랫폼 처리
                if (platform.type === PLATFORM_TYPES.DISAPPEARING) {
                    platform.touched = true;
                }
            }
        }
    }
    
    // 아이템 충돌 체크
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y) {
            
            // 아이템 획득
            if (item.type === 'balloon') {
                player.usingBalloon = true;
                player.balloonStartTime = Date.now();
                player.usingJetpack = false; // 다른 아이템 효과 취소
            } else if (item.type === 'jetpack') {
                player.usingJetpack = true;
                player.jetpackStartTime = Date.now();
                player.usingBalloon = false; // 다른 아이템 효과 취소
            }
            
            items.splice(i, 1);
        }
    }
    
    // 플랫폼 위 아이템 충돌 체크
    platforms.forEach(platform => {
        if (platform.hasItem && !platform.itemCollected) {
            const itemX = platform.x + platform.itemX;
            const itemY = platform.y - 50;
            const itemWidth = 40;
            const itemHeight = 50;
            
            if (player.x < itemX + itemWidth &&
                player.x + player.width > itemX &&
                player.y < itemY + itemHeight &&
                player.y + player.height > itemY) {
                
                // 아이템 획득
                if (platform.itemType === 'balloon') {
                    player.usingBalloon = true;
                    player.balloonStartTime = Date.now();
                    player.usingJetpack = false;
                } else if (platform.itemType === 'jetpack') {
                    player.usingJetpack = true;
                    player.jetpackStartTime = Date.now();
                    player.usingBalloon = false;
                }
                
                platform.itemCollected = true;
            }
        }
    });
    
    // 몬스터 충돌 체크
    if (!player.stunned) {
        for (let monster of monsters) {
            if (player.x < monster.x + monster.width &&
                player.x + player.width > monster.x &&
                player.y < monster.y + monster.height &&
                player.y + player.height > monster.y) {
                
                // 뇌진탕 상태로 전환
                player.stunned = true;
                player.stunnedStartTime = Date.now();
                player.usingBalloon = false;
                player.usingJetpack = false;
            }
        }
    }
    
    // 플레이어가 화면 중간보다 위로 올라가면 화면 스크롤
    if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        platformSpeed = diff;
        
        // 점수 증가 (천천히)
        score += Math.floor(diff * 0.5);
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('doodleHighScore', highScore);
        }
    } else {
        platformSpeed = 0;
    }
    
    // 플랫폼 아래로 이동
    for (let i = platforms.length - 1; i >= 0; i--) {
        platforms[i].y += platformSpeed;
        
        // 화면 아래로 벗어난 플랫폼 제거
        if (platforms[i].y > canvas.height) {
            platforms.splice(i, 1);
        }
    }
    
    // 아이템 아래로 이동
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].y += platformSpeed;
        
        // 화면 아래로 벗어난 아이템 제거
        if (items[i].y > canvas.height) {
            items.splice(i, 1);
        }
    }
    
    // 몬스터 아래로 이동
    for (let i = monsters.length - 1; i >= 0; i--) {
        monsters[i].y += platformSpeed;
        
        // 화면 아래로 벗어난 몬스터 제거
        if (monsters[i].y > canvas.height) {
            monsters.splice(i, 1);
        }
    }
    
    // 새 플랫폼 생성
    while (platforms.length < 15) {
        const lastPlatform = platforms[platforms.length - 1];
        const newY = lastPlatform.y - PLATFORM_GAP;
        platforms.push(createPlatform(newY, lastPlatform.x));
        
        // 점수가 2000 이상일 때, 3% 확률로 몬스터 생성
        if (score >= 2000 && Math.random() < 0.03) {
            const monsterTypes = ['monster1', 'monster2', 'monster3'];
            const moveTypes = ['horizontal', 'circle'];
            const randomMoveType = moveTypes[Math.floor(Math.random() * 2)];
            const randomImageType = monsterTypes[Math.floor(Math.random() * 3)];
            
            if (randomMoveType === 'horizontal') {
                monsters.push({
                    x: Math.random() * (canvas.width - 120),
                    y: newY - 50,
                    width: 120,
                    height: 120,
                    vx: Math.random() < 0.5 ? 2 : -2, // 랜덤 방향
                    moveType: 'horizontal',
                    imageType: randomImageType
                });
            } else {
                const centerX = Math.random() * canvas.width;
                monsters.push({
                    x: centerX,
                    y: newY - 50,
                    width: 120,
                    height: 120,
                    moveType: 'circle',
                    centerX: centerX,
                    centerY: newY - 50,
                    radius: 20,
                    angle: Math.random() * Math.PI * 2, // 랜덤 시작 각도
                    angleSpeed: 0.05,
                    imageType: randomImageType
                });
            }
        }
    }
    
    // 게임 오버 체크
    if (player.y > canvas.height) {
        gameOver();
    }
}

// ========================================
// 렌더링
// ========================================
function draw() {
    // 메모장 느낌의 배경 (은은한 베이지 톤)
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 메모장 줄 그리기 (수평선 - 연한 회색)
    ctx.strokeStyle = '#d3d3d3';
    ctx.lineWidth = 1;
    const lineSpacing = 30;
    for (let y = lineSpacing; y < canvas.height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // 왼쪽 여백선 (연한 빨간 세로선)
    ctx.strokeStyle = '#ff9999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, canvas.height);
    ctx.stroke();
    
    // 플랫폼 그리기
    ctx.lineWidth = 2;
    
    for (let platform of platforms) {
        // 사라진 플랫폼은 그리지 않음
        if (platform.type === PLATFORM_TYPES.DISAPPEARING && platform.touched) {
            continue;
        }
        
        // 갈색 플랫폼이 부서지는 중이면 조각들을 그림
        if (platform.type === PLATFORM_TYPES.BREAKING && platform.breaking) {
            const halfWidth = platform.width / 2;
            
            // 왼쪽 조각 (회전하면서 왼쪽으로 이동하며 떨어짐)
            ctx.save();
            ctx.translate(
                platform.x + platform.leftPieceX + halfWidth / 2, 
                platform.y + platform.leftPieceY + platform.height / 2
            );
            ctx.rotate(platform.leftPieceRotation);
            ctx.drawImage(
                images.brownPlatformLeft, 
                -halfWidth / 2, 
                -platform.height / 2, 
                halfWidth, 
                platform.height
            );
            ctx.restore();
            
            // 오른쪽 조각 (회전하면서 오른쪽으로 이동하며 떨어짐)
            ctx.save();
            ctx.translate(
                platform.x + halfWidth + platform.rightPieceX + halfWidth / 2, 
                platform.y + platform.rightPieceY + platform.height / 2
            );
            ctx.rotate(platform.rightPieceRotation);
            ctx.drawImage(
                images.brownPlatformRight, 
                -halfWidth / 2, 
                -platform.height / 2, 
                halfWidth, 
                platform.height
            );
            ctx.restore();
            
            continue; // 다음 플랫폼으로
        }
        
        // 플랫폼 타입별 이미지
        let platformImage;
        switch (platform.type) {
            case PLATFORM_TYPES.MOVING:
                platformImage = images.bluePlatform;
                break;
            case PLATFORM_TYPES.BREAKING:
                platformImage = images.brownPlatform;
                break;
            case PLATFORM_TYPES.DISAPPEARING:
                platformImage = images.redPlatform;
                break;
            default: // NORMAL
                platformImage = images.greenPlatform;
        }
        
        // 이미지로 플랫폼 그리기
        ctx.drawImage(platformImage, platform.x, platform.y, platform.width, platform.height);
        
        // 스프링 그리기
        if (platform.hasSpring) {
            const springX = platform.x + platform.springX;
            const springY = platform.y - 20;
            
            // 스프링 이미지
            ctx.drawImage(images.spring, springX, springY, 20, 20);
        }
    }
    
    // 아이템 그리기 (items 배열에서)
    for (let item of items) {
        if (item.type === 'balloon') {
            // 풍선 이미지
            ctx.drawImage(images.balloon, item.x, item.y, item.width, item.height);
        } else if (item.type === 'jetpack') {
            // 제트팩 이미지
            ctx.drawImage(images.jetpack, item.x, item.y, item.width, item.height);
        }
    }
    
    // 플랫폼 위 아이템 그리기
    platforms.forEach(platform => {
        if (platform.hasItem && !platform.itemCollected) {
            const itemX = platform.x + platform.itemX;
            const itemY = platform.y - 50; // 아이템 높이만큼 위에 표시
            
            if (platform.itemType === 'balloon') {
                ctx.drawImage(images.balloon, itemX, itemY, 40, 50);
            } else if (platform.itemType === 'jetpack') {
                ctx.drawImage(images.jetpack, itemX, itemY, 40, 50);
            }
        }
    });
    
    // 몬스터 그리기
    monsters.forEach(monster => {
        // 몬스터 이미지 그리기 (타입에 따라)
        const monsterImage = images[monster.imageType];
        ctx.drawImage(monsterImage, monster.x, monster.y, monster.width, monster.height);
    });
    
    // 총알 그리기 (bullet.png)
    bullets.forEach(bullet => {
        ctx.drawImage(images.bullet, bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // 제트팩 착용 시 등 뒤에 제트팩과 불꽃 표시
    if (player.usingJetpack) {
        ctx.save();
        if (player.vx > 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(images.jetpack, -(player.x + 15), player.y, 25, 30);
            ctx.drawImage(images.jetpackFire, -(player.x + 17), player.y + 28, 30, 25);
        } else {
            ctx.drawImage(images.jetpack, player.x + player.width - 15, player.y, 25, 30);
            ctx.drawImage(images.jetpackFire, player.x + player.width - 17, player.y + 28, 30, 25);
        }
        ctx.restore();
    }
    
    // 플레이어 그리기 (player.png) - 좌우 플립
    ctx.save();
    if (player.vx > 0) {
        ctx.scale(-1, 1);
        ctx.drawImage(images.player, -player.x - player.width, player.y, player.width, player.height);
    } else {
        ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
    }
    ctx.restore();
    
    // 풍선 착용 시 머리 위에 풍선 표시
    if (player.usingBalloon) {
        ctx.drawImage(images.balloon, player.x + player.width / 2 - 20, player.y - 50, 40, 50);
    }
    
    // 기절 상태일 때 빙글빙글 도는 별 표시 (3D 회전 효과)
    if (player.stunned) {
        const starCenterX = player.x + player.width / 2;
        const starCenterY = player.y - 25;
        const starCount = 3;
        const orbitRadius = 20; // 궤도 반경
        
        for (let i = 0; i < starCount; i++) {
            // 각 별의 각도 (120도씩 분산)
            const angle = player.starRotation + (i * Math.PI * 2 / starCount);
            
            // 3D 회전 효과: X축은 그대로, Z축(깊이)은 sin으로 계산
            const starX = starCenterX + Math.cos(angle) * orbitRadius;
            const depth = Math.sin(angle); // -1(뒤) ~ 1(앞)
            
            // 깊이에 따른 Y 오프셋 (타원 궤도 효과)
            const starY = starCenterY + depth * 8;
            
            // 깊이에 따른 크기 조절 (뒤에 있으면 작게, 앞에 있으면 크게)
            const scale = 0.6 + (depth * 0.4 + 0.4) * 0.4; // 0.6 ~ 1.0
            const starSize = 20 * scale;
            
            // 깊이에 따른 투명도 (뒤에 있으면 흐리게)
            const alpha = 0.5 + (depth * 0.5 + 0.5) * 0.5; // 0.5 ~ 1.0
            
            // 별 이미지 그리기
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.drawImage(images.star, starX - starSize/2, starY - starSize/2, starSize, starSize);
            ctx.restore();
        }
    }
    
    // 점수 표시 (캔버스 상단 왼쪽)
    ctx.fillStyle = '#000';
    ctx.font = 'bold 40px OngleIpSeaBreeze, cursive';
    ctx.textAlign = 'left';
    ctx.fillText(Math.floor(score), 20, 50);
    
    // 게임오버 포스트잇 애니메이션
    if (gameOverAnimation) {
        // 포스트잇이 위에서 내려오는 애니메이션
        if (gameOverY < gameOverTargetY) {
            gameOverY += 15; // 내려오는 속도
        }
        
        // 포스트잇 이미지 사용
        ctx.drawImage(images.postit, canvas.width / 2 - 250, gameOverY, 500, 400);
        
        // 게임오버 텍스트
        ctx.fillStyle = '#333';
        ctx.font = 'bold 60px OngleIpSeaBreeze, cursive';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, gameOverY + 120);
        
        // 점수 텍스트
        ctx.font = 'bold 40px OngleIpSeaBreeze, cursive';
        ctx.fillText('Score: ' + Math.floor(score), canvas.width / 2, gameOverY + 200);
        
        // 재시작 버튼 영역
        const buttonX = canvas.width / 2 - 120;
        const buttonY = gameOverY + 250;
        const buttonWidth = 240;
        const buttonHeight = 60;
        
        // 호버 이펝트 (글씨 크기와 색상만)
        if (restartButtonHover) {
            ctx.fillStyle = '#f57f17'; // 주황색
            ctx.font = 'bold 36px OngleIpSeaBreeze, cursive';
        } else {
            ctx.fillStyle = '#333';
            ctx.font = '30px OngleIpSeaBreeze, cursive';
        }
        
        // 재시작 텍스트
        ctx.fillText('Click to Restart', canvas.width / 2, gameOverY + 285);
    }
}

// 마우스 이동 이벤트 (호버 감지)
canvas.addEventListener('mousemove', (e) => {
    if (gameOverAnimation) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        const buttonX = canvas.width / 2 - 120;
        const buttonY = gameOverY + 260;
        const buttonWidth = 240;
        const buttonHeight = 50;
        
        // 버튼 영역에 마우스가 있는지 확인
        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
            restartButtonHover = true;
            canvas.style.cursor = 'pointer';
        } else {
            restartButtonHover = false;
            canvas.style.cursor = 'default';
        }
    }
});

// 캔버스 클릭으로 재시작
canvas.addEventListener('click', (e) => {
    if (gameOverAnimation) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        const buttonX = canvas.width / 2 - 120;
        const buttonY = gameOverY + 260;
        const buttonWidth = 240;
        const buttonHeight = 50;
        
        // 버튼 영역 클릭 시에만 재시작
        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
            restartGame();
        }
    }
});

// ========================================
// UI 업데이트
// ========================================
function updateUI() {
    // 점수판이 제거되었으므로 UI 업데이트 불필요
}

// ========================================
// 게임 오버
// ========================================
function gameOver() {
    gameRunning = false;
    gameOverAnimation = true;
    gameOverY = -500;
}

// ========================================
// 게임 재시작
// ========================================
function restartGame() {
    gameRunning = true;
    gameOverAnimation = false;
    gameOverY = -500;
    score = 0;
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 150;
    player.vx = 0;
    player.vy = 0;
    player.jumping = false;
    player.usingBalloon = false;
    player.usingJetpack = false;
    player.stunned = false;
    baseHeight = 0;
    platformSpeed = 0;
    bullets = [];
    spacePressed = false;
    
    initPlatforms();
}

// 전체화면 버튼 이벤트
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    const container = document.getElementById('gameContainer');
    
    if (!document.fullscreenElement) {
        // 전체화면 진입
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
    } else {
        // 전체화면 나가기
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
});

// ========================================
// 게임 루프
// ========================================
function gameLoop() {
    update();
    draw();
    updateUI();
    requestAnimationFrame(gameLoop);
}

// ========================================
// 게임 시작
// ========================================
initPlatforms();
updateUI();
gameLoop();
